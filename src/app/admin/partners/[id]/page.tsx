import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AssessmentsList from '../../AssessmentsList'
import PartnerDetailForm from './PartnerDetailForm'
import type { ReferralPartner } from '@/types'

export const dynamic = 'force-dynamic'

export default async function PartnerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const [{ data: partner, error: pErr }, { data: assessments }] = await Promise.all([
    supabase
      .from('referral_partners')
      .select('*')
      .eq('id', params.id)
      .single(),
    supabase
      .from('assessments')
      .select(
        'id, token, status, contact_first_name, contact_last_name, contact_email, company_name, uses_salesforce, created_at, referral_partner:referral_partners(id, name)'
      )
      .eq('referral_partner_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (pErr || !partner) notFound()

  const p = partner as ReferralPartner

  const assessmentIds = (assessments ?? []).map((a) => a.id)
  const { data: reports } = assessmentIds.length
    ? await supabase
        .from('reports')
        .select('assessment_id, layer1_scores, layer2_scores')
        .in('assessment_id', assessmentIds)
    : { data: [] }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        <Link
          href="/admin/partners"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Referral Partners
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{p.name}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{p.email}</p>
        </div>

        <PartnerDetailForm partner={p} />

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Assessments</h2>
            <span className="text-xs text-gray-500">
              {assessments?.length ?? 0} total
            </span>
          </div>

          {(!assessments || assessments.length === 0) ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
              <p className="text-sm text-gray-500">
                No assessments tied to this partner yet.
              </p>
            </div>
          ) : (
            <AssessmentsList
              assessments={assessments}
              partners={[{ id: p.id, name: p.name }]}
              reports={reports ?? []}
            />
          )}
        </div>
      </div>
    </div>
  )
}
