'use client'

import { useEffect, useState } from 'react'

export function CopyLinkButton({
  token,
  label = 'Copy assessment link',
}: {
  token: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/assess/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // ignore
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        title={label}
        aria-label={label}
        className="inline-flex items-center rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
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
      {copied && (
        <div
          role="status"
          className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          Copied!
        </div>
      )}
    </>
  )
}
