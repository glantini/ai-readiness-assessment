'use client'

import { useState } from 'react'
import { recalculateScores } from '@/app/actions/recalculate'

interface Props {
  assessmentId: string
  usesSalesforce: boolean
}

export function RecalculateButton({ assessmentId, usesSalesforce }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setIsPending(true)
    try {
      const res = await recalculateScores(assessmentId, usesSalesforce)
      if (res.success) {
        window.location.reload()
      } else {
        setError(res.error ?? 'Unknown error')
        setIsPending(false)
      }
    } catch (err) {
      setError(String(err))
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          <p className="font-semibold">Scoring failed</p>
          <p className="mt-0.5 font-mono">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-60"
      >
        {isPending ? 'Calculating…' : 'Recalculate Scores'}
      </button>
    </div>
  )
}
