import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLayer1Tier, getLayer2Tier } from '@/lib/scoring'
import type {
  Assessment,
  CategoryScore,
  SectionScore,
  Layer1Scores,
  Layer2Scores,
  ProductScore,
  ReportNarrative,
  AgentforceNarrative,
  ReportStatus,
} from '@/types'
import { ReportClient } from './ReportClient'

export const dynamic = 'force-dynamic'

export default async function ReportPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [{ data: assessment, error: aErr }, { data: report }] =
    await Promise.all([
      supabase.from('assessments').select('*').eq('id', params.id).single(),
      supabase
        .from('reports')
        .select(
          'ai_overall_score, ai_category_scores, agentforce_index, agentforce_section_scores, agentforce_product_scores, edition_flag, ai_narrative_json, agentforce_narrative_json, report_status',
        )
        .eq('assessment_id', params.id)
        .single(),
    ])

  if (aErr || !assessment) notFound()

  const a = assessment as Assessment
  const fullName =
    [a.contact_first_name, a.contact_last_name].filter(Boolean).join(' ') || '—'

  const narrative = report?.ai_narrative_json as ReportNarrative | null
  const agentforceNarrative = report?.agentforce_narrative_json as AgentforceNarrative | null
  const reportStatus = (report?.report_status ?? null) as ReportStatus | null

  const l1: Layer1Scores | null = report?.ai_overall_score != null
    ? {
        overall: report.ai_overall_score as number,
        categories: (report.ai_category_scores ?? []) as CategoryScore[],
        tier: getLayer1Tier(report.ai_overall_score as number),
      }
    : null

  const l2: Layer2Scores | null = report?.agentforce_index != null
    ? {
        overall: report.agentforce_index as number,
        sections: (report.agentforce_section_scores ?? []) as SectionScore[],
        productScores: (report.agentforce_product_scores ?? []) as ProductScore[],
        edition_flag: (report.edition_flag ?? false) as boolean,
        tier: getLayer2Tier(report.agentforce_index as number),
      }
    : null

  const productScores: ProductScore[] | null = (report?.agentforce_product_scores ?? null) as ProductScore[] | null

  const hasScores = !!l1

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Back link ───────────────────────────────────────────────── */}
        <Link
          href={`/dashboard/assessments/${params.id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Assessment
        </Link>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            AI Readiness Report
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {fullName} · {a.company_name} · {a.company_industry}
          </p>
        </div>

        {/* ── Guard: assessment must be completed + scored ─────────────── */}
        {a.status !== 'completed' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            <p className="font-medium">Assessment not yet completed</p>
            <p className="mt-1 text-amber-700">
              The report can only be generated after the client has submitted their assessment.
            </p>
          </div>
        )}

        {a.status === 'completed' && !hasScores && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            <p className="font-medium">Scores not yet calculated</p>
            <p className="mt-1 text-amber-700">
              Go back to the assessment and click <strong>Recalculate Scores</strong> before generating the report.
            </p>
          </div>
        )}

        {/* ── Main report UI ───────────────────────────────────────────── */}
        {a.status === 'completed' && hasScores && (
          <ReportClient
            assessmentId={params.id}
            assessment={a}
            initialNarrative={narrative}
            initialAgentforceNarrative={agentforceNarrative}
            initialStatus={reportStatus}
            l1Scores={l1}
            l2Scores={l2}
            productScores={productScores}
          />
        )}

      </div>
    </div>
  )
}
