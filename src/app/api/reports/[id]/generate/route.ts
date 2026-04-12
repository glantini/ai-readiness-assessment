/**
 * POST /api/reports/[id]/generate
 *
 * Streams Claude's report generation as Server-Sent Events (SSE).
 * The client (ReportClient.tsx) reads this stream to show real-time progress.
 *
 * SSE event shapes:
 *   { type: 'status', message: string }
 *   { type: 'text', content: string }      ← raw text token from Claude
 *   { type: 'done' }                        ← generation + save complete
 *   { type: 'error', message: string }
 */

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  REPORT_SYSTEM_PROMPT,
  buildReportPrompt,
  findLowestQuestion,
  getCheckedSymptoms,
  parseNarrativeBlocks,
} from '@/lib/reportGeneration'
import type { Assessment, Layer1Scores, Layer2Scores, ProductScore } from '@/types'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const assessmentId = params.id

  // ── Auth check (IMG team only) ─────────────────────────────────────────────
  const authClient = createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user?.email?.toLowerCase().endsWith('@growwithimg.com')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createServiceClient()
  const encoder = new TextEncoder()

  // Pre-fetch all data before opening the stream (avoids async-context issues)
  const [
    { data: assessment, error: aErr },
    { data: report },
    { data: snapshotRows },
    { data: layer1Rows },
  ] = await Promise.all([
    supabase.from('assessments').select('*').eq('id', assessmentId).single(),
    supabase
      .from('reports')
      .select('layer1_scores, layer2_scores, product_scores')
      .eq('assessment_id', assessmentId)
      .single(),
    supabase
      .from('responses')
      .select('question_id, value')
      .eq('assessment_id', assessmentId)
      .eq('layer', 'snapshot'),
    supabase
      .from('responses')
      .select('question_id, value')
      .eq('assessment_id', assessmentId)
      .eq('layer', 'layer1'),
  ])

  if (aErr || !assessment) {
    return new Response(
      JSON.stringify({ error: 'Assessment not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!report?.layer1_scores) {
    return new Response(
      JSON.stringify({ error: 'Scores not yet calculated. Run scoring first.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Build prompt from fetched data
  const a = assessment as Assessment
  const l1 = report.layer1_scores as Layer1Scores
  const l2 = report.layer2_scores as Layer2Scores | null
  const productScores = (report.product_scores ?? report.layer2_scores?.productScores ?? null) as ProductScore[] | null

  const snapshotMap: Record<string, boolean> = {}
  for (const row of snapshotRows ?? []) {
    snapshotMap[row.question_id] = row.value === true
  }

  const layer1Map: Record<string, number> = {}
  for (const row of layer1Rows ?? []) {
    const v = typeof row.value === 'number' ? row.value : Number(row.value)
    if (!Number.isNaN(v)) layer1Map[row.question_id] = v
  }

  const checkedSymptoms = getCheckedSymptoms(snapshotMap)
  const lowestQuestion = findLowestQuestion(layer1Map)
  const userPrompt = buildReportPrompt(a, l1, l2, productScores, checkedSymptoms, lowestQuestion)

  // ── Build SSE stream ───────────────────────────────────────────────────────
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  function send(data: object) {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  // Fire-and-forget generation (runs concurrently with the streamed response)
  ;(async () => {
    try {
      send({ type: 'status', message: 'Connecting to Claude...' })

      const anthropic = new Anthropic()
      let fullText = ''

      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: REPORT_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      })

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const text = event.delta.text
          fullText += text
          send({ type: 'text', content: text })
        }
      }

      // Parse the two JSON blocks (parseNarrativeBlocks handles regex iteration)
      const { block1, block2 } = parseNarrativeBlocks(fullText)

      if (!block1) {
        send({
          type: 'error',
          message: 'Failed to parse narrative JSON from Claude response',
        })
        return
      }

      // Save to reports table
      const { error: saveErr } = await supabase
        .from('reports')
        .update({
          ai_narrative_json: block1,
          agentforce_narrative_json: block2 ?? null,
          report_status: 'draft',
        })
        .eq('assessment_id', assessmentId)

      if (saveErr) {
        send({ type: 'error', message: `Save failed: ${saveErr.message}` })
        return
      }

      send({ type: 'done' })
    } catch (err) {
      send({ type: 'error', message: String(err) })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
