'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import type { YesNoValue } from '@/lib/questions/layer2'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAssessment(token: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('assessments')
    .select('id')
    .eq('token', token)
    .single()
  if (error || !data) return null
  return data
}

async function upsertLayer2Responses(
  assessmentId: string,
  responses: Record<string, YesNoValue>,
): Promise<string | undefined> {
  const supabase = createServiceClient()

  const rows = Object.entries(responses).map(([question_id, value]) => ({
    assessment_id: assessmentId,
    question_id,
    layer: 'layer2' as const,
    value,
  }))

  if (rows.length === 0) return undefined

  const { error } = await supabase
    .from('responses')
    .upsert(rows, { onConflict: 'assessment_id,question_id' })

  return error?.message
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Saves responses for one Layer 2 section (intermediate step).
 * Returns an error object on failure; returns undefined on success.
 */
export async function saveLayer2Section(
  token: string,
  responses: Record<string, YesNoValue>,
): Promise<{ error: string } | undefined> {
  const assessment = await getAssessment(token)
  if (!assessment) return { error: 'Assessment not found. Please check your link and try again.' }

  const err = await upsertLayer2Responses(assessment.id, responses)
  if (err) return { error: err }
}

/**
 * Saves responses for the final Layer 2 section, then redirects to /complete.
 */
export async function saveLayer2AndFinish(
  token: string,
  responses: Record<string, YesNoValue>,
): Promise<{ error: string } | undefined> {
  const assessment = await getAssessment(token)
  if (!assessment) return { error: 'Assessment not found. Please check your link and try again.' }

  const err = await upsertLayer2Responses(assessment.id, responses)
  if (err) return { error: err }

  const supabase = createServiceClient()
  await supabase
    .from('assessments')
    .update({ current_section: 'complete' })
    .eq('id', assessment.id)

  redirect(`/assess/${token}/complete`)
}
