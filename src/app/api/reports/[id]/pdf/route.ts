/**
 * GET /api/reports/[id]/pdf
 *
 * Renders the ProspectReport as a downloadable PDF.
 * Requires authenticated @growwithimg.com user.
 *
 * Query params:
 *   ?type=ae  — returns the AE Intelligence PDF instead
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ProspectReport } from '@/lib/pdf/ProspectReport'
import { AEIntelligenceDoc } from '@/lib/pdf/AEIntelligence'
import { getCheckedSymptoms } from '@/lib/reportGeneration'
import type {
  Assessment,
  Layer1Scores,
  Layer2Scores,
  ProductScore,
  ReportNarrative,
  AgentforceNarrative,
} from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const assessmentId = params.id
  const isAE = request.nextUrl.searchParams.get('type') === 'ae'

  // ── Auth check (IMG team only) ─────────────────────────────────────────────
  const authClient = createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user?.email?.toLowerCase().endsWith('@growwithimg.com')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createServiceClient()

  // ── Fetch all required data ────────────────────────────────────────────────
  const [
    { data: assessment, error: aErr },
    { data: report, error: rErr },
    { data: snapshotRows },
    { data: layer1Rows },
    { data: layer2Rows },
  ] = await Promise.all([
    supabase.from('assessments').select('*').eq('id', assessmentId).single(),
    supabase
      .from('reports')
      .select(
        'layer1_scores, layer2_scores, product_scores, ai_narrative_json, agentforce_narrative_json, report_status',
      )
      .eq('assessment_id', assessmentId)
      .single(),
    supabase
      .from('responses')
      .select('question_id, value')
      .eq('assessment_id', assessmentId)
      .eq('layer', 'snapshot'),
    supabase
      .from('responses')
      .select('question_id')
      .eq('assessment_id', assessmentId)
      .eq('layer', 'layer1'),
    supabase
      .from('responses')
      .select('question_id')
      .eq('assessment_id', assessmentId)
      .eq('layer', 'layer2'),
  ])

  if (aErr || !assessment) {
    return Response.json({ error: 'Assessment not found' }, { status: 404 })
  }

  if (rErr || !report) {
    return Response.json({ error: 'Report not found' }, { status: 404 })
  }

  if (report.report_status !== 'approved') {
    return Response.json(
      { error: 'Report must be approved before generating PDF' },
      { status: 400 },
    )
  }

  const a = assessment as Assessment
  const l1 = report.layer1_scores as Layer1Scores
  const l2 = report.layer2_scores as Layer2Scores | null
  const ps = report.product_scores as ProductScore[] | null
  const narrative = report.ai_narrative_json as ReportNarrative
  const afNarrative = report.agentforce_narrative_json as AgentforceNarrative | null

  if (!narrative) {
    return Response.json({ error: 'Narrative not generated yet' }, { status: 400 })
  }

  // Debug: confirm which recommendation format is being served in the PDF
  const sampleCat = narrative.categories?.AIStrategy
  console.log('[pdf/route] Rendering PDF with recommendation format:', {
    assessmentId,
    reportStatus: report.report_status,
    sampleRecommendation: sampleCat?.recommendations?.[0],
    isRichFormat: typeof sampleCat?.recommendations?.[0] === 'object',
  })

  // ── Render PDF ─────────────────────────────────────────────────────────────
  let buffer: Buffer
  let filename: string
  const companySlug = (a.company_name ?? 'report').replace(/[^a-zA-Z0-9]/g, '-')

  if (isAE) {
    // Build snapshot symptoms for AE doc
    const snapshotMap: Record<string, boolean> = {}
    for (const row of snapshotRows ?? []) {
      snapshotMap[row.question_id] = row.value === true
    }
    const checkedSymptoms = getCheckedSymptoms(snapshotMap)

    const aeDoc = AEIntelligenceDoc({
      assessment: a,
      l1Scores: l1,
      l2Scores: l2,
      productScores: ps,
      narrative,
      agentforceNarrative: afNarrative,
      checkedSymptoms,
    })
    buffer = await renderToBuffer(aeDoc as unknown as React.ReactElement)
    filename = `AE-Intelligence-${companySlug}.pdf`
  } else {
    // Build snapshot symptoms for prospect report
    const prospectSnapshotMap: Record<string, boolean> = {}
    for (const row of snapshotRows ?? []) {
      prospectSnapshotMap[row.question_id] = row.value === true
    }
    const prospectSymptoms = getCheckedSymptoms(prospectSnapshotMap)

    const reportDoc = ProspectReport({
      assessment: a,
      l1Scores: l1,
      l2Scores: l2,
      productScores: ps,
      narrative,
      agentforceNarrative: afNarrative,
      checkedSymptoms: prospectSymptoms,
      layer1QuestionCount: layer1Rows?.length ?? 0,
      layer2QuestionCount: layer2Rows?.length ?? 0,
    })
    buffer = await renderToBuffer(reportDoc as unknown as React.ReactElement)
    filename = `AI-Readiness-Report-${companySlug}.pdf`
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
