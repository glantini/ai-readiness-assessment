import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Readiness Assessment',
  description: 'Complete your AI Readiness Assessment — powered by IMG',
}

export default function AssessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal branding header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
              IMG
            </span>
            <span className="text-gray-300" aria-hidden="true">|</span>
            <span className="text-sm text-gray-500">AI Readiness Assessment</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  )
}
