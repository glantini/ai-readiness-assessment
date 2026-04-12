'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveReport } from '@/app/actions/generateReport'
import { extractPartialSummary } from '@/lib/reportGeneration'
import type {
  Assessment,
  Layer1Scores,
  Layer2Scores,
  ProductScore,
  ReportNarrative,
  AgentforceNarrative,
  ReportStatus,
  QuickWin,
  CategoryNarrative,
} from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'generating' | 'view'

interface Props {
  assessmentId: string
  assessment: Assessment
  initialNarrative: ReportNarrative | null
  initialAgentforceNarrative: AgentforceNarrative | null
  initialStatus: ReportStatus | null
  l1Scores: Layer1Scores | null
  l2Scores: Layer2Scores | null
  productScores: ProductScore[] | null
}

// ─── Category display config ──────────────────────────────────────────────────

const CATEGORY_ORDER = [
  'AIStrategy',
  'PeopleAndCulture',
  'DataFoundation',
  'ProcessReadiness',
  'RiskAndGovernance',
  'AIAgentGovernance',
] as const

const CATEGORY_LABELS: Record<string, string> = {
  AIStrategy: 'AI Strategy',
  PeopleAndCulture: 'People & Culture',
  DataFoundation: 'Data Foundation',
  ProcessReadiness: 'Process Readiness',
  RiskAndGovernance: 'Risk & Governance',
  AIAgentGovernance: 'AI Agent Governance',
}

const CLOUD_LABELS: Record<string, string> = {
  SalesCloud: 'Sales Cloud',
  ServiceCloud: 'Service Cloud',
  MarketingCloud: 'Marketing Cloud',
}

// ─── Quick Wins 2×2 grid config ───────────────────────────────────────────────

type EffortLevel = 'Low' | 'Medium' | 'High'
type ImpactLevel = 'Low' | 'Medium' | 'High'

interface Quadrant {
  label: string
  subtitle: string
  effort: EffortLevel[]
  impact: ImpactLevel[]
  border: string
  bg: string
  badge: string
}

const QUADRANTS: Quadrant[] = [
  {
    label: 'Quick Wins',
    subtitle: 'Low Effort · High Impact',
    effort: ['Low'],
    impact: ['High'],
    border: 'border-green-200',
    bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-800',
  },
  {
    label: 'Strategic Bets',
    subtitle: 'High Effort · High Impact',
    effort: ['Medium', 'High'],
    impact: ['High'],
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
  },
  {
    label: 'Fill-Ins',
    subtitle: 'Low Effort · Low-Medium Impact',
    effort: ['Low'],
    impact: ['Medium', 'Low'],
    border: 'border-gray-200',
    bg: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-700',
  },
  {
    label: 'Deprioritize',
    subtitle: 'High Effort · Low-Medium Impact',
    effort: ['Medium', 'High'],
    impact: ['Medium', 'Low'],
    border: 'border-red-100',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700',
  },
]

// ─── Inline editable text component ──────────────────────────────────────────

function EditableBlock({
  value,
  onChange,
  multiline = false,
  className = '',
  placeholder = 'Click to edit…',
}: {
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  className?: string
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const baseClass =
    'group relative rounded transition-all ' +
    'hover:ring-2 hover:ring-blue-200 hover:ring-offset-1 ' +
    className

  if (!editing) {
    return (
      <div
        className={baseClass + ' cursor-text'}
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        <span className="whitespace-pre-wrap">{value || placeholder}</span>
        <svg
          className="absolute right-1 top-1 h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>
    )
  }

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.Ref<HTMLTextAreaElement>}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        rows={5}
        className={
          'w-full rounded border-2 border-blue-400 bg-white p-2 text-sm ' +
          'focus:outline-none focus:ring-2 focus:ring-blue-300 ' +
          className
        }
      />
    )
  }

  return (
    <input
      ref={inputRef as React.Ref<HTMLInputElement>}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => setEditing(false)}
      className={
        'w-full rounded border-2 border-blue-400 bg-white px-2 py-1 text-sm ' +
        'focus:outline-none focus:ring-2 focus:ring-blue-300 ' +
        className
      }
    />
  )
}

// ─── Tier badge helpers ───────────────────────────────────────────────────────

function tierBadge(tier: string) {
  const map: Record<string, string> = {
    Leading: 'bg-green-100 text-green-800',
    Scaling: 'bg-yellow-100 text-yellow-800',
    Building: 'bg-orange-100 text-orange-800',
    Exploring: 'bg-red-100 text-red-800',
    'Ready to Deploy': 'bg-green-100 text-green-800',
    'Nearly Ready': 'bg-yellow-100 text-yellow-800',
    'Getting Ready': 'bg-orange-100 text-orange-800',
    'Not Ready': 'bg-red-100 text-red-800',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tier] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {tier}
    </span>
  )
}

// ─── Score bar helper ─────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 4.1
      ? 'bg-green-500'
      : score >= 3.1
        ? 'bg-yellow-500'
        : score >= 2.1
          ? 'bg-orange-500'
          : 'bg-red-500'
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${(score / 5) * 100}%` }}
      />
    </div>
  )
}

// ─── Section card (category findings) ────────────────────────────────────────

function CategoryCard({
  label,
  score,
  narrative,
  onChange,
}: {
  label: string
  score: number | undefined
  narrative: CategoryNarrative
  onChange: (updated: CategoryNarrative) => void
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <div className="flex items-center gap-2">
          {score != null && (
            <>
              <span className="text-sm font-medium text-gray-700">
                {score.toFixed(1)}/5
              </span>
              <ScoreBar score={score} />
            </>
          )}
        </div>
      </div>

      <div className="mb-3">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Finding</p>
        <EditableBlock
          value={narrative.summary}
          onChange={(v) => onChange({ ...narrative, summary: v })}
          multiline
          className="text-sm text-gray-700"
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Recommendations</p>
        <ol className="space-y-1.5">
          {narrative.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                {i + 1}
              </span>
              <EditableBlock
                value={rec}
                onChange={(v) => {
                  const recs = [...narrative.recommendations] as [string, string]
                  recs[i] = v
                  onChange({ ...narrative, recommendations: recs })
                }}
                className="flex-1 text-sm text-gray-700"
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function ReportClient({
  assessmentId,
  assessment,
  initialNarrative,
  initialAgentforceNarrative,
  initialStatus,
  l1Scores,
  l2Scores,
  productScores,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Phase: start streaming if no narrative yet; else go straight to view
  const [phase, setPhase] = useState<Phase>(
    initialNarrative ? 'view' : 'generating',
  )

  // Streaming state
  const [streamText, setStreamText] = useState('')
  const [streamError, setStreamError] = useState<string | null>(null)
  const streamRef = useRef(false) // prevent double-fire in StrictMode

  // Editable narrative state (populated once generated or from DB)
  const [narrative, setNarrative] = useState<ReportNarrative | null>(
    initialNarrative,
  )
  const [agentforceNarrative, setAgentforceNarrative] =
    useState<AgentforceNarrative | null>(initialAgentforceNarrative)
  const [reportStatus, setReportStatus] = useState<ReportStatus | null>(
    initialStatus,
  )

  // Approve result
  const [approveResult, setApproveResult] = useState<{
    ok: boolean
    msg: string
  } | null>(null)

  // ── Auto-trigger streaming on mount if no narrative ────────────────────────
  useEffect(() => {
    if (phase !== 'generating' || streamRef.current) return
    streamRef.current = true

    const controller = new AbortController()

    ;(async () => {
      try {
        const res = await fetch(`/api/reports/${assessmentId}/generate`, {
          method: 'POST',
          signal: controller.signal,
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setStreamError(body.error ?? `HTTP ${res.status}`)
          return
        }

        if (!res.body) {
          setStreamError('No response body received')
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'text') {
                setStreamText((prev) => prev + event.content)
              } else if (event.type === 'error') {
                setStreamError(event.message)
                return
              } else if (event.type === 'done') {
                // Refresh server component to pick up new DB data
                startTransition(() => router.refresh())
                return
              }
            } catch {
              // Ignore malformed SSE lines
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setStreamError(String(err))
        }
      }
    })()

    return () => controller.abort()
  }, [assessmentId, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // When router.refresh() completes and we get new props, transition to view
  useEffect(() => {
    if (initialNarrative && phase === 'generating') {
      setNarrative(initialNarrative)
      setAgentforceNarrative(initialAgentforceNarrative)
      setPhase('view')
    }
  }, [initialNarrative, initialAgentforceNarrative, phase])

  // ── Approve handler ────────────────────────────────────────────────────────
  async function handleApprove() {
    if (!narrative) return
    setApproveResult(null)

    const result = await approveReport(
      assessmentId,
      narrative,
      agentforceNarrative,
    )

    if (result.success) {
      setReportStatus('approved')
      setApproveResult({ ok: true, msg: 'Report approved and saved.' })
    } else {
      setApproveResult({ ok: false, msg: result.error ?? 'Unknown error' })
    }
  }

  // ── Helpers for nested state updates ──────────────────────────────────────
  function updateCategory(
    key: string,
    updated: CategoryNarrative,
  ) {
    if (!narrative) return
    setNarrative({
      ...narrative,
      categories: {
        ...narrative.categories,
        [key]: updated,
      } as ReportNarrative['categories'],
    })
  }

  function updateQuickWin(index: number, updated: QuickWin) {
    if (!narrative) return
    const wins = [...narrative.quickWins]
    wins[index] = updated
    setNarrative({ ...narrative, quickWins: wins })
  }

  // ── Rendering phase: GENERATING ────────────────────────────────────────────
  if (phase === 'generating') {
    const partialSummary = extractPartialSummary(streamText)

    return (
      <div className="space-y-6">
        {/* Status bar */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center gap-3">
            {!streamError ? (
              <svg
                className="h-5 w-5 animate-spin text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {streamError ? 'Generation failed' : 'Generating AI analysis…'}
              </p>
              {streamError && (
                <p className="mt-0.5 text-sm text-red-600">{streamError}</p>
              )}
              {!streamError && streamText.length === 0 && (
                <p className="mt-0.5 text-xs text-blue-600">Connecting to Claude…</p>
              )}
            </div>
          </div>
        </div>

        {/* Live executive summary preview */}
        {partialSummary && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Executive Summary (generating…)
            </p>
            <p className="text-sm leading-relaxed text-gray-700">
              {partialSummary}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-gray-400" />
            </p>
          </div>
        )}

        {/* Retry button on error */}
        {streamError && (
          <button
            onClick={() => {
              setStreamText('')
              setStreamError(null)
              streamRef.current = false
              setPhase('generating')
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Retry Generation
          </button>
        )}
      </div>
    )
  }

  // ── Rendering phase: VIEW ──────────────────────────────────────────────────
  if (!narrative) return null

  const isSalesforce = !!assessment.uses_salesforce
  const activeClouds = assessment.salesforce_clouds ?? []
  const productClouds = activeClouds.filter((c) => c !== 'DataCloud')

  return (
    <div className="space-y-8">

      {/* ── Top action bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          {reportStatus === 'approved' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Approved
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              Draft
            </span>
          )}
          <p className="text-sm text-gray-500">
            Click any text block to edit inline before approving.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reportStatus === 'approved' && (
            <a
              href={`/api/reports/${assessmentId}/pdf`}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" />
              </svg>
              Download Report
            </a>
          )}
          <button
            onClick={() => {
              setStreamText('')
              setStreamError(null)
              streamRef.current = false
              setNarrative(null)
              setAgentforceNarrative(null)
              setPhase('generating')
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Regenerate
          </button>
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="rounded-lg bg-blue-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {isPending ? 'Saving…' : 'Approve Report'}
          </button>
        </div>
      </div>

      {approveResult && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${
            approveResult.ok
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {approveResult.msg}
        </div>
      )}

      {/* ── Executive Summary ──────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Executive Summary
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <EditableBlock
            value={narrative.executiveSummary}
            onChange={(v) => setNarrative({ ...narrative, executiveSummary: v })}
            multiline
            className="text-base leading-relaxed text-gray-800"
          />
        </div>
      </section>

      {/* ── Critical Gap ───────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Critical Gap
        </h2>
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <EditableBlock
              value={narrative.criticalGap.area}
              onChange={(v) =>
                setNarrative({
                  ...narrative,
                  criticalGap: { ...narrative.criticalGap, area: v },
                })
              }
              className="text-base font-bold text-red-900"
            />
          </div>
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">Finding</p>
            <EditableBlock
              value={narrative.criticalGap.finding}
              onChange={(v) =>
                setNarrative({
                  ...narrative,
                  criticalGap: { ...narrative.criticalGap, finding: v },
                })
              }
              multiline
              className="text-sm text-red-800"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">Recommended Action</p>
            <EditableBlock
              value={narrative.criticalGap.recommendation}
              onChange={(v) =>
                setNarrative({
                  ...narrative,
                  criticalGap: { ...narrative.criticalGap, recommendation: v },
                })
              }
              multiline
              className="text-sm font-medium text-red-900"
            />
          </div>
        </div>
      </section>

      {/* ── Quick Wins 2×2 grid ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Quick Wins
        </h2>
        <div className="mb-2 grid grid-cols-2 gap-1 text-center">
          <p className="text-xs font-medium text-gray-400 col-span-1">↑ HIGH IMPACT</p>
          <p className="col-span-1" />
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-3">
          {QUADRANTS.map((q) => {
            const items = narrative.quickWins.filter(
              (w) =>
                (q.effort as string[]).includes(w.effort) &&
                (q.impact as string[]).includes(w.impact),
            )
            return (
              <div
                key={q.label}
                className={`rounded-xl border-2 p-4 ${q.border} ${q.bg}`}
              >
                <p className="mb-1 text-xs font-bold text-gray-600">{q.label}</p>
                <p className="mb-3 text-xs text-gray-400">{q.subtitle}</p>
                {items.length === 0 ? (
                  <p className="text-xs italic text-gray-300">No items</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((win, idx) => {
                      const globalIdx = narrative.quickWins.indexOf(win)
                      return (
                        <li
                          key={idx}
                          className="rounded-lg border border-white bg-white/70 p-3 shadow-sm"
                        >
                          <EditableBlock
                            value={win.action}
                            onChange={(v) =>
                              updateQuickWin(globalIdx, { ...win, action: v })
                            }
                            className="mb-1.5 text-sm font-medium text-gray-800"
                          />
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${q.badge}`}>
                              {win.effort} effort
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              {win.impact} impact
                            </span>
                            <EditableBlock
                              value={win.timeline}
                              onChange={(v) =>
                                updateQuickWin(globalIdx, { ...win, timeline: v })
                              }
                              className="text-xs text-gray-500"
                            />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-1 grid grid-cols-2 gap-1 text-center">
          <p className="text-xs font-medium text-gray-400">← LOW EFFORT</p>
          <p className="text-xs font-medium text-gray-400">HIGH EFFORT →</p>
        </div>
      </section>

      {/* ── Category Findings ───────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Category Findings
        </h2>
        <div className="space-y-4">
          {CATEGORY_ORDER.map((key) => {
            const catNarrative = narrative.categories[key]
            if (!catNarrative) return null
            const l1Cat = l1Scores?.categories.find(
              (c) => c.category === CATEGORY_LABELS[key],
            )
            return (
              <CategoryCard
                key={key}
                label={CATEGORY_LABELS[key] ?? key}
                score={l1Cat?.raw}
                narrative={catNarrative}
                onChange={(updated) => updateCategory(key, updated)}
              />
            )
          })}
        </div>
      </section>

      {/* ── Agentforce Section (Salesforce users only) ──────────────────── */}
      {isSalesforce && agentforceNarrative && (
        <>
          {/* Section divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Agentforce Readiness
              </span>
            </div>
          </div>

          {/* Agentforce Executive Summary */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Agentforce Executive Summary
            </h2>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {l2Scores && (
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-lg font-bold text-gray-900">
                      {l2Scores.overall.toFixed(1)}
                    </span>
                  </div>
                  {tierBadge(l2Scores.tier)}
                  <span className="text-xs text-gray-400">Agentforce Readiness Index</span>
                </div>
              )}
              <EditableBlock
                value={agentforceNarrative.agentforceExecutiveSummary}
                onChange={(v) =>
                  setAgentforceNarrative({
                    ...agentforceNarrative,
                    agentforceExecutiveSummary: v,
                  })
                }
                multiline
                className="text-sm leading-relaxed text-gray-800"
              />
            </div>
          </section>

          {/* Edition flag callout */}
          {agentforceNarrative.editionFlag && (
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="mb-1 text-sm font-semibold text-amber-900">
                  Edition Limitation — {assessment.salesforce_edition}
                </p>
                <EditableBlock
                  value={agentforceNarrative.editionFlag}
                  onChange={(v) =>
                    setAgentforceNarrative({
                      ...agentforceNarrative,
                      editionFlag: v,
                    })
                  }
                  multiline
                  className="text-sm text-amber-800"
                />
              </div>
            </div>
          )}

          {/* Data Cloud flag */}
          {agentforceNarrative.dataCloudFlag && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <p className="text-sm font-semibold text-blue-900">
                  Data Cloud: {agentforceNarrative.dataCloudFlag.required ? 'Required' : 'Optional'}
                </p>
              </div>
              <p className="text-sm text-blue-800">
                {agentforceNarrative.dataCloudFlag.reason}
              </p>
              <p className="mt-1 text-xs font-medium text-blue-600">
                Recommended phase: {agentforceNarrative.dataCloudFlag.phase}
              </p>
            </div>
          )}

          {/* Per-product agent recommendations */}
          {productClouds.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Agent Recommendations
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productClouds.map((cloud) => {
                  const rec = agentforceNarrative.agentRecommendations?.[cloud]
                  const ps = (productScores ?? []).find((p) => p.cloud === cloud)
                  if (!rec) return null
                  return (
                    <div
                      key={cloud}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            {CLOUD_LABELS[cloud] ?? cloud}
                          </p>
                          <EditableBlock
                            value={rec.agentName}
                            onChange={(v) =>
                              setAgentforceNarrative({
                                ...agentforceNarrative,
                                agentRecommendations: {
                                  ...agentforceNarrative.agentRecommendations,
                                  [cloud]: { ...rec, agentName: v },
                                },
                              })
                            }
                            className="mt-0.5 text-sm font-semibold text-gray-900"
                          />
                        </div>
                        {ps && tierBadge(ps.tier)}
                      </div>

                      <div className="space-y-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium text-gray-500">Timeline: </span>
                          <EditableBlock
                            value={rec.timeline}
                            onChange={(v) =>
                              setAgentforceNarrative({
                                ...agentforceNarrative,
                                agentRecommendations: {
                                  ...agentforceNarrative.agentRecommendations,
                                  [cloud]: { ...rec, timeline: v },
                                },
                              })
                            }
                            className="inline text-xs text-gray-700"
                          />
                        </div>

                        <div>
                          <p className="mb-1 font-medium text-gray-500">Prerequisites:</p>
                          <ul className="space-y-1">
                            {rec.conditions.map((cond, i) => (
                              <li key={i} className="flex gap-1.5">
                                <span className="text-gray-400">·</span>
                                <EditableBlock
                                  value={cond}
                                  onChange={(v) => {
                                    const conds = [...rec.conditions] as [string, string]
                                    conds[i] = v
                                    setAgentforceNarrative({
                                      ...agentforceNarrative,
                                      agentRecommendations: {
                                        ...agentforceNarrative.agentRecommendations,
                                        [cloud]: { ...rec, conditions: conds },
                                      },
                                    })
                                  }}
                                  className="flex-1 text-xs text-gray-700"
                                />
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="mb-0.5 font-medium text-gray-500">Expected outcome:</p>
                          <EditableBlock
                            value={rec.expectedOutcome}
                            onChange={(v) =>
                              setAgentforceNarrative({
                                ...agentforceNarrative,
                                agentRecommendations: {
                                  ...agentforceNarrative.agentRecommendations,
                                  [cloud]: { ...rec, expectedOutcome: v },
                                },
                              })
                            }
                            multiline
                            className="text-xs text-gray-700"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Implementation Roadmap */}
          {agentforceNarrative.implementationRoadmap && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Implementation Roadmap
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    {
                      key: 'phase1',
                      num: 1,
                      data: agentforceNarrative.implementationRoadmap.phase1,
                      color: 'border-blue-200 bg-blue-50',
                      numColor: 'bg-blue-600',
                    },
                    {
                      key: 'phase2',
                      num: 2,
                      data: agentforceNarrative.implementationRoadmap.phase2,
                      color: 'border-green-200 bg-green-50',
                      numColor: 'bg-green-600',
                    },
                    {
                      key: 'phase3',
                      num: 3,
                      data: agentforceNarrative.implementationRoadmap.phase3,
                      color: 'border-purple-200 bg-purple-50',
                      numColor: 'bg-purple-600',
                    },
                  ] as const
                ).map(({ key, num, data, color, numColor }) => (
                  <div
                    key={key}
                    className={`rounded-xl border-2 p-5 ${color}`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${numColor}`}
                      >
                        {num}
                      </span>
                      <div className="flex-1">
                        <EditableBlock
                          value={data.title}
                          onChange={(v) =>
                            setAgentforceNarrative({
                              ...agentforceNarrative,
                              implementationRoadmap: {
                                ...agentforceNarrative.implementationRoadmap,
                                [key]: { ...data, title: v },
                              },
                            })
                          }
                          className="text-sm font-bold text-gray-900"
                        />
                        <p className="text-xs text-gray-500">{data.duration}</p>
                      </div>
                    </div>

                    {key === 'phase1' && 'actions' in data && (
                      <ul className="space-y-1">
                        {(data.actions as [string, string, string]).map(
                          (action, i) => (
                            <li key={i} className="flex gap-1.5 text-xs text-gray-700">
                              <span className="mt-0.5 text-blue-400">›</span>
                              <EditableBlock
                                value={action}
                                onChange={(v) => {
                                  const acts = [...data.actions] as [string, string, string]
                                  acts[i] = v
                                  setAgentforceNarrative({
                                    ...agentforceNarrative,
                                    implementationRoadmap: {
                                      ...agentforceNarrative.implementationRoadmap,
                                      phase1: { ...data, actions: acts },
                                    },
                                  })
                                }}
                                className="flex-1 text-xs text-gray-700"
                              />
                            </li>
                          ),
                        )}
                      </ul>
                    )}

                    {key === 'phase2' && 'agent' in data && (
                      <div className="space-y-1.5 text-xs text-gray-700">
                        <EditableBlock
                          value={data.agent}
                          onChange={(v) =>
                            setAgentforceNarrative({
                              ...agentforceNarrative,
                              implementationRoadmap: {
                                ...agentforceNarrative.implementationRoadmap,
                                phase2: { ...data, agent: v },
                              },
                            })
                          }
                          multiline
                          className="text-xs text-gray-700"
                        />
                        <p className="font-medium text-gray-500">Outcome:</p>
                        <EditableBlock
                          value={data.outcome}
                          onChange={(v) =>
                            setAgentforceNarrative({
                              ...agentforceNarrative,
                              implementationRoadmap: {
                                ...agentforceNarrative.implementationRoadmap,
                                phase2: { ...data, outcome: v },
                              },
                            })
                          }
                          multiline
                          className="text-xs text-gray-700"
                        />
                      </div>
                    )}

                    {key === 'phase3' && 'expansion' in data && (
                      <EditableBlock
                        value={data.expansion}
                        onChange={(v) =>
                          setAgentforceNarrative({
                            ...agentforceNarrative,
                            implementationRoadmap: {
                              ...agentforceNarrative.implementationRoadmap,
                              phase3: { ...data, expansion: v },
                            },
                          })
                        }
                        multiline
                        className="text-xs text-gray-700"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Bottom approve bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm text-gray-500">
          {reportStatus === 'approved'
            ? 'This report has been approved.'
            : 'Review all edits, then approve to finalize.'}
        </p>
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Approve Report'}
        </button>
      </div>

    </div>
  )
}
