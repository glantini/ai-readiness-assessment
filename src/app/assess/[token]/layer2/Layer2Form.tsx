'use client'

import { useState, useTransition } from 'react'
import {
  layer2BySection,
  LAYER2_SECTION_LABELS,
  type YesNoValue,
} from '@/lib/questions/layer2'
import type { Layer2Section } from '@/types'
import { saveLayer2Section, saveLayer2AndFinish } from './actions'

// ─── Yes / No / Partial options ───────────────────────────────────────────────

const YESNO_OPTIONS: {
  value: YesNoValue
  label: string
  selectedClass: string
}[] = [
  {
    value: 'yes',
    label: 'Yes',
    selectedClass: 'border-green-500 bg-green-50 text-green-700',
  },
  {
    value: 'partial',
    label: 'In Progress / Partial',
    selectedClass: 'border-amber-400 bg-amber-50 text-amber-700',
  },
  {
    value: 'no',
    label: 'No',
    selectedClass: 'border-red-400 bg-red-50 text-red-600',
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  token: string
  /** Ordered list of sections the respondent needs to complete */
  activeSections: Layer2Section[]
  /** Index into activeSections to resume at (0-based) */
  initialStep: number
  /** Pre-populated answers from a previous session: questionId → YesNoValue */
  initialAnswers: Record<string, YesNoValue>
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Layer2Form({
  token,
  activeSections,
  initialStep,
  initialAnswers,
}: Props) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [answers, setAnswers] = useState<Record<string, YesNoValue>>(initialAnswers)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const section = activeSections[currentStep]
  const questions = layer2BySection[section]
  const isLastStep = currentStep === activeSections.length - 1
  const progressPct = Math.round((currentStep / activeSections.length) * 100)

  // Collect only this section's answered questions for saving
  const sectionAnswers: Record<string, YesNoValue> = {}
  for (const q of questions) {
    if (answers[q.id] !== undefined) sectionAnswers[q.id] = answers[q.id]
  }

  const allAnswered = questions.every((q) => answers[q.id] !== undefined)

  function handleAnswer(questionId: string, value: YesNoValue) {
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
    const hasCurrentAnswers = Object.keys(sectionAnswers).length > 0
    if (hasCurrentAnswers) {
      startTransition(async () => {
        await saveLayer2Section(token, sectionAnswers)
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
        const result = await saveLayer2AndFinish(token, sectionAnswers)
        if (result?.error) setError(result.error)
        // On success, server action calls redirect() — no client-side handling needed
      } else {
        const result = await saveLayer2Section(token, sectionAnswers)
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
              Step {currentStep + 1} of {activeSections.length}
            </p>
            <h1 className="mt-0.5 text-xl font-semibold text-gray-900">
              {LAYER2_SECTION_LABELS[section]}
            </h1>
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

        {/* Section pills — clickable */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-0.5">
          {activeSections.map((sec, i) => (
            <button
              key={sec}
              type="button"
              onClick={() => jumpTo(i)}
              disabled={isPending}
              className={[
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                i < currentStep
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : i === currentStep
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                'disabled:cursor-not-allowed disabled:opacity-70',
              ].join(' ')}
            >
              {LAYER2_SECTION_LABELS[sec]}
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
                <legend className="sr-only">Response for: {q.text}</legend>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {YESNO_OPTIONS.map((opt) => {
                    const isSelected = selected === opt.value
                    return (
                      <label
                        key={opt.value}
                        className={[
                          'flex cursor-pointer items-center justify-center rounded-lg border px-2 py-3 text-center text-sm font-medium transition-colors',
                          isSelected
                            ? opt.selectedClass
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.value}
                          checked={isSelected}
                          onChange={() => handleAnswer(q.id, opt.value)}
                          className="sr-only"
                        />
                        {/* Abbreviated label on small screens */}
                        <span className="sm:hidden">
                          {opt.value === 'partial' ? 'Partial' : opt.label}
                        </span>
                        <span className="hidden sm:inline">{opt.label}</span>
                      </label>
                    )
                  })}
                </div>
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
            className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? 'Saving…'
              : isLastStep
                ? 'Submit Assessment →'
                : 'Next →'}
          </button>
        </div>
      </div>

    </div>
  )
}
