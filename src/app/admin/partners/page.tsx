import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ReferralPartner } from '@/types'

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
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
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
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
            <p className="text-sm text-gray-500">No referral partners yet.</p>
            <Link
              href="/admin/partners/new"
              className="mt-3 inline-block text-sm text-blue-700 hover:underline"
            >
              Add your first partner →
            </Link>
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Company</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Region</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"># Assessments</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((p) => {
                  const count = p.assessments?.length ?? 0
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                        {p.city && (
                          <p className="mt-0.5 truncate text-xs text-gray-500">{p.city}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 truncate">{p.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 truncate">{p.company ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 truncate">{p.sf_team_region ?? '—'}</td>
                      <td className="px-4 py-3">
                        {p.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                        {count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/partners/${p.id}`}
                          className="text-sm font-medium text-blue-700 hover:underline whitespace-nowrap"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
