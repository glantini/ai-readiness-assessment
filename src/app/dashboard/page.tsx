import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CopyTokenUrl } from './CopyTokenUrl'

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
      'id, token, status, contact_first_name, contact_last_name, contact_email, company_name, ae_name, created_at'
    )
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Assessments</h1>
            <p className="mt-1 text-sm text-gray-500">Manage client AI readiness assessments</p>
          </div>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
          >
            <span aria-hidden="true">+</span> New Assessment
          </Link>
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Contact', 'Company', 'AE', 'Status', 'Token URL', 'Created', ''].map((col) => (
                    <th
                      key={col}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {col}
                    </th>
                  ))}
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

                  return (
                    <tr key={a.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{fullName}</p>
                        {a.contact_email && (
                          <p className="mt-0.5 text-xs text-gray-500">{a.contact_email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {a.company_name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {a.ae_name ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <CopyTokenUrl token={a.token} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{created}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/assessments/${a.id}`}
                          className="text-sm text-blue-700 hover:underline"
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
