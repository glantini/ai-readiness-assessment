export default function AutoSaveBanner() {
  return (
    <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-900">
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      <p>
        Your progress is automatically saved. You can close this page and return
        anytime using the same link.
      </p>
    </div>
  )
}
