'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { searchReferralPartners, createReferralPartner } from '@/app/actions/referralPartners'
import type { ReferralPartner } from '@/types'
import { SF_TEAM_REGIONS } from '@/types'

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'

const selectCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'

export default function ReferralPartnerLookup() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ReferralPartner[]>([])
  const [selected, setSelected] = useState<ReferralPartner | null>(null)
  const [open, setOpen] = useState(false)
  const [showInlineAdd, setShowInlineAdd] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search
  useEffect(() => {
    if (selected) return
    const t = setTimeout(async () => {
      const rows = await searchReferralPartners(query)
      setResults(rows)
    }, 180)
    return () => clearTimeout(t)
  }, [query, selected])

  function pick(p: ReferralPartner) {
    setSelected(p)
    setQuery('')
    setOpen(false)
    setShowInlineAdd(false)
  }

  function clear() {
    setSelected(null)
    setQuery('')
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="referral_partner_id" value={selected?.id ?? ''} />

      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{selected.name}</p>
            <p className="text-xs text-gray-600">
              {selected.email}
              {selected.company ? ` · ${selected.company}` : ''}
              {selected.sf_team_region ? ` · ${selected.sf_team_region}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={query}
            placeholder="Search by name, email, or company…"
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            className={inputCls}
            autoComplete="off"
          />

          {open && !showInlineAdd && (
            <div className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {results.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-500">No referral partners found.</p>
                  <button
                    type="button"
                    onClick={() => setShowInlineAdd(true)}
                    className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    + Add new partner
                  </button>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-gray-100">
                    {results.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => pick(p)}
                          className="flex w-full flex-col items-start px-4 py-2.5 text-left hover:bg-gray-50"
                        >
                          <span className="text-sm font-medium text-gray-900">{p.name}</span>
                          <span className="text-xs text-gray-500">
                            {p.email}
                            {p.company ? ` · ${p.company}` : ''}
                            {p.sf_team_region ? ` · ${p.sf_team_region}` : ''}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-100 px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setShowInlineAdd(true)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      + Add new partner
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {open && showInlineAdd && (
            <InlineAddPanel
              initialName={query}
              onCancel={() => setShowInlineAdd(false)}
              onCreated={pick}
            />
          )}
        </>
      )}
    </div>
  )
}

function InlineAddPanel({
  initialName,
  onCancel,
  onCreated,
}: {
  initialName: string
  onCancel: () => void
  onCreated: (p: ReferralPartner) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createReferralPartner(formData)
      if ('error' in result) {
        setError(result.error)
      } else {
        onCreated(result.partner)
      }
    })
  }

  return (
    <div className="absolute left-0 right-0 z-20 mt-1 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Add Referral Partner
      </p>
      {error && (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            name="name"
            required
            defaultValue={initialName}
            placeholder="Name *"
            className={inputCls}
          />
          <input type="email" name="email" required placeholder="Email *" className={inputCls} />
          <input type="text" name="company" placeholder="Company" className={inputCls} />
          <input type="text" name="city" placeholder="City" className={inputCls} />
          <select name="sf_team_region" className={`${selectCls} sm:col-span-2`}>
            <option value="">Salesforce team / region…</option>
            {SF_TEAM_REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending ? 'Saving…' : 'Add & Link'}
          </button>
        </div>
      </form>
    </div>
  )
}
