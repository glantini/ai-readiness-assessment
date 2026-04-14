'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const linkClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? 'bg-slate-700 text-blue-400'
        : 'text-slate-300 hover:bg-slate-700 hover:text-slate-50'
    }`

  return (
    <header className="border-b border-slate-700 bg-slate-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/admin" className="flex items-center gap-3">
          <Logo variant="dark" size="md" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(isActive(pathname, item))}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {userEmail && (
            <span className="hidden max-w-[16ch] truncate text-xs text-slate-400 lg:inline">
              {userEmail}
            </span>
          )}
          <form action={signOutAdmin}>
            <button
              type="submit"
              className="rounded-lg border border-slate-600 bg-transparent px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          className="-mr-2 inline-flex items-center justify-center rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-50 md:hidden"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-700 md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${linkClass(isActive(pathname, item))} block`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 pt-3">
              {userEmail && (
                <span className="truncate text-xs text-slate-400">{userEmail}</span>
              )}
              <form action={signOutAdmin} className="ml-auto">
                <button
                  type="submit"
                  className="rounded-lg border border-slate-600 bg-transparent px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-slate-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
