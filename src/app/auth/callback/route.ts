import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * OAuth redirect handler. Exchanges the one-time code for a session, then
 * routes based on the authenticated email:
 *   - @growwithimg.com         → /admin (full admin access)
 *   - @salesforce.com + in referral_partners → /partner/dashboard
 *   - anything else            → sign out, bounce to login with error
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? ''
  const oauthError = searchParams.get('error')

  // Decide which login to bounce back to on failure
  const loginPath = next.startsWith('/partner') ? '/partner/login' : '/auth/login'

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}${loginPath}?error=${encodeURIComponent(oauthError)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}${loginPath}?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    )
  }

  const supabase = createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}${loginPath}?error=${encodeURIComponent('Authentication failed. Please try again.')}`
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const email = user?.email?.toLowerCase() ?? ''

  // Admin domain — full access, no DB lookup required
  if (email.endsWith('@growwithimg.com')) {
    return NextResponse.redirect(`${origin}/admin`)
  }

  // Salesforce partners — must exist in referral_partners
  if (email.endsWith('@salesforce.com')) {
    const service = createServiceClient()
    const { data: partner } = await service
      .from('referral_partners')
      .select('id')
      .ilike('email', email)
      .maybeSingle()

    if (partner) {
      return NextResponse.redirect(`${origin}/partner/dashboard`)
    }

    await supabase.auth.signOut()
    return NextResponse.redirect(
      `${origin}${loginPath}?error=${encodeURIComponent('not_registered')}`
    )
  }

  // Anything else — access restricted
  await supabase.auth.signOut()
  return NextResponse.redirect(
    `${origin}${loginPath}?error=${encodeURIComponent('access_restricted')}`
  )
}
