'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createReferralPartner } from '@/app/actions/referralPartners'
import { SF_TEAM_REGIONS } from '@/types'

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'

const selectCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  )
}

export default function NewReferralPartnerPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createReferralPartner(formData)
      if ('error' in result) {
        setError(result.error)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        router.push('/admin')
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">

        <div className="mb-8">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">New Referral Partner</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a Salesforce AE or partner who can be linked to assessments.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div>
                <Label required>Name</Label>
                <input type="text" name="name" required className={inputCls} />
              </div>

              <div>
                <Label required>Email</Label>
                <input type="email" name="email" required className={inputCls} />
              </div>

              <div>
                <Label>Company</Label>
                <input type="text" name="company" className={inputCls} />
              </div>

              <div>
                <Label>City</Label>
                <input type="text" name="city" placeholder="e.g. San Francisco" className={inputCls} />
              </div>

              <div className="sm:col-span-2">
                <Label>Salesforce Team / Region</Label>
                <select name="sf_team_region" className={selectCls}>
                  <option value="">Select team…</option>
                  {SF_TEAM_REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Relationship context, areas of focus, etc."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-4 pb-8">
            <Link href="/admin" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Saving…' : 'Save Referral Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
