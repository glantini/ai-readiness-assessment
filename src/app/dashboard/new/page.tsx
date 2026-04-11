'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAssessment } from '@/app/actions/assessments'
import {
  INDUSTRIES,
  COMPANY_SIZES,
  REVENUE_RANGES,
  AI_MOTIVATIONS,
  AI_CURRENT_USAGES,
  SALESFORCE_EDITIONS,
  SALESFORCE_CLOUDS,
} from '@/types'

// ─── Field primitives ─────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'

const selectCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'

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

function SectionHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewAssessmentPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [usesSalesforce, setUsesSalesforce] = useState<boolean | null>(null)

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
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">New Assessment</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the client profile to generate and send an assessment invite.
          </p>
        </div>

        {/* ── Error banner ─────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Contact ──────────────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <SectionHeader title="Contact" />
            <div className="px-6 py-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div>
                <Label>First Name</Label>
                <input type="text" name="contact_first_name" className={inputCls} />
              </div>

              <div>
                <Label>Last Name</Label>
                <input type="text" name="contact_last_name" className={inputCls} />
              </div>

              <div>
                <Label>Title</Label>
                <input type="text" name="contact_title" placeholder="e.g. VP of Sales" className={inputCls} />
              </div>

              <div>
                <Label required>Email</Label>
                <input type="email" name="contact_email" required className={inputCls} />
              </div>

              <div>
                <Label>Phone</Label>
                <input type="tel" name="contact_phone" className={inputCls} />
              </div>

              <div>
                <Label>LinkedIn URL</Label>
                <input
                  type="url"
                  name="contact_linkedin"
                  placeholder="https://linkedin.com/in/..."
                  className={inputCls}
                />
              </div>

            </div>
          </section>

          {/* ── Company ──────────────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <SectionHeader title="Company" />
            <div className="px-6 py-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <Label required>Company Name</Label>
                <input type="text" name="company_name" required className={inputCls} />
              </div>

              <div>
                <Label>Industry</Label>
                <select name="company_industry" className={selectCls}>
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Company Size</Label>
                <select name="company_size" className={selectCls}>
                  <option value="">Select size…</option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s} value={s}>{s} employees</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Annual Revenue</Label>
                <select name="company_revenue" className={selectCls}>
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
                  className={inputCls}
                />
              </div>

              <div>
                <Label>Website</Label>
                <input
                  type="url"
                  name="company_website"
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>

            </div>
          </section>

          {/* ── AI Context ───────────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <SectionHeader title="AI Context" />
            <div className="px-6 py-6 space-y-5">

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Primary Motivation</Label>
                  <select name="ai_motivation" className={selectCls}>
                    <option value="">Select motivation…</option>
                    {AI_MOTIVATIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Current AI Usage</Label>
                  <select name="ai_current_usage" className={selectCls}>
                    <option value="">Select usage…</option>
                    {AI_CURRENT_USAGES.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Uses Salesforce toggle */}
              <div>
                <Label>Uses Salesforce?</Label>
                <div className="mt-1 flex gap-6">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="uses_salesforce"
                      value="yes"
                      onChange={() => setUsesSalesforce(true)}
                      className="h-4 w-4 border-gray-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="uses_salesforce"
                      value="no"
                      onChange={() => setUsesSalesforce(false)}
                      className="h-4 w-4 border-gray-300 text-blue-700 focus:ring-blue-600"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Salesforce details — only when yes */}
              {usesSalesforce === true && (
                <div className="ml-2 space-y-5 border-l-2 border-blue-100 pl-5">

                  <div className="max-w-xs">
                    <Label>Salesforce Edition</Label>
                    <select name="salesforce_edition" className={selectCls}>
                      <option value="">Select edition…</option>
                      {SALESFORCE_EDITIONS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Active Clouds</Label>
                    <div className="mt-1 flex flex-wrap gap-x-6 gap-y-3">
                      {SALESFORCE_CLOUDS.map((cloud) => (
                        <label key={cloud.value} className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            name="salesforce_clouds"
                            value={cloud.value}
                            className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                          />
                          <span className="text-sm text-gray-700">{cloud.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </section>

          {/* ── AE Info ──────────────────────────────────────────────────── */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <SectionHeader title="AE Info" subtitle="(internal only)" />
            <div className="px-6 py-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div>
                <Label required>AE Name</Label>
                <input type="text" name="ae_name" required className={inputCls} />
              </div>

              <div>
                <Label required>AE Email</Label>
                <input type="email" name="ae_email" required className={inputCls} />
              </div>

              <div>
                <Label>AE Region</Label>
                <input
                  type="text"
                  name="ae_region"
                  placeholder="e.g. West, Northeast, EMEA"
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Internal Notes</Label>
                <textarea
                  name="ae_notes"
                  rows={3}
                  placeholder="Context for the sales team, deal stage, areas of interest…"
                  className={`${inputCls} resize-none`}
                />
              </div>

            </div>
          </section>

          {/* ── Actions ──────────────────────────────────────────────────── */}
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
