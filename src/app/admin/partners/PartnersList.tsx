'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { ReferralPartner } from '@/types'
import { SortableHeader, useSort, useSortedRows } from '@/components/SortableHeader'

type PartnerRow = ReferralPartner & {
  assessments: { id: string }[] | null
}

type SortKey =
  | 'name'
  | 'email'
  | 'company'
  | 'region'
  | 'status'
  | 'last_login'
  | 'count'

function formatLastLogin(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function PartnersList({ rows }: { rows: PartnerRow[] }) {
  const { sort, toggle } = useSort<SortKey>({ key: 'name', direction: 'asc' })

  const accessors = useMemo(
    () => ({
      name: (p: PartnerRow) => p.name.toLowerCase(),
      email: (p: PartnerRow) => p.email.toLowerCase(),
      company: (p: PartnerRow) => p.company?.toLowerCase() ?? '',
      region: (p: PartnerRow) => p.sf_team_region ?? '',
      status: (p: PartnerRow) => (p.is_active ? 0 : 1),
      last_login: (p: PartnerRow) =>
        p.last_login ? new Date(p.last_login).getTime() : null,
      count: (p: PartnerRow) => p.assessments?.length ?? 0,
    }),
    []
  )

  const sorted = useSortedRows(rows, sort, accessors)

  return (
    <>
      {/* ── Mobile card list ─────────────────────────────────────────── */}
      <ul className="space-y-3 md:hidden">
        {sorted.map((p) => {
          const count = p.assessments?.length ?? 0
          return (
            <li
              key={p.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/partners/${p.id}`}
                    className="block truncate text-sm font-semibold text-gray-900 hover:text-blue-700"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{p.email}</p>
                </div>
                {p.is_active ? (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">
                    Inactive
                  </span>
                )}
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <MetaRow label="Company" value={p.company} />
                <MetaRow label="Region" value={p.sf_team_region} />
                <MetaRow label="City" value={p.city} />
                <MetaRow
                  label="Assessments"
                  value={String(count)}
                />
              </dl>

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-500">
                  <span className="text-gray-400">Last login: </span>
                  {p.last_login ? formatLastLogin(p.last_login) : 'Never'}
                </span>
                <Link
                  href={`/admin/partners/${p.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Details →
                </Link>
              </div>
            </li>
          )
        })}
      </ul>

      {/* ── Desktop table ────────────────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader sortKey="name" activeSort={sort} onToggle={toggle}>Name</SortableHeader>
              <SortableHeader sortKey="email" activeSort={sort} onToggle={toggle}>Email</SortableHeader>
              <SortableHeader sortKey="company" activeSort={sort} onToggle={toggle}>Company</SortableHeader>
              <SortableHeader sortKey="region" activeSort={sort} onToggle={toggle}>Region</SortableHeader>
              <SortableHeader sortKey="status" activeSort={sort} onToggle={toggle}>Status</SortableHeader>
              <SortableHeader sortKey="last_login" activeSort={sort} onToggle={toggle}>Last Login</SortableHeader>
              <SortableHeader sortKey="count" activeSort={sort} onToggle={toggle} align="center"># Assessments</SortableHeader>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((p) => {
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
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {p.last_login ? formatLastLogin(p.last_login) : <span className="text-gray-400">Never</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                    {count}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/partners/${p.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap"
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
    </>
  )
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-gray-700">{value || '—'}</dd>
    </div>
  )
}
