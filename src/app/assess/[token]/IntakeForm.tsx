'use client'

import { useState, useTransition } from 'react'
import { saveIntake } from './actions'
import type { Question } from '@/types'
import {
  INDUSTRIES,
  COMPANY_SIZES,
  REVENUE_RANGES,
  AI_MOTIVATIONS,
  AI_CURRENT_USAGES,
  SALESFORCE_EDITIONS,
  SALESFORCE_CLOUDS,
} from '@/types'

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

interface IntakeInitial {
  contact_phone: string | null
  contact_linkedin: string | null
  company_name: string | null
  company_industry: string | null
  company_size: string | null
  company_revenue: string | null
  company_headquarters: string | null
  company_website: string | null
  ai_motivation: string | null
  ai_current_usage: string | null
  salesforce_edition: string | null
  salesforce_clouds: string[] | null
}

interface Props {
  token: string
  initial: IntakeInitial
  snapshotQuestions: Question[]
  initialSnapshotChecks: Record<string, boolean>
  timeEstimate: string
}

export default function IntakeForm({
  token,
  initial,
  snapshotQuestions,
  initialSnapshotChecks,
  timeEstimate,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [edition, setEdition] = useState<string>(initial.salesforce_edition ?? '')
  const [clouds, setClouds] = useState<Set<string>>(
    new Set(initial.salesforce_clouds ?? []),
  )
  const [snapshot, setSnapshot] = useState<Record<string, boolean>>(initialSnapshotChecks)

  const showClouds = edition !== '' && edition !== 'None'

  function toggleCloud(value: string) {
    setClouds((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function toggleSnapshot(id: string) {
    setSnapshot((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const str = (k: string) => {
      const v = fd.get(k)
      return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
    }

    startTransition(async () => {
      const result = await saveIntake(
        token,
        {
          contact_phone:        str('contact_phone'),
          contact_linkedin:     str('contact_linkedin'),
          company_name:         str('company_name'),
          company_industry:     str('company_industry'),
          company_size:         str('company_size'),
          company_revenue:      str('company_revenue'),
          company_headquarters: str('company_headquarters'),
          company_website:      str('company_website'),
          ai_motivation:        str('ai_motivation'),
          ai_current_usage:     str('ai_current_usage'),
          salesforce_edition:   edition || null,
          salesforce_clouds:    showClouds ? Array.from(clouds) : [],
        },
        snapshot,
      )
      if (result?.error) {
        setError(result.error)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Your details ─────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Your details
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
          <div>
            <Label>Phone</Label>
            <input
              type="tel"
              name="contact_phone"
              defaultValue={initial.contact_phone ?? ''}
              className={inputCls}
            />
          </div>
          <div>
            <Label>LinkedIn URL</Label>
            <input
              type="url"
              name="contact_linkedin"
              defaultValue={initial.contact_linkedin ?? ''}
              placeholder="https://linkedin.com/in/..."
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ── Company ──────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Company
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label required>Company Name</Label>
            <input
              type="text"
              name="company_name"
              required
              defaultValue={initial.company_name ?? ''}
              className={inputCls}
            />
          </div>
          <div>
            <Label>Industry</Label>
            <select name="company_industry" defaultValue={initial.company_industry ?? ''} className={selectCls}>
              <option value="">Select industry…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Company Size</Label>
            <select name="company_size" defaultValue={initial.company_size ?? ''} className={selectCls}>
              <option value="">Select size…</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>{s} employees</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Annual Revenue</Label>
            <select name="company_revenue" defaultValue={initial.company_revenue ?? ''} className={selectCls}>
              <option value="">Select range…</option>
              {REVENUE_RANGES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Headquarters</Label>
            <input
              type="text"
              name="company_headquarters"
              placeholder="City, State"
              defaultValue={initial.company_headquarters ?? ''}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Website</Label>
            <input
              type="url"
              name="company_website"
              placeholder="https://..."
              defaultValue={initial.company_website ?? ''}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ── AI Context ───────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            AI Context
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2">
          <div>
            <Label>Primary Motivation</Label>
            <select name="ai_motivation" defaultValue={initial.ai_motivation ?? ''} className={selectCls}>
              <option value="">Select motivation…</option>
              {AI_MOTIVATIONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Current AI Usage</Label>
            <select name="ai_current_usage" defaultValue={initial.ai_current_usage ?? ''} className={selectCls}>
              <option value="">Select usage…</option>
              {AI_CURRENT_USAGES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── Salesforce ───────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Salesforce
          </h2>
        </div>
        <div className="space-y-5 px-6 py-6">
          <div className="max-w-xs">
            <Label>Salesforce Edition</Label>
            <select
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
              className={selectCls}
            >
              <option value="">Select edition…</option>
              {SALESFORCE_EDITIONS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {showClouds && (
            <div>
              <Label>Active Clouds</Label>
              <div className="mt-1 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {SALESFORCE_CLOUDS.map((cloud) => (
                  <label key={cloud.value} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={clouds.has(cloud.value)}
                      onChange={() => toggleCloud(cloud.value)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span className="text-sm text-gray-700">{cloud.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Operations Snapshot ──────────────────────────────────────── */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Operations Snapshot
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Check any that apply — this helps us tailor your report
          </p>
        </div>
        <div className="space-y-3 px-6 py-6">
          {snapshotQuestions.map((q) => (
            <label
              key={q.id}
              className={[
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                snapshot[q.id]
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={snapshot[q.id] ?? false}
                onChange={() => toggleSnapshot(q.id)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-sm leading-relaxed text-gray-700">{q.text}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ── Estimated time + continue ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Estimated time:{' '}
            <span className="font-medium text-gray-900">{timeEstimate}</span>
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-0 rounded-full bg-blue-600" />
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Start Assessment →'}
        </button>
      </div>
    </form>
  )
}
