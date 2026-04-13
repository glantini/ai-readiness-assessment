import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center sm:px-6 lg:px-8">
        <Logo variant="light" size="sm" iconOnly />
        <p className="text-xs font-medium text-slate-500">AI Readiness Engine</p>
        <p className="text-xs text-slate-400">
          &copy; 2026 Integrated Media Group. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
