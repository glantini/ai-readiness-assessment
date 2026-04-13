'use server'

import { createServiceClient } from '@/lib/supabase/server'
import type { ReferralPartner, SfTeamRegion } from '@/types'
import { SF_TEAM_REGIONS } from '@/types'

function isValidRegion(v: string | null): v is SfTeamRegion {
  return v != null && (SF_TEAM_REGIONS as string[]).includes(v)
}

export async function createReferralPartner(formData: FormData): Promise<
  { error: string } | { partner: ReferralPartner }
> {
  const supabase = createServiceClient()

  const str = (key: string): string | null =>
    (formData.get(key) as string)?.trim() || null

  const name = str('name')
  const email = str('email')

  if (!name || !email) {
    return { error: 'Name and email are required.' }
  }

  const rawRegion = str('sf_team_region')
  const sf_team_region = isValidRegion(rawRegion) ? rawRegion : null

  const { data, error } = await supabase
    .from('referral_partners')
    .insert({
      name,
      email,
      company:        str('company'),
      city:           str('city'),
      sf_team_region,
      notes:          str('notes'),
    })
    .select('*')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create referral partner.' }
  }

  return { partner: data as ReferralPartner }
}

export async function searchReferralPartners(query: string): Promise<
  ReferralPartner[]
> {
  const supabase = createServiceClient()
  const q = query.trim()

  let builder = supabase
    .from('referral_partners')
    .select('*')
    .order('name', { ascending: true })
    .limit(10)

  if (q.length > 0) {
    // ILIKE on name OR email OR company
    const pattern = `%${q.replace(/[%_]/g, (c) => '\\' + c)}%`
    builder = builder.or(
      `name.ilike.${pattern},email.ilike.${pattern},company.ilike.${pattern}`,
    )
  }

  const { data, error } = await builder
  if (error) {
    console.error('[referralPartners] search failed:', error)
    return []
  }
  return (data ?? []) as ReferralPartner[]
}
