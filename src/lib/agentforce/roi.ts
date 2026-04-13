/**
 * ROI Proof Points Reference
 * Source: Agentforce Assessment Specification v1.0, Section 3
 *
 * Each proof point is tagged with the use cases it supports so the report
 * generator can surface only the 2–3 most relevant metrics per client.
 */

import type { UseCaseTag } from './capabilities'

export interface ROIProofPoint {
  company: string
  metric: string
  result: string
  tags: UseCaseTag[]
}

export const ROI_PROOF_POINTS: ROIProofPoint[] = [
  // ── Service & Support ──────────────────────────────────────────────────────
  { company: 'Wiley',           metric: 'Self-service efficiency',      result: '+40% increase',                    tags: ['Service Agent'] },
  { company: 'Wiley',           metric: 'ROI from Service Cloud + Agentforce', result: '213% ROI',                  tags: ['Service Agent'] },
  { company: 'Reddit',          metric: 'Case deflection',              result: '46% deflected',                    tags: ['Service Agent'] },
  { company: 'Reddit',          metric: 'Resolution time reduction',    result: '84% faster (8.9 min → 1.4 min)',   tags: ['Service Agent'] },
  { company: '1-800-Accountant',metric: 'Chat resolution (tax week)',   result: '70% autonomous',                   tags: ['Service Agent'] },
  { company: 'Engie',           metric: 'User assistance rate',         result: '83% assisted by Agentforce',       tags: ['Service Agent'] },
  { company: 'Fisher & Paykel', metric: 'Self-service rate increase',   result: '40% → 70% (+30 pts)',              tags: ['Service Agent'] },
  { company: 'Nexo',            metric: 'Case resolution rate',         result: '62% resolved by agent',            tags: ['Service Agent'] },
  { company: 'Engine',          metric: 'Handle time reduction',        result: '15% lower',                        tags: ['Service Agent'] },
  { company: 'Safari365',       metric: 'Efficiency improvement',       result: '>30% (exceeded 15% goal)',         tags: ['Service Agent'] },
  { company: 'Grupo Globo',     metric: 'Subscriber retention',         result: '+22% increase',                    tags: ['Service Agent'] },

  // ── Sales & Pipeline ───────────────────────────────────────────────────────
  { company: 'Salesforce (internal)', metric: 'Pipeline from dormant leads', result: '$1.7M new pipeline',          tags: ['SDR Agent'] },
  { company: 'Salesforce (internal)', metric: 'Leads worked by SDR Agent',    result: '43,000+ leads',              tags: ['SDR Agent'] },
  { company: 'Mid-market SaaS',       metric: 'Lead response time',           result: '4 hours → 45 seconds',       tags: ['SDR Agent', 'Web Lead Gen'] },
  { company: 'Mid-market SaaS',       metric: 'MQL-to-SQL conversion',        result: '+12 pts (22% → 34%)',        tags: ['SDR Agent'] },
  { company: 'Consulting firm',       metric: 'New business pipeline',        result: '+44% increase',              tags: ['SDR Agent', 'Sales Coach'] },
  { company: 'Jacuzzi',               metric: 'Lead intake automation',       result: 'Manual → automated routing', tags: ['Web Lead Gen'] },
  { company: 'Adecco',                metric: 'After-hours candidate conversations', result: '51% handled outside business hours', tags: ['SDR Agent'] },

  // ── Employee Productivity ──────────────────────────────────────────────────
  { company: 'Salesforce (internal)', metric: 'Hours saved via Slack agents', result: '500,000 hours/year',         tags: ['Employee Support'] },
  { company: 'Salesforce (internal)', metric: 'Support requests handled',     result: '1.5M+ requests',             tags: ['Service Agent', 'Employee Support'] },
  { company: 'Accenture',             metric: 'Meeting summarization, task alignment', result: 'Reduced repetitive work', tags: ['Employee Support'] },
  { company: 'College Possible',      metric: 'Student capacity per coach',   result: '4x more students served',    tags: ['Employee Support', 'Sales Coach'] },
]

/**
 * Pick the top N most relevant proof points for a set of recommended use cases.
 * Sorted by: (1) how many of the client's recommended use cases each proof
 * point covers, (2) first appearance in the spec.
 */
export function selectROIProofPoints(
  recommendedTags: UseCaseTag[],
  limit = 3,
): ROIProofPoint[] {
  if (recommendedTags.length === 0) return []
  const tagSet = new Set<UseCaseTag>(recommendedTags)

  const scored = ROI_PROOF_POINTS.map((p, idx) => {
    const hits = p.tags.filter((t) => tagSet.has(t)).length
    return { proof: p, hits, idx }
  })
    .filter((s) => s.hits > 0)
    .sort((a, b) => (b.hits - a.hits) || (a.idx - b.idx))

  return scored.slice(0, limit).map((s) => s.proof)
}
