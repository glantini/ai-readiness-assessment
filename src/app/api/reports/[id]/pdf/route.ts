/**
 * GET /api/reports/[id]/pdf
 *
 * Renders the ProspectReport as a downloadable PDF.
 * Requires authenticated @growwithimg.com user.
 */

export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ProspectReport } from '@/lib/pdf/ProspectReport'
import { getCheckedSymptoms } from '@/lib/reportGeneration'
import type {
  Assessment,
  Layer1Scores,
  Layer2Scores,
  ProductScore,
  ReportNarrative,
  AgentforceNarrative,
  ReferralPartner,
} from '@/types'

export async function GET(
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

  // ── Fetch all required data ────────────────────────────────────────────────
  const [
    { data: assessment, error: aErr },
    { data: report, error: rErr },
    { data: snapshotRows },
    { data: layer1Rows },
    { data: layer2Rows },
  ] = await Promise.all([
    supabase
      .from('assessments')
      .select('*, referral_partner:referral_partners(*)')
      .eq('id', assessmentId)
      .single(),
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
  const partnerRaw = (assessment as { referral_partner?: unknown }).referral_partner
  const referralPartner = (
    Array.isArray(partnerRaw) ? partnerRaw[0] : partnerRaw
  ) as ReferralPartner | null
  const l1 = report.layer1_scores as Layer1Scores
  const l2 = report.layer2_scores as Layer2Scores | null
  const ps = report.product_scores as ProductScore[] | null
  const narrative = report.ai_narrative_json as ReportNarrative
  const afNarrative = report.agentforce_narrative_json as AgentforceNarrative | null

  if (!narrative) {
    return Response.json({ error: 'Narrative not generated yet' }, { status: 400 })
  }

  const companySlug = (a.company_name ?? 'report').replace(/[^a-zA-Z0-9]/g, '-')

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
    snapshotChecks: prospectSnapshotMap,
    layer1QuestionCount: layer1Rows?.length ?? 0,
    layer2QuestionCount: layer2Rows?.length ?? 0,
    referralPartner,
  })
  const buffer = await renderToBuffer(reportDoc as unknown as React.ReactElement)
  const filename = `AI-Readiness-Report-${companySlug}.pdf`

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
