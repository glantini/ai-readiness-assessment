'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOutAdmin } from '@/app/actions/adminAuth'
import Logo from '@/components/Logo'

const NAV_ITEMS: { href: string; label: string; matchPrefix?: string }[] = [
  { href: '/admin', label: 'Dashboard' },
  {
    href: '/admin/partners',
    label: 'Referral Partners',
    matchPrefix: '/admin/partners',
  },
  {
    href: '/admin/assessments/new',
    label: 'New Assessment',
    matchPrefix: '/admin/assessments/new',
  },
]

function isActive(pathname: string, item: (typeof NAV_ITEMS)[number]): boolean {
  if (item.matchPrefix) return pathname.startsWith(item.matchPrefix)
  return pathname === item.href
}

export default function AdminNav({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/admin" className="flex items-center gap-3">
          <Logo variant="light" size="md" />
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="hidden text-xs text-gray-500 sm:block">
              {userEmail}
            </span>
          )}
          <form action={signOutAdmin}>
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
