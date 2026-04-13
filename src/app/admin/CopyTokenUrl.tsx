'use client'

import { useState } from 'react'

export function CopyTokenUrl({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)

  const siteUrl = typeof window !== 'undefined'
    ? window.location.origin
    : ''
  const url = `${siteUrl}/assess/${token}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <code className="max-w-[140px] truncate rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
        /assess/{token.slice(0, 8)}…
      </code>
      <button
        onClick={handleCopy}
        title="Copy assessment URL"
        className="inline-flex items-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        {copied ? (
          <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}
