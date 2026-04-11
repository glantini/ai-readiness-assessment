'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAssessment(token: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('assessments')
    .select('id, uses_salesforce')
    .eq('token', token)
    .single()
  if (error || !data) return null
  return data
}

async function upsertLayer1Responses(
  assessmentId: string,
  responses: Record<string, number>,
): Promise<string | undefined> {
  const supabase = createServiceClient()

  const rows = Object.entries(responses).map(([question_id, value]) => ({
    assessment_id: assessmentId,
    question_id,
    layer: 'layer1' as const,
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
 * Saves responses for one Layer 1 category (intermediate step).
 * Returns an error object on failure; returns undefined on success.
 */
export async function saveLayer1Category(
  token: string,
  responses: Record<string, number>,
): Promise<{ error: string } | undefined> {
  const assessment = await getAssessment(token)
  if (!assessment) return { error: 'Assessment not found. Please check your link and try again.' }

  const err = await upsertLayer1Responses(assessment.id, responses)
  if (err) return { error: err }
}

/**
 * Saves responses for the final Layer 1 category, then redirects:
 * - → /assess/[token]/layer2   if uses_salesforce is true
 * - → /assess/[token]/complete  otherwise
 */
export async function saveLayer1AndFinish(
  token: string,
  responses: Record<string, number>,
): Promise<{ error: string } | undefined> {
  const assessment = await getAssessment(token)
  if (!assessment) return { error: 'Assessment not found. Please check your link and try again.' }

  const err = await upsertLayer1Responses(assessment.id, responses)
  if (err) return { error: err }

  redirect(
    assessment.uses_salesforce
      ? `/assess/${token}/layer2`
      : `/assess/${token}/complete`,
  )
}
