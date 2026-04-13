'use client'

import { useState, useTransition } from 'react'
import {
  layer1ByCategory,
  LAYER1_CATEGORIES,
  type Layer1Category,
} from '@/lib/questions/layer1'
import { saveLayer1Category, saveLayer1AndFinish } from './actions'

// ─── Scale options ────────────────────────────────────────────────────────────

const SCALE_OPTIONS = [
  { value: 1, label: 'No awareness or capability' },
  { value: 2, label: 'Early / ad hoc' },
  { value: 3, label: 'In development / inconsistent' },
  { value: 4, label: 'Mostly in place' },
  { value: 5, label: 'Fully implemented / leading practice' },
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
        await saveLayer1Category(token, categoryAnswers)
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
          setCurrentStep((s) => s + 1)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Progress header ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Step {currentStep + 1} of {LAYER1_CATEGORIES.length}
            </p>
            <h1 className="mt-0.5 text-xl font-semibold text-gray-900">{category}</h1>
          </div>
          <span className="shrink-0 text-sm text-gray-400">{progressPct}% complete</span>
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
              <div className="px-5 pt-5 pb-4">
                <p className="text-sm font-medium leading-relaxed text-gray-900">
                  <span className="mr-1.5 text-gray-400">{qi + 1}.</span>
                  {q.text}
                </p>
              </div>

              <fieldset className="border-t border-gray-100 px-5 pb-5 pt-4">
                <legend className="sr-only">
                  Rating scale for: {q.text}
                </legend>

                {/* Scale: min/max labels */}
                <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                  <span>{q.scaleMin}</span>
                  <span>{q.scaleMax}</span>
                </div>

                {/* 5 option cards */}
                <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                  {SCALE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={[
                        'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-1 py-3 text-center transition-colors',
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
                      <span className="hidden text-xs leading-tight text-gray-500 sm:block">
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
      <div className="flex items-center justify-between border-t border-gray-200 pt-5">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 0 || isPending}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous
        </button>

        <div className="flex flex-col items-end gap-1">
          {!allAnswered && (
            <p className="text-xs text-gray-400">
              Answer all {questions.length} questions to continue
            </p>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!allAnswered || isPending}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
