import { notFound, redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import {
  layer2BySection,
  LAYER2_SECTIONS_ORDER,
  type YesNoValue,
} from '@/lib/questions/layer2'
import type { Layer2Section, SalesforceCloud } from '@/types'
import Layer2Form from './Layer2Form'

export default async function Layer2Page({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createServiceClient()

  // Load assessment fields needed for section gating
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select('id, status, uses_salesforce, salesforce_clouds')
    .eq('token', params.token)
    .single()

  if (error || !assessment) notFound()

  // Layer 2 is only for Salesforce users — redirect others to completion
  if (!assessment.uses_salesforce) {
    redirect(`/assess/${params.token}/complete`)
  }

  // Determine which sections are active for this respondent
  const activeClouds: SalesforceCloud[] =
    (assessment.salesforce_clouds as SalesforceCloud[] | null) ?? []

  const activeSections: Layer2Section[] = LAYER2_SECTIONS_ORDER.filter((sec) => {
    if (sec === 'CorePrereqs' || sec === 'DataCloud') return true
    // Product cloud sections are gated by cloud selection
    const cloudMap: Record<string, SalesforceCloud> = {
      SalesCloud: 'SalesCloud',
      ServiceCloud: 'ServiceCloud',
      MarketingCloud: 'MarketingCloud',
    }
    return activeClouds.includes(cloudMap[sec])
  })

  // Pre-populate any previously saved Layer 2 responses
  const { data: existing } = await supabase
    .from('responses')
    .select('question_id, value')
    .eq('assessment_id', assessment.id)
    .eq('layer', 'layer2')

  const initialAnswers: Record<string, YesNoValue> = {}
  for (const r of existing ?? []) {
    if (r.value === 'yes' || r.value === 'partial' || r.value === 'no') {
      initialAnswers[r.question_id] = r.value as YesNoValue
    }
  }

  // Resume at the first section that still has unanswered questions
  let initialStep = 0
  for (let i = 0; i < activeSections.length; i++) {
    const sec = activeSections[i]
    const sectionComplete = layer2BySection[sec].every(
      (q) => initialAnswers[q.id] !== undefined,
    )
    if (!sectionComplete) {
      initialStep = i
      break
    }
    // Edge case: all sections already answered — land on the last step
    if (i === activeSections.length - 1) {
      initialStep = activeSections.length - 1
    }
  }

  return (
    <div className="space-y-4">

      {/* Section label */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">Section 2 of 2</span>
        <span className="text-gray-300" aria-hidden="true">—</span>
        <span>Agentforce Readiness</span>
      </div>

      <Layer2Form
        token={params.token}
        activeSections={activeSections}
        initialStep={initialStep}
        initialAnswers={initialAnswers}
      />

    </div>
  )
}
