import { redirect } from 'next/navigation'
import { resolvePartner } from '@/lib/partnerAuth'
import { signOutPartner } from '@/app/actions/partnerAuth'
import PartnerHeader from '../PartnerHeader'

export const dynamic = 'force-dynamic'

export default async function PartnerAuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const result = await resolvePartner()

  if (result.status === 'unauthenticated') {
    redirect('/partner/login')
  }

  if (result.status !== 'ok') {
    const message =
      result.status === 'wrong_domain'
        ? 'Access is restricted to Salesforce employees.'
        : 'Your email is not registered as a partner. Contact the administrator.'

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Access denied</h1>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          <p className="mt-1 text-xs text-gray-400">Signed in as {result.email}</p>
          <form action={signOutPartner} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800"
            >
              Sign out and try again
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PartnerHeader partner={result.partner} />
      {children}
    </div>
  )
}
