'use client'

import { useEffect, useState } from 'react'

interface Props {
  savedAt: number | null
  className?: string
}

function formatAgo(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  if (hours === 1) return '1 hour ago'
  return `${hours} hours ago`
}

export default function LastSavedLabel({ savedAt, className }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (savedAt == null) return
    const id = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(id)
  }, [savedAt])

  if (savedAt == null) return null

  return (
    <span className={className ?? 'text-xs text-gray-400'}>
      Last saved {formatAgo(now - savedAt)}
    </span>
  )
}
