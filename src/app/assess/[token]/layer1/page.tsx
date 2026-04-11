import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { layer1ByCategory, LAYER1_CATEGORIES } from '@/lib/questions/layer1'
import type { Layer1Category } from '@/lib/questions/layer1'
import Layer1Form from './Layer1Form'

export default async function Layer1Page({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createServiceClient()

  // Load assessment — only the fields this page needs
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select('id, status, uses_salesforce')
    .eq('token', params.token)
    .single()

  if (error || !assessment) notFound()

  // Pre-populate any previously saved Layer 1 responses
  const { data: existing } = await supabase
    .from('responses')
    .select('question_id, value')
    .eq('assessment_id', assessment.id)
    .eq('layer', 'layer1')

  const initialAnswers: Record<string, number> = {}
  for (const r of existing ?? []) {
    // value is stored as jsonb — Supabase returns numbers as JS numbers
    if (typeof r.value === 'number') {
      initialAnswers[r.question_id] = r.value
    }
  }

  // Resume at the first category that still has unanswered questions
  let initialStep = 0
  for (let i = 0; i < LAYER1_CATEGORIES.length; i++) {
    const cat = LAYER1_CATEGORIES[i] as Layer1Category
    const catComplete = layer1ByCategory[cat].every(
      (q) => initialAnswers[q.id] !== undefined,
    )
    if (!catComplete) {
      initialStep = i
      break
    }
    // Edge case: all categories already answered — land on the last step
    if (i === LAYER1_CATEGORIES.length - 1) {
      initialStep = LAYER1_CATEGORIES.length - 1
    }
  }

  const totalSections = assessment.uses_salesforce ? 2 : 1

  return (
    <div className="space-y-4">

      {/* Section label */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium text-gray-700">Section 1 of {totalSections}</span>
        <span className="text-gray-300" aria-hidden="true">—</span>
        <span>General AI Readiness</span>
      </div>

      <Layer1Form
        token={params.token}
        initialStep={initialStep}
        initialAnswers={initialAnswers}
      />

    </div>
  )
}
