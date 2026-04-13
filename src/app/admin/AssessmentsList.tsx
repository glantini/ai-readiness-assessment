'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { AssessmentSection, Layer1Scores, Layer2Scores } from '@/types'
import { formatProgress, formatTimeAgo } from '@/lib/assessmentProgress'
import { SortableHeader, useSort, useSortedRows } from '@/components/SortableHeader'
import { CopyLinkButton } from '@/components/CopyLinkButton'

const STATUS_LABEL: Record<string, string> = {
  pending:     'Sent',
  in_progress: 'In Progress',
  completed:   'Complete',
}

const STATUS_CLASS: Record<string, string> = {
  pending:     'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  in_progress: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  completed:   'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
}

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  in_progress: 1,
  completed: 2,
}

type Assessment = {
  id: string
  token: string
  status: string
  current_section: AssessmentSection | null
  contact_first_name: string | null
  contact_last_name: string | null
  contact_email: string | null
  company_name: string | null
  uses_salesforce: boolean | null
  created_at: string
  updated_at: string | null
  referral_partner: { id: string; name: string } | { id: string; name: string }[] | null
}

type Partner = { id: string; name: string }

type Report = {
  assessment_id: string
  layer1_scores: Layer1Scores | null
  layer2_scores: Layer2Scores | null
}

type SortKey = 'contact' | 'company' | 'partner' | 'status' | 'ai_score' | 'sf_score' | 'created'

export default function AssessmentsList({
  assessments,
  partners,
  reports,
}: {
  assessments: Assessment[]
  partners: Partner[]
  reports: Report[]
}) {
  const [partnerId, setPartnerId] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const { sort, toggle } = useSort<SortKey>({ key: 'created', direction: 'desc' })

  const reportsByAssessment = useMemo(
    () => new Map(reports.map((r) => [r.assessment_id, r])),
    [reports]
  )

  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      if (status !== 'all' && a.status !== status) return false
      if (partnerId !== 'all') {
        const p = a.referral_partner
        const id = Array.isArray(p) ? p[0]?.id : p?.id
        if (id !== partnerId) return false
      }
      return true
    })
  }, [assessments, partnerId, status])

  const accessors = useMemo(
    () => ({
      contact: (a: Assessment) =>
        [a.contact_first_name, a.contact_last_name].filter(Boolean).join(' ').toLowerCase() ||
        a.contact_email?.toLowerCase() ||
        '',
      company: (a: Assessment) => a.company_name?.toLowerCase() ?? '',
      partner: (a: Assessment) => {
        const p = a.referral_partner
        const name = Array.isArray(p) ? p[0]?.name : p?.name
        return name?.toLowerCase() ?? ''
      },
      status: (a: Assessment) => STATUS_ORDER[a.status] ?? 99,
      ai_score: (a: Assessment) => {
        const r = reportsByAssessment.get(a.id)
        return r?.layer1_scores?.overall ?? null
      },
      sf_score: (a: Assessment) => {
        if (!a.uses_salesforce) return null
        const r = reportsByAssessment.get(a.id)
        return r?.layer2_scores?.overall ?? null
      },
      created: (a: Assessment) => new Date(a.created_at).getTime(),
    }),
    [reportsByAssessment]
  )

  const sorted = useSortedRows(filtered, sort, accessors)

  return (
    <>
      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="filter-partner" className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Partner
          </label>
          <select
            id="filter-partner"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Partners</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-status" className="text-xs font-medium uppercase tracking-wider text-gray-500">
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
          {sorted.length} of {assessments.length}
        </div>
      </div>

      {/* ── Empty (filtered) state ──────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <svg
            className="mx-auto h-10 w-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h4m0 0V9a4 4 0 10-8 0m8 2H9m12 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h3l2-2h4l2 2h3a2 2 0 012 2v4" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-700">No assessments found</p>
          <p className="mt-1 text-xs text-gray-500">
            Try adjusting your filters, or create a new assessment.
          </p>
          <Link
            href="/admin/assessments/new"
            className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Create New Assessment
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader sortKey="contact" activeSort={sort} onToggle={toggle} className="w-[18%]">Contact</SortableHeader>
                <SortableHeader sortKey="company" activeSort={sort} onToggle={toggle} className="w-[14%]">Company</SortableHeader>
                <SortableHeader sortKey="partner" activeSort={sort} onToggle={toggle} className="w-[10%]">Partner</SortableHeader>
                <SortableHeader sortKey="status" activeSort={sort} onToggle={toggle} className="w-[9%]">Status</SortableHeader>
                <SortableHeader sortKey="ai_score" activeSort={sort} onToggle={toggle} align="center" className="w-[8%]">AI Score</SortableHeader>
                <SortableHeader sortKey="sf_score" activeSort={sort} onToggle={toggle} align="center" className="w-[8%]">SF Score</SortableHeader>
                <th scope="col" className="w-[13%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Assessment</th>
                <SortableHeader sortKey="created" activeSort={sort} onToggle={toggle} className="w-[12%]">Created</SortableHeader>
                <th scope="col" className="w-[8%] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((a) => {
                const fullName =
                  [a.contact_first_name, a.contact_last_name].filter(Boolean).join(' ') || '—'
                const statusLabel = STATUS_LABEL[a.status] ?? a.status
                const statusClass = STATUS_CLASS[a.status] ?? STATUS_CLASS.pending
                const created = new Date(a.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                const report = reportsByAssessment.get(a.id)
                const l1 = report?.layer1_scores as Layer1Scores | null
                const l2 = report?.layer2_scores as Layer2Scores | null

                return (
                  <tr key={a.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="truncate text-sm font-medium text-gray-900">{fullName}</p>
                      {a.contact_email && (
                        <p className="mt-0.5 truncate text-xs text-gray-500">{a.contact_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="line-clamp-2">{a.company_name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 truncate">
                      {(() => {
                        const p = a.referral_partner
                        const name = Array.isArray(p) ? p[0]?.name : p?.name
                        return name ?? '—'
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                      {(() => {
                        const progress = formatProgress(a.status, a.current_section, a.uses_salesforce)
                        if (!progress) return null
                        return (
                          <p className="mt-1 text-xs text-gray-500 whitespace-nowrap">
                            {progress}
                            {a.updated_at && (
                              <> · <span className="text-gray-400">{formatTimeAgo(a.updated_at)}</span></>
                            )}
                          </p>
                        )
                      })()}
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

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`/assess/${a.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline"
                          style={{ color: '#EA580C' }}
                        >
                          Open
                        </a>
                        <CopyLinkButton token={a.token} />
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{created}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/assessments/${a.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap"
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
