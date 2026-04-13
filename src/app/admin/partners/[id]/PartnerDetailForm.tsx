'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateReferralPartner,
  togglePartnerActive,
} from '@/app/actions/referralPartners'
import { SF_TEAM_REGIONS, type ReferralPartner } from '@/types'

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

export default function PartnerDetailForm({
  partner,
}: {
  partner: ReferralPartner
}) {
  const router = useRouter()
  const [isSaving, startSave] = useTransition()
  const [isToggling, startToggle] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(partner.is_active)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)

    startSave(async () => {
      const result = await updateReferralPartner(partner.id, formData)
      if ('error' in result) {
        setError(result.error)
      } else {
        setSuccess('Partner updated.')
        router.refresh()
      }
    })
  }

  function handleToggle() {
    setError(null)
    setSuccess(null)
    const next = !isActive

    startToggle(async () => {
      const result = await togglePartnerActive(partner.id, next)
      if ('error' in result) {
        setError(result.error)
      } else {
        setIsActive(next)
        setSuccess(next ? 'Partner activated.' : 'Partner deactivated.')
        router.refresh()
      }
    })
  }

  return (
    <>
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Partner details</h2>
            <span
              className={
                isActive
                  ? 'inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20'
                  : 'inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20'
              }
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
            <div>
              <Label required>Name</Label>
              <input
                type="text"
                name="name"
                required
                defaultValue={partner.name}
                className={inputCls}
              />
            </div>

            <div>
              <Label required>Email</Label>
              <input
                type="email"
                name="email"
                required
                defaultValue={partner.email}
                className={inputCls}
              />
            </div>

            <div>
              <Label>Company</Label>
              <input
                type="text"
                name="company"
                defaultValue={partner.company ?? ''}
                className={inputCls}
              />
            </div>

            <div>
              <Label>City</Label>
              <input
                type="text"
                name="city"
                defaultValue={partner.city ?? ''}
                className={inputCls}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Salesforce Team / Region</Label>
              <select
                name="sf_team_region"
                defaultValue={partner.sf_team_region ?? ''}
                className={selectCls}
              >
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
                defaultValue={partner.notes ?? ''}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={
              isActive
                ? 'rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60'
                : 'rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60'
            }
          >
            {isToggling
              ? 'Saving…'
              : isActive
                ? 'Deactivate'
                : 'Activate'}
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </>
  )
}
