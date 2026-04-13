import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Layer1Scores, Layer2Scores } from '@/types'

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


export default async function DashboardPage() {
  const supabase = createClient()

  const { data: assessments, error } = await supabase
    .from('assessments')
    .select(
      'id, token, status, contact_first_name, contact_last_name, contact_email, company_name, uses_salesforce, created_at, referral_partner:referral_partners(id, name)'
    )
    .order('created_at', { ascending: false })

  // Fetch reports for all assessments in one query
  const assessmentIds = assessments?.map((a) => a.id) ?? []
  const { data: reports } = assessmentIds.length
    ? await supabase
        .from('reports')
        .select('assessment_id, layer1_scores, layer2_scores')
        .in('assessment_id', assessmentIds)
    : { data: [] }

  const reportsByAssessment = new Map(
    (reports ?? []).map((r) => [r.assessment_id, r])
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Assessments</h1>
            <p className="mt-1 text-sm text-gray-500">Manage client AI readiness assessments</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/partners/new"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <span aria-hidden="true">+</span> New Referral Partner
            </Link>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
            >
              <span aria-hidden="true">+</span> New Assessment
            </Link>
          </div>
        </div>

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
              href="/dashboard/new"
              className="mt-3 inline-block text-sm text-blue-700 hover:underline"
            >
              Create your first assessment →
            </Link>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────── */}
        {assessments && assessments.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-[18%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact</th>
                  <th scope="col" className="w-[14%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Company</th>
                  <th scope="col" className="w-[10%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Partner</th>
                  <th scope="col" className="w-[9%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th scope="col" className="w-[8%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">AI Score</th>
                  <th scope="col" className="w-[8%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">SF Score</th>
                  <th scope="col" className="w-[13%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Assessment</th>
                  <th scope="col" className="w-[12%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
                  <th scope="col" className="w-[8%] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assessments.map((a) => {
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
                          const p = a.referral_partner as { name?: string } | { name?: string }[] | null
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
                      </td>

                      {/* AI Score */}
                      <td className="px-4 py-3 text-center">
                        {l1 ? (
                          <span className="text-sm font-semibold text-gray-900">
                            {l1.overall.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* SF Score */}
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

                      {/* Open Assessment link */}
                      <td className="px-4 py-3">
                        <a
                          href={`/assess/${a.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline"
                          style={{ color: '#EA580C' }}
                        >
                          Open Assessment
                        </a>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{created}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/assessments/${a.id}`}
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
      </div>
    </div>
  )
}
