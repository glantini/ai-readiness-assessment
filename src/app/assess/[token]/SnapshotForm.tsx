'use client'

import { useState, useTransition } from 'react'
import { saveSnapshot } from './actions'
import type { Question } from '@/types'

interface Props {
  token: string
  questions: Question[]
  initialChecks: Record<string, boolean>
  timeEstimate: string
}

export default function SnapshotForm({ token, questions, initialChecks, timeEstimate }: Props) {
  const [checks, setChecks] = useState<Record<string, boolean>>(initialChecks)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle(id: string) {
    setChecks((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await saveSnapshot(token, checks)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Checkbox list */}
      <div className="space-y-3">
        {questions.map((q) => (
          <label
            key={q.id}
            className={[
              'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
              checks[q.id]
                ? 'border-blue-200 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50',
            ].join(' ')}
          >
            <input
              type="checkbox"
              checked={checks[q.id] ?? false}
              onChange={() => toggle(q.id)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
            />
            <span className="text-sm leading-relaxed text-gray-700">{q.text}</span>
          </label>
        ))}
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Estimated time + progress bar */}
      <div className="mt-8 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Estimated time:{' '}
            <span className="font-medium text-gray-900">{timeEstimate}</span>
          </span>
          <span className="text-gray-400">0% complete</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-0 rounded-full bg-blue-600" />
        </div>
      </div>

      {/* Continue */}
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </form>
  )
}
