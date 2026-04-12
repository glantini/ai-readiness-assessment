'use server'

/**
 * Server action: generate and save an AI narrative for a completed assessment.
 *
 * Calls Claude API (non-streaming). For the streaming variant used by the
 * report page UI, see /app/api/reports/[id]/generate/route.ts.
 */

import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getLayer1Tier, getLayer2Tier } from '@/lib/scoring'
import {
  REPORT_SYSTEM_PROMPT,
  buildReportPrompt,
  findLowestQuestion,
  getCheckedSymptoms,
  parseNarrativeBlocks,
} from '@/lib/reportGeneration'
import type { Assessment, CategoryScore, SectionScore, Layer1Scores, Layer2Scores, ProductScore } from '@/types'

export async function generateReport(assessmentId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = createServiceClient()

  // ── 1. Fetch assessment ──────────────────────────────────────────────────
  const { data: assessment, error: aErr } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single()

  if (aErr || !assessment) {
    return { success: false, error: 'Assessment not found' }
  }

  // ── 2. Fetch report scores ───────────────────────────────────────────────
  const { data: report } = await supabase
    .from('reports')
    .select('ai_overall_score, ai_category_scores, agentforce_index, agentforce_section_scores, agentforce_product_scores, edition_flag')
    .eq('assessment_id', assessmentId)
    .single()

  if (!report?.ai_overall_score) {
    return {
      success: false,
      error: 'Scores not yet calculated. Run scoring first.',
    }
  }

  // ── 3. Fetch snapshot responses ──────────────────────────────────────────
  const { data: snapshotRows } = await supabase
    .from('responses')
    .select('question_id, value')
    .eq('assessment_id', assessmentId)
    .eq('layer', 'snapshot')

  const snapshotMap: Record<string, boolean> = {}
  for (const row of snapshotRows ?? []) {
    snapshotMap[row.question_id] = row.value === true
  }

  // ── 4. Fetch layer1 responses to find the lowest-scoring question ────────
  const { data: layer1Rows } = await supabase
    .from('responses')
    .select('question_id, value')
    .eq('assessment_id', assessmentId)
    .eq('layer', 'layer1')

  const layer1Map: Record<string, number> = {}
  for (const row of layer1Rows ?? []) {
    const v = typeof row.value === 'number' ? row.value : Number(row.value)
    if (!Number.isNaN(v)) layer1Map[row.question_id] = v
  }

  // ── 5. Build prompt ──────────────────────────────────────────────────────
  const a = assessment as Assessment

  const l1: Layer1Scores = {
    overall: report.ai_overall_score as number,
    categories: (report.ai_category_scores ?? []) as CategoryScore[],
    tier: getLayer1Tier(report.ai_overall_score as number),
  }

  const l2: Layer2Scores | null = report.agentforce_index != null
    ? {
        overall: report.agentforce_index as number,
        sections: (report.agentforce_section_scores ?? []) as SectionScore[],
        productScores: (report.agentforce_product_scores ?? []) as ProductScore[],
        edition_flag: (report.edition_flag ?? false) as boolean,
        tier: getLayer2Tier(report.agentforce_index as number),
      }
    : null

  const productScores: ProductScore[] | null = (report.agentforce_product_scores ?? null) as ProductScore[] | null

  const checkedSymptoms = getCheckedSymptoms(snapshotMap)
  const lowestQuestion = findLowestQuestion(layer1Map)
  const userPrompt = buildReportPrompt(a, l1, l2, productScores, checkedSymptoms, lowestQuestion)

  // ── 6. Call Claude ───────────────────────────────────────────────────────
  const anthropic = new Anthropic()

  let fullText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: REPORT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    for (const block of message.content) {
      if (block.type === 'text') fullText += block.text
    }
  } catch (err) {
    return { success: false, error: `Claude API error: ${String(err)}` }
  }

  // ── 7. Parse JSON blocks ─────────────────────────────────────────────────
  const { block1, block2 } = parseNarrativeBlocks(fullText)

  if (!block1) {
    return { success: false, error: 'Failed to parse narrative JSON from Claude response' }
  }

  // ── 8. Save to reports table ─────────────────────────────────────────────
  const { error: saveErr } = await supabase
    .from('reports')
    .update({
      ai_narrative_json: block1,
      agentforce_narrative_json: block2 ?? null,
      report_status: 'draft',
    })
    .eq('assessment_id', assessmentId)

  if (saveErr) {
    return { success: false, error: `Failed to save narrative: ${saveErr.message}` }
  }

  revalidatePath(`/dashboard/assessments/${assessmentId}/report`)

  return { success: true }
}

// ─── Approve report server action ─────────────────────────────────────────────

export async function approveReport(
  assessmentId: string,
  narrative: object,
  agentforceNarrative: object | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('reports')
    .update({
      ai_narrative_json: narrative,
      agentforce_narrative_json: agentforceNarrative ?? null,
      report_status: 'approved',
    })
    .eq('assessment_id', assessmentId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/assessments/${assessmentId}/report`)
  return { success: true }
}
