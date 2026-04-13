import type { AssessmentSection } from '@/types'

/**
 * Describes how far a client has progressed through their assessment, for use
 * in admin/partner assessment lists. Returns null for rows where a progress
 * indicator doesn't apply (not started, or already completed).
 */
export function formatProgress(
  status: string,
  currentSection: AssessmentSection | null | undefined,
  usesSalesforce: boolean | null | undefined,
): string | null {
  if (status !== 'in_progress') return null

  const total = usesSalesforce ? 3 : 2
  const index =
    currentSection === 'layer2'
      ? 3
      : currentSection === 'layer1'
        ? 2
        : 1

  const current = Math.min(index, total)
  return `Section ${current} of ${total}`
}

/**
 * "2m ago" / "3h ago" / "5d ago" — intentionally terse for dense list UIs.
 */
export function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}
