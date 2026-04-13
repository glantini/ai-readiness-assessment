import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AssessmentsList from './AssessmentsList'
import StatsBar from '@/components/StatsBar'

export default async function DashboardPage() {
  const supabase = createClient()

  const [{ data: assessments, error }, { data: partners }] = await Promise.all([
    supabase
      .from('assessments')
      .select(
        'id, token, status, contact_first_name, contact_last_name, contact_email, company_name, uses_salesforce, created_at, referral_partner:referral_partners(id, name)'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('referral_partners')
      .select('id, name')
      .order('name', { ascending: true }),
  ])

  // Fetch reports for all assessments in one query
  const assessmentIds = assessments?.map((a) => a.id) ?? []
  const { data: reports } = assessmentIds.length
    ? await supabase
        .from('reports')
        .select('assessment_id, layer1_scores, layer2_scores')
        .in('assessment_id', assessmentIds)
    : { data: [] }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Assessments</h1>
          <p className="mt-1 text-sm text-gray-500">Manage client AI readiness assessments</p>
        </div>

        {/* ── Stats banner ─────────────────────────────────────────────── */}
        <StatsBar assessments={assessments ?? []} reports={reports ?? []} />

        {/* ── Error state ───────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load assessments: {error.message}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────── */}
        {!error && !assessments?.length && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
            <p className="text-sm text-gray-500">No assessments yet.</p>
            <Link
              href="/admin/assessments/new"
              className="mt-3 inline-block text-sm text-blue-700 hover:underline"
            >
              Create your first assessment →
            </Link>
          </div>
        )}

        {/* ── List with filters ────────────────────────────────────────── */}
        {assessments && assessments.length > 0 && (
          <AssessmentsList
            assessments={assessments}
            partners={partners ?? []}
            reports={reports ?? []}
          />
        )}
      </div>
    </div>
  )
}
