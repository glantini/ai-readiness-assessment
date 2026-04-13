'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

const ERROR_LABELS: Record<string, string> = {
  access_restricted: 'Access restricted.',
  wrong_domain: 'Access restricted.',
  not_registered:
    'Your email is not registered as a partner. Contact the administrator.',
  unauthorized:
    'Your email is not registered as a partner. Contact the administrator.',
}

export default function PartnerLoginPage() {
  return (
    <Suspense fallback={null}>
      <PartnerLoginInner />
    </Suspense>
  )
}

function PartnerLoginInner() {
  const search = useSearchParams()
  const next = search.get('next') ?? '/partner/dashboard'
  const errorParam = search.get('error')
  const presetError = errorParam ? ERROR_LABELS[errorParam] ?? errorParam : null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(presetError)

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-blue-700 px-8 py-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
              Partner Portal
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">
              AI Readiness Assessment
            </h1>
          </div>

          <div className="px-8 py-8">
            <p className="mb-6 text-center text-sm text-gray-500">
              Sign in with your{' '}
              <span className="font-medium text-gray-700">@salesforce.com</span>{' '}
              Google account to continue.
            </p>

            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {loading ? 'Redirecting…' : 'Sign in with Google'}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Access is restricted to registered Salesforce partners.
        </p>
      </div>
    </div>
  )
}
