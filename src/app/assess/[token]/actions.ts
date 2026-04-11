'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Persists Operations Snapshot checkbox answers and advances to Layer 1.
 *
 * @param token  - The public assessment token from the URL
 * @param checks - Map of question_id → boolean (true = checked)
 */
export async function saveSnapshot(
  token: string,
  checks: Record<string, boolean>
): Promise<{ error: string } | undefined> {
  const supabase = createServiceClient()

  // Validate token and retrieve the internal assessment id + current status
  const { data: assessment, error: findError } = await supabase
    .from('assessments')
    .select('id, status')
    .eq('token', token)
    .single()

  if (findError || !assessment) {
    return { error: 'Assessment not found. Please check your link and try again.' }
  }

  // Upsert one response row per snapshot question
  const rows = Object.entries(checks).map(([question_id, value]) => ({
    assessment_id: assessment.id,
    question_id,
    layer: 'snapshot' as const,
    value,
  }))

  const { error: upsertError } = await supabase
    .from('responses')
    .upsert(rows, { onConflict: 'assessment_id,question_id' })

  if (upsertError) {
    return { error: upsertError.message }
  }

  // Advance status from pending → in_progress on first submission
  if (assessment.status === 'pending') {
    await supabase
      .from('assessments')
      .update({ status: 'in_progress' })
      .eq('id', assessment.id)
  }

  redirect(`/assess/${token}/layer1`)
}
