'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recalculateScores } from '@/app/actions/recalculate'

interface Props {
  assessmentId: string
  usesSalesforce: boolean
}

export function RecalculateButton({ assessmentId, usesSalesforce }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    success: boolean
    error?: string
  } | null>(null)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await recalculateScores(assessmentId, usesSalesforce)
      setResult(res)
      if (res.success) router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {result?.success && (
        <p className="text-sm font-medium text-green-700">
          Scores calculated successfully. Refreshing…
        </p>
      )}

      {result?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          <p className="font-semibold">Scoring failed</p>
          <p className="mt-0.5 font-mono">{result.error}</p>
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
