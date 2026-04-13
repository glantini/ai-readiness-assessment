/**
 * Agentforce Recommendation Selection Algorithm
 * Source: Agentforce Assessment Specification v1.0, Sections 1 & 5.1
 *
 * Priority order (applied in this sequence, de-duplicated, capped at 5):
 *   1. Data Cloud (always, if client uses Salesforce but lacks Data Cloud)
 *   2. Score-based triggers on lowest Layer 1 category scores
 *   3. Snapshot-driven triggers (proxy for question-based triggers)
 *   4. Cloud-specific defaults based on the client's active clouds
 */

import type {
  Layer1Scores,
  SalesforceCloud,
  CategoryScore,
} from '@/types'
import type { UseCaseTag } from './capabilities'

export interface RecommendationContext {
  usesSalesforce: boolean
  activeClouds: SalesforceCloud[]
  layer1: Layer1Scores | null
  /** snapshot question_id → boolean */
  snapshot: Record<string, boolean>
  /** true when edition gate triggered (Starter / Pro) */
  editionGated?: boolean
}

/**
 * Return up to `limit` recommended Agentforce use cases, ordered by priority.
 */
export function selectAgentforceRecommendations(
  ctx: RecommendationContext,
  limit = 5,
): UseCaseTag[] {
  const out: UseCaseTag[] = []
  const push = (tag: UseCaseTag) => {
    if (!out.includes(tag) && out.length < limit) out.push(tag)
  }

  // ── Priority 1: Data Cloud (foundation) ────────────────────────────────────
  if (ctx.usesSalesforce && !ctx.activeClouds.includes('DataCloud')) {
    push('Data Cloud')
  }

  // ── Priority 2: Score-based triggers on Layer 1 categories ─────────────────
  // Spec thresholds (1.1):
  //   Process Readiness  < 3.0 → Pipeline Management Agent (Sales)
  //   Process Readiness  < 2.5 → Service Agent + Case Summarization
  //   Data Foundation    < 3.0 → Data Cloud
  //   People & Culture   < 3.0 → Sales Coach Agent
  //   AI Policies        < 2.5 → Einstein Trust Layer
  //   Agent Controls     < 2.5 → Agentforce Guardrails / Command Center
  //   AI Strategy        < 2.5 → Agent Builder (quick wins)
  if (ctx.layer1) {
    const byCat = new Map(ctx.layer1.categories.map((c) => [c.category, c]))
    const score = (name: string) => byCat.get(name)?.raw ?? null

    const process = score('Process Readiness')
    if (process != null && process < 2.5) {
      push('Service Agent')
      push('Case Summarization')
    } else if (process != null && process < 3.0) {
      push('Pipeline Management')
    }

    const data = score('Data Foundation')
    if (data != null && data < 3.0) push('Data Cloud')

    const people = score('People & Culture')
    if (people != null && people < 3.0) push('Sales Coach')

    const policies = score('AI Policies')
    if (policies != null && policies < 2.5) push('Einstein Trust Layer')

    const controls = score('Agent Controls')
    if (controls != null && controls < 2.5) push('Agent Builder')

    const strategy = score('AI Strategy')
    if (strategy != null && strategy < 2.5) push('Agent Builder')
  }

  // ── Priority 3: Snapshot-driven triggers ───────────────────────────────────
  // Snapshot questions live in src/lib/questions/snapshot.ts — they're proxies
  // for the question-based triggers in spec section 1.2.
  if (ctx.snapshot['snap_01']) {
    // "Significant time on manual data entry / handoffs"
    push('Pipeline Management')
    push('Employee Support')
  }
  if (ctx.snapshot['snap_02']) {
    // "Customer inquiries fall through the cracks"
    push('Service Agent')
    push('SDR Agent')
  }
  if (ctx.snapshot['snap_03']) {
    // "Struggle to get consistent real-time view of pipeline"
    push('Pipeline Management')
  }
  if (ctx.snapshot['snap_04']) {
    // "Best processes live in people's heads"
    push('Sales Coach')
  }
  if (ctx.snapshot['snap_05']) {
    // "Tried AI tools but haven't seen results"
    push('Agent Builder')
  }

  // ── Priority 4: Cloud-specific defaults ────────────────────────────────────
  const clouds = new Set(ctx.activeClouds)
  if (clouds.has('SalesCloud'))      { push('SDR Agent'); push('Pipeline Management') }
  if (clouds.has('ServiceCloud'))    { push('Service Agent'); push('Case Summarization') }
  if (clouds.has('MarketingCloud'))  { push('Campaign Agent'); push('Einstein Personalization') }
  if (clouds.has('CommerceCloud'))   { push('Merchandiser Agent'); push('Personal Shopper') }
  if (clouds.has('FieldService'))    { push('Field Service Agent') }
  if (clouds.has('RevenueCloud'))    { push('Agentforce Quoting') }

  // ── Fallback for non-Salesforce or sparse recommendations ──────────────────
  if (out.length === 0) {
    push('Service Agent')
    push('SDR Agent')
    push('Agent Builder')
  }

  return out.slice(0, limit)
}

/**
 * Format the lowest-scoring Layer 1 category as a short finding string for
 * the executive summary.
 */
export function lowestCategoryFinding(layer1: Layer1Scores | null): string | null {
  if (!layer1 || layer1.categories.length === 0) return null
  const lowest = layer1.categories.reduce<CategoryScore | null>(
    (acc, c) => (acc == null || c.raw < acc.raw ? c : acc),
    null,
  )
  if (!lowest) return null
  return `${lowest.category} scored ${lowest.raw.toFixed(1)}/5`
}
