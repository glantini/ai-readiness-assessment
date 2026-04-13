'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import type { SalesforceCloud, SalesforceEdition } from '@/types'
import { SALESFORCE_CLOUDS, SALESFORCE_EDITIONS } from '@/types'

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

  const { data: assessment, error: findError } = await supabase
    .from('assessments')
    .select('id, status')
    .eq('token', token)
    .single()

  if (findError || !assessment) {
    return { error: 'Assessment not found. Please check your link and try again.' }
  }

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

  if (assessment.status === 'pending') {
    await supabase
      .from('assessments')
      .update({ status: 'in_progress', current_section: 'layer1' })
      .eq('id', assessment.id)
  } else {
    await supabase
      .from('assessments')
      .update({ current_section: 'layer1' })
      .eq('id', assessment.id)
  }

  redirect(`/assess/${token}/layer1`)
}

/**
 * Save the client intake (profile + AI context + Salesforce clouds) and
 * snapshot checkboxes in a single submission, then advance to Layer 1.
 */
export async function saveIntake(
  token: string,
  intake: {
    contact_phone: string | null
    contact_linkedin: string | null
    company_name: string | null
    company_industry: string | null
    company_size: string | null
    company_revenue: string | null
    company_headquarters: string | null
    company_website: string | null
    ai_motivation: string | null
    ai_current_usage: string | null
    salesforce_edition: string | null
    salesforce_clouds: string[]
  },
  snapshot: Record<string, boolean>,
): Promise<{ error: string } | undefined> {
  const supabase = createServiceClient()

  const { data: assessment, error: findError } = await supabase
    .from('assessments')
    .select('id, status')
    .eq('token', token)
    .single()

  if (findError || !assessment) {
    return { error: 'Assessment not found. Please check your link and try again.' }
  }

  if (!intake.company_name || intake.company_name.trim().length === 0) {
    return { error: 'Company name is required.' }
  }

  const edition = (SALESFORCE_EDITIONS as readonly string[]).includes(intake.salesforce_edition ?? '')
    ? (intake.salesforce_edition as SalesforceEdition)
    : null

  const validCloudValues = new Set(SALESFORCE_CLOUDS.map((c) => c.value))
  const clouds = (intake.salesforce_clouds ?? []).filter(
    (c): c is SalesforceCloud => validCloudValues.has(c as SalesforceCloud),
  )

  // Edition of "None" means the client does not use Salesforce.
  const usesSalesforce = edition != null && edition !== 'None'

  const updatePayload = {
    contact_phone:        intake.contact_phone,
    contact_linkedin:     intake.contact_linkedin,
    company_name:         intake.company_name,
    company_industry:     intake.company_industry,
    company_size:         intake.company_size,
    company_revenue:      intake.company_revenue,
    company_headquarters: intake.company_headquarters,
    company_website:      intake.company_website,
    ai_motivation:        intake.ai_motivation,
    ai_current_usage:     intake.ai_current_usage,
    uses_salesforce:      usesSalesforce,
    salesforce_edition:   edition,
    salesforce_clouds:    usesSalesforce && clouds.length > 0 ? clouds : null,
    status: assessment.status === 'pending' ? 'in_progress' : assessment.status,
    current_section: 'layer1' as const,
  }

  const { error: updateErr } = await supabase
    .from('assessments')
    .update(updatePayload)
    .eq('id', assessment.id)

  if (updateErr) {
    return { error: updateErr.message }
  }

  const rows = Object.entries(snapshot).map(([question_id, value]) => ({
    assessment_id: assessment.id,
    question_id,
    layer: 'snapshot' as const,
    value,
  }))

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from('responses')
      .upsert(rows, { onConflict: 'assessment_id,question_id' })
    if (upsertError) {
      return { error: upsertError.message }
    }
  }

  redirect(`/assess/${token}/layer1`)
}
