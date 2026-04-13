'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAssessment } from '@/app/actions/assessments'
import ReferralPartnerLookup from './ReferralPartnerLookup'

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'

function Label({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      {subtitle && (
        <span className="text-xs text-gray-400 font-normal normal-case tracking-normal">
          {subtitle}
        </span>
      )}
    </div>
  )
}

export default function NewAssessmentPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createAssessment(formData)
      if (result?.error) {
        setError(result.error)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        router.push('/dashboard')
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">

        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">New Assessment</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the client&apos;s contact info and send them the assessment link. They&apos;ll fill in
            the rest when they start.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Client contact ───────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <SectionHeader title="Client Contact" />
            <div className="px-6 py-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label required>First Name</Label>
                <input type="text" name="contact_first_name" required className={inputCls} />
              </div>

              <div>
                <Label required>Last Name</Label>
                <input type="text" name="contact_last_name" required className={inputCls} />
              </div>

              <div>
                <Label required>Email</Label>
                <input type="email" name="contact_email" required className={inputCls} />
              </div>

              <div>
                <Label required>Company</Label>
                <input type="text" name="company_name" required className={inputCls} />
              </div>
            </div>
          </section>

          {/* ── Referral Partner ─────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <SectionHeader title="Referral Partner" subtitle="(optional)" />
            <div className="px-6 py-6">
              <Label>Link Salesforce AE / Partner</Label>
              <ReferralPartnerLookup />
              <p className="mt-2 text-xs text-gray-500">
                Search an existing partner or add a new one inline.{' '}
                <Link href="/dashboard/partners/new" className="text-blue-700 hover:underline">
                  Create in full page →
                </Link>
              </p>
            </div>
          </section>

          <div className="flex items-center justify-end gap-4 pb-8">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Creating…' : 'Create & Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
