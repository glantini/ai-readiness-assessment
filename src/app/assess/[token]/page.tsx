import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { snapshotQuestions } from '@/lib/questions/snapshot'
import type { SalesforceCloud } from '@/types'
import SnapshotForm from './SnapshotForm'

// ─── Estimated time helper ────────────────────────────────────────────────────

function estimatedMinutes(
  usesSalesforce: boolean | null,
  clouds: SalesforceCloud[] | null
): string {
  // Non-Salesforce orgs complete Layer 1 only
  if (!usesSalesforce) return 'About 15 minutes'

  // Salesforce orgs also complete Layer 2 (Core + Data Cloud + active clouds)
  const count = clouds?.length ?? 0
  if (count === 0) return 'About 18 minutes'
  if (count === 1) return 'About 20 minutes'
  if (count === 2) return 'About 22 minutes'
  return 'About 25 minutes'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AssessIntroPage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createServiceClient()

  // Fetch the assessment — only safe public fields (no AE internals)
  const { data: assessment, error: fetchError } = await supabase
    .from('assessments')
    .select('id, status, contact_first_name, contact_last_name, company_name, company_industry, company_size, ai_motivation, uses_salesforce, salesforce_clouds')
    .eq('token', params.token)
    .single()

  if (fetchError || !assessment) notFound()

  // Pre-populate checkboxes for returning visitors
  const { data: existingResponses } = await supabase
    .from('responses')
    .select('question_id, value')
    .eq('assessment_id', assessment.id)
    .eq('layer', 'snapshot')

  const initialChecks: Record<string, boolean> = {}
  for (const q of snapshotQuestions) {
    const existing = existingResponses?.find((r) => r.question_id === q.id)
    initialChecks[q.id] = existing ? Boolean(existing.value) : false
  }

  const contactName =
    [assessment.contact_first_name, assessment.contact_last_name]
      .filter(Boolean)
      .join(' ') || null

  const timeEstimate = estimatedMinutes(
    assessment.uses_salesforce,
    assessment.salesforce_clouds as SalesforceCloud[] | null
  )

  const profileRows: [string, string | null][] = [
    ['Company', assessment.company_name],
    ['Industry', assessment.company_industry],
    ['Size', assessment.company_size],
    ['Primary Motivation', assessment.ai_motivation],
  ]

  return (
    <div className="space-y-8">

      {/* ── Welcome header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {contactName ? `Welcome, ${contactName}` : 'Welcome'}
        </h1>
        {assessment.company_name && (
          <p className="mt-1 text-sm text-gray-500">{assessment.company_name}</p>
        )}
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          This assessment is designed to help us understand your organization&apos;s current
          AI readiness and identify the most impactful opportunities with Salesforce Agentforce.
          Your answers will be used to generate a tailored readiness report.
        </p>
      </div>

      {/* ── Profile confirmation ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Your Profile
          </h2>
        </div>
        <dl className="divide-y divide-gray-100">
          {profileRows
            .filter(([, val]) => Boolean(val))
            .map(([label, value]) => (
              <div key={label} className="flex items-start px-6 py-3.5">
                <dt className="w-44 shrink-0 text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900">{value}</dd>
              </div>
            ))}
        </dl>
      </div>

      {/* ── Operations Snapshot ──────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Operations Snapshot</h2>
          <p className="mt-1 text-xs text-gray-500">
            Check any that apply — this helps us tailor your report
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="mb-5 text-sm text-gray-600">
            Before we begin, check any of the following that apply to your organization
            right now. This helps us tailor your report.
          </p>
          <SnapshotForm
            token={params.token}
            questions={snapshotQuestions}
            initialChecks={initialChecks}
            timeEstimate={timeEstimate}
          />
        </div>
      </div>

    </div>
  )
}
