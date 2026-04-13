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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
  )
}
