import Link from 'next/link'
import { signOutPartner } from '@/app/actions/partnerAuth'
import type { ReferralPartner } from '@/types'

export default function PartnerHeader({ partner }: { partner: ReferralPartner }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/partner/dashboard" className="flex items-center gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-700">
              Partner Portal
            </p>
            <p className="text-sm font-semibold text-gray-900">
              AI Readiness Assessment
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">{partner.name}</p>
            <p className="text-xs text-gray-500">{partner.email}</p>
          </div>
          <form action={signOutPartner}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
