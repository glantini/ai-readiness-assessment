import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Handles the OAuth redirect from Supabase after Google sign-in.
 * Exchanges the one-time code for a session cookie, then redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')

  // Supabase sends ?error= if the user denied access or something went wrong
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error)}`
    )
  }

  if (code) {
    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Successful sign-in — redirect to intended destination
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Fallback: something went wrong — send back to login with a generic error
  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`
  )
}
