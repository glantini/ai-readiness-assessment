import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import {
  calculateLayer1Scores,
  calculateLayer2Scores,
  saveScoresToReport,
} from '@/lib/scoring'

export default async function CompletePage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createServiceClient()

  // Verify the token is valid
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select('id, status, contact_first_name, company_name, uses_salesforce')
    .eq('token', params.token)
    .single()

  if (error || !assessment) notFound()

  // Mark the assessment as completed and trigger scoring (idempotent on repeat visits)
  if (assessment.status !== 'completed') {
    await supabase
      .from('assessments')
      .update({ status: 'completed' })
      .eq('id', assessment.id)

    // Calculate and persist scores — non-fatal if this fails
    try {
      const [layer1, layer2] = await Promise.all([
        calculateLayer1Scores(assessment.id),
        assessment.uses_salesforce
          ? calculateLayer2Scores(assessment.id)
          : Promise.resolve(null),
      ])
      await saveScoresToReport(assessment.id, layer1, layer2)
    } catch (err) {
      console.error('[scoring] Failed to score assessment', assessment.id, err)
    }
  }

  const firstName = assessment.contact_first_name ?? 'there'

  return (
    <div className="flex flex-col items-center py-12 text-center">

      {/* Check icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
        You&apos;re all done, {firstName}!
      </h1>

      <p className="mt-3 max-w-md text-base text-gray-500">
        Thank you for completing the AI Readiness Assessment
        {assessment.company_name ? ` for ${assessment.company_name}` : ''}.
      </p>

      {/* Divider */}
      <div className="my-8 w-16 border-t border-gray-200" />

      {/* Next steps card */}
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-8 py-7 text-left shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          What happens next
        </h2>

        <ol className="mt-4 space-y-4">
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              1
            </span>
            <p className="text-sm leading-relaxed text-gray-700">
              Your responses are being scored and your personalised AI Readiness
              Report is being prepared.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              2
            </span>
            <p className="text-sm leading-relaxed text-gray-700">
              You will receive your report by email within one business day.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              3
            </span>
            <p className="text-sm leading-relaxed text-gray-700">
              An IMG team member will follow up to walk you through the findings
              and discuss recommended next steps.
            </p>
          </li>
        </ol>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-gray-400">
        Questions? Reach out to your IMG representative.
      </p>

    </div>
  )
}
