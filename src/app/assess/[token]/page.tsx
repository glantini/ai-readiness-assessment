import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { snapshotQuestions } from '@/lib/questions/snapshot'
import type { SalesforceCloud } from '@/types'
import IntakeForm from './IntakeForm'

// ─── Estimated time helper ────────────────────────────────────────────────────

function estimatedMinutes(
  usesSalesforce: boolean | null,
  clouds: SalesforceCloud[] | null
): string {
  if (!usesSalesforce) return 'About 15 minutes'
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

  const { data: assessment, error: fetchError } = await supabase
    .from('assessments')
    .select(
      'id, status, contact_first_name, contact_last_name, contact_phone, contact_linkedin, company_name, company_industry, company_size, company_revenue, company_headquarters, company_website, ai_motivation, ai_current_usage, uses_salesforce, salesforce_edition, salesforce_clouds'
    )
    .eq('token', params.token)
    .single()

  if (fetchError || !assessment) notFound()

  const { data: existingResponses } = await supabase
    .from('responses')
    .select('question_id, value')
    .eq('assessment_id', assessment.id)
    .eq('layer', 'snapshot')

  const initialSnapshotChecks: Record<string, boolean> = {}
  for (const q of snapshotQuestions) {
    const existing = existingResponses?.find((r) => r.question_id === q.id)
    initialSnapshotChecks[q.id] = existing ? Boolean(existing.value) : false
  }

  const contactName =
    [assessment.contact_first_name, assessment.contact_last_name]
      .filter(Boolean)
      .join(' ') || null

  const timeEstimate = estimatedMinutes(
    assessment.uses_salesforce,
    assessment.salesforce_clouds as SalesforceCloud[] | null,
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {contactName ? `Welcome, ${contactName}` : 'Welcome'}
        </h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          This assessment is designed to help us understand your organization&apos;s current
          AI readiness and identify the most impactful opportunities with Salesforce Agentforce.
          Before we begin, please confirm a few details about your organization so we can tailor
          your report.
        </p>
      </div>

      <IntakeForm
        token={params.token}
        initial={{
          contact_phone:        assessment.contact_phone,
          contact_linkedin:     assessment.contact_linkedin,
          company_name:         assessment.company_name,
          company_industry:     assessment.company_industry,
          company_size:         assessment.company_size,
          company_revenue:      assessment.company_revenue,
          company_headquarters: assessment.company_headquarters,
          company_website:      assessment.company_website,
          ai_motivation:        assessment.ai_motivation,
          ai_current_usage:     assessment.ai_current_usage,
          salesforce_edition:   assessment.salesforce_edition,
          salesforce_clouds:    assessment.salesforce_clouds,
        }}
        snapshotQuestions={snapshotQuestions}
        initialSnapshotChecks={initialSnapshotChecks}
        timeEstimate={timeEstimate}
      />
    </div>
  )
}
