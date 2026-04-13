'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Layer1Scores, Layer2Scores } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Sent',
  in_progress: 'In Progress',
  completed: 'Complete',
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  in_progress: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  completed: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
}

type Assessment = {
  id: string
  status: string
  contact_first_name: string | null
  contact_last_name: string | null
  contact_email: string | null
  company_name: string | null
  uses_salesforce: boolean | null
  created_at: string
}

type Report = {
  assessment_id: string
  layer1_scores: Layer1Scores | null
  layer2_scores: Layer2Scores | null
}

export default function PartnerAssessmentsList({
  assessments,
  reports,
}: {
  assessments: Assessment[]
  reports: Report[]
}) {
  const [status, setStatus] = useState<string>('all')

  const reportsByAssessment = useMemo(
    () => new Map(reports.map((r) => [r.assessment_id, r])),
    [reports]
  )

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      if (status !== 'all' && a.status !== status) return false
      return true
    })
  }, [assessments, status])

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="filter-status"
            className="text-xs font-medium uppercase tracking-wider text-gray-500"
          >
            Status
          </label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Sent</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Complete</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-gray-500">
          {filtered.length} of {assessments.length}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-20 text-center">
          <p className="text-sm text-gray-500">
            No assessments match the selected filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-[22%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="w-[18%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Company
                </th>
                <th className="w-[12%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="w-[10%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  AI Score
                </th>
                <th className="w-[10%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  SF Score
                </th>
                <th className="w-[14%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="w-[14%] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((a) => {
                const fullName =
                  [a.contact_first_name, a.contact_last_name]
                    .filter(Boolean)
                    .join(' ') || '—'
                const statusLabel = STATUS_LABEL[a.status] ?? a.status
                const statusClass =
                  STATUS_CLASS[a.status] ?? STATUS_CLASS.pending
                const created = new Date(a.created_at).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                )

                const report = reportsByAssessment.get(a.id)
                const l1 = report?.layer1_scores as Layer1Scores | null
                const l2 = report?.layer2_scores as Layer2Scores | null

                return (
                  <tr key={a.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {fullName}
                      </p>
                      {a.contact_email && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {a.contact_email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="line-clamp-2">
                        {a.company_name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {l1 ? (
                        <span className="text-sm font-semibold text-gray-900">
                          {l1.overall.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {a.uses_salesforce ? (
                        l2 ? (
                          <span className="text-sm font-semibold text-gray-900">
                            {l2.overall.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {created}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/partner/assessments/${a.id}`}
                        className="text-sm font-medium text-blue-700 hover:underline whitespace-nowrap"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
