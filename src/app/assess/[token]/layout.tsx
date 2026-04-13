import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import Logo from '@/components/Logo'

export const metadata: Metadata = {
  title: 'AI Readiness Assessment',
  description: 'Complete your AI Readiness Assessment — powered by IMG',
}

export default function AssessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-slate-700 bg-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
          <Logo variant="dark" size="sm" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>

      <Footer />
    </div>
  )
}
