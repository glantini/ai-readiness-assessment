import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { getPartner } from '@/lib/partnerAuth'
import PartnerAssessmentsList from '../PartnerAssessmentsList'
import StatsBar from '@/components/StatsBar'

export const dynamic = 'force-dynamic'

export default async function PartnerDashboardPage() {
  // The (authed) layout already gated this — getPartner cannot be null here,
  // but we re-resolve to scope the queries below.
  const partner = await getPartner()
  if (!partner) {
    // Defensive: layout should have handled this
    return null
  }

  const supabase = createServiceClient()

  const { data: assessments, error } = await supabase
    .from('assessments')
    .select(
      'id, status, contact_first_name, contact_last_name, contact_email, company_name, uses_salesforce, created_at'
    )
    .eq('referral_partner_id', partner.id)
    .order('created_at', { ascending: false })

  const assessmentIds = assessments?.map((a) => a.id) ?? []
  const { data: reports } = assessmentIds.length
    ? await supabase
        .from('reports')
        .select('assessment_id, layer1_scores, layer2_scores')
        .in('assessment_id', assessmentIds)
    : { data: [] }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Assessments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Assessments you&apos;ve referred to IMG.
          </p>
        </div>
        <Link
          href="/partner/assessments/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
        >
          <span aria-hidden="true">+</span> New Assessment
        </Link>
      </div>

      <StatsBar assessments={assessments ?? []} reports={reports ?? []} />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load assessments: {error.message}
        </div>
      )}

      {!error && !assessments?.length && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <p className="text-sm text-gray-500">No assessments yet.</p>
          <Link
            href="/partner/assessments/new"
            className="mt-3 inline-block text-sm text-blue-700 hover:underline"
          >
            Create your first assessment →
          </Link>
        </div>
      )}

      {assessments && assessments.length > 0 && (
        <PartnerAssessmentsList
          assessments={assessments}
          reports={reports ?? []}
        />
      )}
    </div>
  )
}
