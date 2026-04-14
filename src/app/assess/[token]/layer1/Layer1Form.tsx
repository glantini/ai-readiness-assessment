'use client'

import { useState, useTransition } from 'react'
import {
  layer1ByCategory,
  LAYER1_CATEGORIES,
  type Layer1Category,
} from '@/lib/questions/layer1'
import { saveLayer1Category, saveLayer1AndFinish } from './actions'
import AutoSaveBanner from '@/components/AutoSaveBanner'
import SaveIndicator from '@/components/SaveIndicator'
import LastSavedLabel from '@/components/LastSavedLabel'

// ─── Scale options ────────────────────────────────────────────────────────────

const SCALE_OPTIONS = [
  { value: 1, label: 'Not started' },
  { value: 2, label: 'Just beginning' },
  { value: 3, label: 'Inconsistent' },
  { value: 4, label: 'Mostly yes' },
  { value: 5, label: 'Fully' },
] as const

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  token: string
  /** Index into LAYER1_CATEGORIES to resume at (0-based) */
  initialStep: number
  /** Pre-populated answers from a previous session: questionId → 1-5 */
  initialAnswers: Record<string, number>
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Layer1Form({ token, initialStep, initialAnswers }: Props) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const category = LAYER1_CATEGORIES[currentStep] as Layer1Category
  const questions = layer1ByCategory[category]
  const isLastStep = currentStep === LAYER1_CATEGORIES.length - 1
  const progressPct = Math.round((currentStep / LAYER1_CATEGORIES.length) * 100)

  // Collect only this category's answered questions for saving
  const categoryAnswers: Record<string, number> = {}
  for (const q of questions) {
    if (answers[q.id] !== undefined) categoryAnswers[q.id] = answers[q.id]
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined)

  function handleAnswer(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function handlePrev() {
    setCurrentStep((s) => s - 1)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function jumpTo(target: number) {
    if (target === currentStep || isPending) return
    setError(null)
    // Persist any in-progress answers for the current category before jumping
    const hasCurrentAnswers = Object.keys(categoryAnswers).length > 0
    if (hasCurrentAnswers) {
      startTransition(async () => {
        const result = await saveLayer1Category(token, categoryAnswers)
        if (!result?.error) setSavedAt(Date.now())
        setCurrentStep(target)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    } else {
      setCurrentStep(target)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleNext() {
    setError(null)
    startTransition(async () => {
      if (isLastStep) {
        const result = await saveLayer1AndFinish(token, categoryAnswers)
        if (result?.error) setError(result.error)
        // On success, server action calls redirect() — no client-side handling needed
      } else {
        const result = await saveLayer1Category(token, categoryAnswers)
        if (result?.error) {
          setError(result.error)
        } else {
          setSavedAt(Date.now())
          setCurrentStep((s) => s + 1)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      <AutoSaveBanner />
      <SaveIndicator savedAt={savedAt} />

      {/* ── Progress header ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="mb-3 flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Step {currentStep + 1} of {LAYER1_CATEGORIES.length}
            </p>
            <h1 className="mt-0.5 text-lg font-semibold text-gray-900 sm:text-xl">{category}</h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-xs text-gray-400 sm:text-sm">{progressPct}% complete</span>
            <LastSavedLabel savedAt={savedAt} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Category pills — clickable */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-0.5">
          {LAYER1_CATEGORIES.map((cat, i) => (
            <button
              key={cat}
              type="button"
              onClick={() => jumpTo(i)}
              disabled={isPending}
              className={[
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                i < currentStep
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : i === currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                'disabled:cursor-not-allowed disabled:opacity-70',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Questions ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {questions.map((q, qi) => {
          const selected = answers[q.id]
          return (
            <div
              key={q.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
                <p className="text-sm font-medium leading-relaxed text-gray-900">
                  <span className="mr-1.5 text-gray-400">{qi + 1}.</span>
                  {q.text}
                </p>
              </div>

              <fieldset className="border-t border-gray-100 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
                <legend className="sr-only">
                  Rating scale for: {q.text}
                </legend>

                {/* Scale: min/max labels */}
                <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                  <span>{q.scaleMin}</span>
                  <span>{q.scaleMax}</span>
                </div>

                {/* 5 option cards */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                  {SCALE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={[
                        'flex cursor-pointer flex-col items-center justify-start gap-1 rounded-lg border px-1 py-2 text-center transition-colors active:bg-blue-100',
                        selected === opt.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={selected === opt.value}
                        onChange={() => handleAnswer(q.id, opt.value)}
                        className="sr-only"
                      />
                      <span
                        className={[
                          'text-base font-bold leading-none',
                          selected === opt.value ? 'text-blue-700' : 'text-gray-500',
                        ].join(' ')}
                      >
                        {opt.value}
                      </span>
                      <span className="hidden whitespace-nowrap text-xs leading-tight text-gray-500 sm:block">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Mobile: show selected label below */}
                {selected !== undefined && (
                  <p className="mt-2 text-center text-xs text-blue-700 sm:hidden">
                    {SCALE_OPTIONS.find((o) => o.value === selected)?.label}
                  </p>
                )}
              </fieldset>
            </div>
          )
        })}
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 pt-5">
        {!allAnswered && (
          <p className="mb-2 text-center text-xs text-gray-400 sm:text-right">
            Answer all {questions.length} questions to continue
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0 || isPending}
            className="flex-1 min-h-[44px] rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:py-2.5"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!allAnswered || isPending}
            className="flex-1 min-h-[44px] rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:ml-auto sm:py-2.5"
          >
            {isPending
              ? 'Saving…'
              : isLastStep
                ? 'Finish Assessment →'
                : 'Next →'}
          </button>
        </div>
      </div>

    </div>
  )
}
