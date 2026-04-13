import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ReferralPartner } from '@/types'
import PartnersList from './PartnersList'

export const dynamic = 'force-dynamic'

type PartnerRow = ReferralPartner & {
  assessments: { id: string }[] | null
}

export default async function PartnersListPage() {
  const supabase = createClient()

  const { data: partners, error } = await supabase
    .from('referral_partners')
    .select('*, assessments(id)')
    .order('name', { ascending: true })

  const rows = (partners ?? []) as PartnerRow[]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Referral Partners</h1>
            <p className="mt-1 text-sm text-gray-500">
              Salesforce AEs and partners linked to client assessments
            </p>
          </div>
          <Link
            href="/admin/partners/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            New Referral Partner
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load partners: {error.message}
          </div>
        )}

        {!error && rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
            <svg
              className="mx-auto h-10 w-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-5.13a4 4 0 11-8 0 4 4 0 018 0zm6 1a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-700">No referral partners yet</p>
            <p className="mt-1 text-xs text-gray-500">
              Add your first partner to start tracking referrals.
            </p>
            <Link
              href="/admin/partners/new"
              className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              New Referral Partner
            </Link>
          </div>
        )}

        {rows.length > 0 && <PartnersList rows={rows} />}
      </div>
    </div>
  )
}
