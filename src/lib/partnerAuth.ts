import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ReferralPartner } from '@/types'

export type PartnerAuthResult =
  | { status: 'unauthenticated' }
  | { status: 'wrong_domain'; email: string }
  | { status: 'not_registered'; email: string }
  | { status: 'deactivated'; email: string }
  | { status: 'ok'; partner: ReferralPartner }

const ALLOWED_DOMAIN = '@salesforce.com'

/**
 * Resolve the currently signed-in user to a referral partner record.
 * Enforces two gates:
 *   1. Email must end with @salesforce.com
 *   2. Email must exist in referral_partners table
 */
export async function resolvePartner(): Promise<PartnerAuthResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return { status: 'unauthenticated' }

  const email = user.email.toLowerCase()

  if (!email.endsWith(ALLOWED_DOMAIN)) {
    return { status: 'wrong_domain', email }
  }

  const service = createServiceClient()
  const { data } = await service
    .from('referral_partners')
    .select('*')
    .ilike('email', email)
    .maybeSingle()

  if (!data) return { status: 'not_registered', email }

  const partner = data as ReferralPartner
  if (!partner.is_active) return { status: 'deactivated', email }

  return { status: 'ok', partner }
}

/**
 * Convenience wrapper for routes that only need the partner record.
 * Returns null when access should be denied.
 */
export async function getPartner(): Promise<ReferralPartner | null> {
  const result = await resolvePartner()
  return result.status === 'ok' ? result.partner : null
}
