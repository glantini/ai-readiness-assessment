'use server'

/**
 * Server action: generate and save an AI narrative for a completed assessment.
 *
 * Calls Claude API (non-streaming). For the streaming variant used by the
 * report page UI, see /app/api/reports/[id]/generate/route.ts.
 */

import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import {
  REPORT_SYSTEM_PROMPT,
  buildReportPrompt,
  findLowestQuestion,
  getCheckedSymptoms,
  parseNarrativeBlocks,
} from '@/lib/reportGeneration'
import { AEIntelligenceDoc } from '@/lib/pdf/AEIntelligence'
import type {
  Assessment,
  Layer1Scores,
  Layer2Scores,
  ProductScore,
  ReportNarrative,
  AgentforceNarrative,
} from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    .select('layer1_scores, layer2_scores, product_scores')
    .eq('assessment_id', assessmentId)
    .single()

  if (!report?.layer1_scores) {
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
  const l1 = report.layer1_scores as Layer1Scores
  const l2 = report.layer2_scores as Layer2Scores | null
  const productScores = report.product_scores as ProductScore[] | null

  const checkedSymptoms = getCheckedSymptoms(snapshotMap)
  const lowestQuestion = findLowestQuestion(layer1Map)
  const userPrompt = buildReportPrompt(a, l1, l2, productScores, checkedSymptoms, lowestQuestion)

  // ── 6. Call Claude ───────────────────────────────────────────────────────
  const anthropic = new Anthropic()

  let fullText = ''
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
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
  // Debug: confirm the new recommendation structure before saving
  const sampleCat = block1.categories?.AIStrategy
  console.log('[generateReport] Saving narrative. Sample recommendation format:', {
    assessmentId,
    hasBlock1: !!block1,
    hasBlock2: !!block2,
    sampleRecommendation: sampleCat?.recommendations?.[0],
    isRichFormat: typeof sampleCat?.recommendations?.[0] === 'object',
  })

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

  revalidatePath(`/admin/assessments/${assessmentId}/report`)

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

  // Send AE Intelligence email (fire-and-forget — don't block approval)
  sendAEIntelligenceEmail(assessmentId).catch((err) => {
    console.error('[approveReport] Failed to send AE Intelligence email:', err)
  })

  revalidatePath(`/admin/assessments/${assessmentId}/report`)
  return { success: true }
}

// ─── AE Intelligence email on approval ───────────────────────────────────────

async function sendAEIntelligenceEmail(assessmentId: string): Promise<void> {
  const supabase = createServiceClient()

  // Fetch everything needed for the AE Intelligence PDF
  const [
    { data: assessment },
    { data: report },
    { data: snapshotRows },
  ] = await Promise.all([
    supabase
      .from('assessments')
      .select('*, referral_partner:referral_partners(*)')
      .eq('id', assessmentId)
      .single(),
    supabase
      .from('reports')
      .select('layer1_scores, layer2_scores, product_scores, ai_narrative_json, agentforce_narrative_json')
      .eq('assessment_id', assessmentId)
      .single(),
    supabase
      .from('responses')
      .select('question_id, value')
      .eq('assessment_id', assessmentId)
      .eq('layer', 'snapshot'),
  ])

  if (!assessment || !report?.ai_narrative_json) return

  const partnerRaw = (assessment as { referral_partner?: unknown }).referral_partner
  const partner = Array.isArray(partnerRaw) ? partnerRaw[0] : partnerRaw
  const aeEmail = (partner as { email?: string } | null)?.email
  if (!aeEmail) {
    console.warn('[sendAEIntelligenceEmail] No referral partner email — skipping')
    return
  }

  const a = assessment as Assessment
  const l1 = report.layer1_scores as Layer1Scores
  const l2 = report.layer2_scores as Layer2Scores | null
  const ps = report.product_scores as ProductScore[] | null
  const narrativeData = report.ai_narrative_json as ReportNarrative
  const afNarrative = report.agentforce_narrative_json as AgentforceNarrative | null

  const snapshotMap: Record<string, boolean> = {}
  for (const row of snapshotRows ?? []) {
    snapshotMap[row.question_id] = row.value === true
  }
  const checkedSymptoms = getCheckedSymptoms(snapshotMap)

  // Render AE Intelligence PDF
  const aeDoc = AEIntelligenceDoc({
    assessment: a,
    l1Scores: l1,
    l2Scores: l2,
    productScores: ps,
    narrative: narrativeData,
    agentforceNarrative: afNarrative,
    checkedSymptoms,
  })
  const pdfBuffer = await renderToBuffer(aeDoc as unknown as React.ReactElement)

  const companyName = a.company_name ?? 'Unknown Company'

  await resend.emails.send({
    from: 'IMG Assessments <assessments@growwithimg.com>',
    to: aeEmail,
    subject: `Assessment Complete — ${companyName} AI Readiness Report`,
    html: aeEmailHtml(companyName, a.contact_first_name, a.contact_last_name),
    attachments: [
      {
        filename: `AE-Intelligence-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
        content: Buffer.from(pdfBuffer).toString('base64'),
      },
    ],
  })
}

function aeEmailHtml(
  companyName: string,
  firstName: string | null,
  lastName: string | null,
): string {
  const contactName =
    [firstName, lastName].filter(Boolean).join(' ') || 'the respondent'
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:#1d4ed8;padding:24px 40px;">
          <p style="margin:0;color:#93c5fd;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;">IMG Assessment Intelligence</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:18px;font-weight:700;line-height:1.3;">
            ${companyName} — Assessment Complete
          </h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:15px;color:#111827;">
            The AI Readiness Assessment for <strong>${companyName}</strong> (${contactName}) has been reviewed and approved.
          </p>
          <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
            Your AE Intelligence Brief is attached. It includes scores, gaps framed as account intelligence, agent products in play, and a suggested talk track for your next conversation.
          </p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            Log in to the <strong>IMG Dashboard</strong> to download the full prospect report or view detailed findings.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
            This is a confidential internal document. Do not forward to the prospect.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
