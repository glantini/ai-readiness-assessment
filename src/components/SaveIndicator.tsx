'use client'

import { useEffect, useState } from 'react'

interface Props {
  savedAt: number | null
}

export default function SaveIndicator({ savedAt }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (savedAt == null) return
    setVisible(true)
    const t = window.setTimeout(() => setVisible(false), 2000)
    return () => window.clearTimeout(t)
  }, [savedAt])

  return (
    <div
      aria-live="polite"
      className={[
        'pointer-events-none fixed bottom-4 right-4 z-50 flex items-center gap-2',
        'rounded-full border border-green-200 bg-white px-3.5 py-1.5 text-xs font-medium text-green-700 shadow-md',
        'transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      ].join(' ')}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.704 5.294a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.29-7.292a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      Progress saved
    </div>
  )
}
