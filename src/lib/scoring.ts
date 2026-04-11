import type {
  Layer1Scores,
  Layer2Scores,
  CategoryScore,
  SectionScore,
  ProductScore,
  ReadinessTier,
  AgentforceTier,
  EditionGateResult,
  SalesforceCloud,
  SalesforceEdition,
  Layer2Section,
} from '@/types'

import {
  layer1Questions,
  LAYER1_CATEGORY_WEIGHTS,
  LAYER1_CATEGORIES,
  type Layer1Category,
} from './questions/layer1'

import {
  layer2Questions,
  YESNO_SCORES,
  type YesNoValue,
} from './questions/layer2'

// ─── Tier thresholds ──────────────────────────────────────────────────────────

const LAYER1_TIERS: { min: number; tier: ReadinessTier }[] = [
  { min: 80, tier: 'AI-Ready' },
  { min: 60, tier: 'AI-Capable' },
  { min: 40, tier: 'AI-Building' },
  { min: 0, tier: 'AI-Emerging' },
]

const LAYER2_TIERS: { min: number; tier: AgentforceTier }[] = [
  { min: 80, tier: 'Agentforce-Ready' },
  { min: 60, tier: 'Agentforce-Capable' },
  { min: 40, tier: 'Agentforce-Building' },
  { min: 0, tier: 'Agentforce-Emerging' },
]

// Salesforce editions that fully support Agentforce
const SUPPORTED_EDITIONS: SalesforceEdition[] = [
  'Enterprise',
  'Unlimited',
  'Unlimited+',
  'Einstein 1',
  'Developer',
]

// Editions with limited/conditional support (requires add-ons)
const LIMITED_EDITIONS: SalesforceEdition[] = ['Professional']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToTier<T>(
  score: number,
  tiers: { min: number; tier: T }[]
): T {
  for (const { min, tier } of tiers) {
    if (score >= min) return tier
  }
  return tiers[tiers.length - 1].tier
}

/**
 * Clamp a number to [0, 100] and round to 1 decimal place.
 */
function pct(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10
}

// ─── Edition Gate ─────────────────────────────────────────────────────────────

/**
 * Determine whether a Salesforce edition is compatible with Agentforce.
 *
 * - 'supported'  : Enterprise, Unlimited, Unlimited+, Einstein 1, Developer
 * - 'limited'    : Professional (requires Agentforce add-on license)
 * - 'unsupported': Essentials, Starter, Group, or unknown
 */
export function editionGate(
  edition: SalesforceEdition | null | undefined
): EditionGateResult {
  if (!edition) return 'unsupported'
  if (SUPPORTED_EDITIONS.includes(edition)) return 'supported'
  if (LIMITED_EDITIONS.includes(edition)) return 'limited'
  return 'unsupported'
}

// ─── Layer 1 Scoring ──────────────────────────────────────────────────────────

/**
 * Calculate Layer 1 (general AI readiness) scores from a map of
 * question_id → scale value (1–5).
 *
 * Algorithm:
 *   categoryRaw  = (sum of responses in category) / (count × 5) × 100
 *   overallScore = Σ (categoryRaw × categoryWeight)
 */
export function calculateLayer1Scores(
  responses: Record<string, number>
): Layer1Scores {
  const categories: CategoryScore[] = LAYER1_CATEGORIES.map((category) => {
    const questions = layer1Questions.filter((q) => q.category === category)
    const answered = questions.filter((q) => responses[q.id] != null)
    const sum = answered.reduce((acc, q) => acc + (responses[q.id] ?? 0), 0)
    const maxScore = answered.length * 5

    const raw = maxScore > 0 ? pct((sum / maxScore) * 100) : 0
    const weight = LAYER1_CATEGORY_WEIGHTS[category as Layer1Category]
    const weighted = pct(raw * weight)

    return { category, raw, weighted, weight }
  })

  const overall = pct(categories.reduce((acc, c) => acc + c.weighted, 0))
  const tier = scoreToTier(overall, LAYER1_TIERS)

  return { categories, overall, tier }
}

// ─── Layer 2 Scoring ──────────────────────────────────────────────────────────

/**
 * Calculate Layer 2 (Agentforce readiness) scores from a map of
 * question_id → YesNoValue ('yes' | 'partial' | 'no'), given which Salesforce
 * clouds the respondent has active.
 *
 * Algorithm:
 *   sectionRaw   = (sum of YESNO_SCORES for answered questions) / (count × 2) × 100
 *
 *   For the overall score, only applicable sections are included.
 *   Cloud weights are split equally across the number of active product clouds
 *   (SalesCloud / ServiceCloud / MarketingCloud that are applicable).
 *
 *   overallScore = (coreRaw × 0.35) + (dataRaw × 0.15) + Σ(cloudRaw × cloudShare)
 *   where cloudShare = 0.50 / numberOfActiveProductClouds
 */
export function calculateLayer2Scores(
  responses: Record<string, YesNoValue>,
  activeClouds: SalesforceCloud[]
): Layer2Scores {
  const PRODUCT_CLOUD_SECTIONS: Layer2Section[] = [
    'SalesCloud',
    'ServiceCloud',
    'MarketingCloud',
  ]

  const applicableProductClouds = PRODUCT_CLOUD_SECTIONS.filter((s) => {
    const cloudKey = s as SalesforceCloud
    return activeClouds.includes(cloudKey)
  })

  const sections: SectionScore[] = (
    ['CorePrereqs', 'DataCloud', ...applicableProductClouds] as Layer2Section[]
  ).map((section) => {
    const questions = layer2Questions.filter((q) => q.section === section)
    const answered = questions.filter((q) => responses[q.id] != null)
    const sum = answered.reduce(
      (acc, q) => acc + (YESNO_SCORES[responses[q.id]] ?? 0),
      0
    )
    const maxScore = answered.length * YESNO_SCORES.yes

    const raw = maxScore > 0 ? pct((sum / maxScore) * 100) : 0

    return { section, raw, applicable: true }
  })

  // Build section lookup for weighted overall calculation
  const sectionMap = new Map(sections.map((s) => [s.section, s.raw]))

  const coreRaw = sectionMap.get('CorePrereqs') ?? 0
  const dataRaw = sectionMap.get('DataCloud') ?? 0
  const cloudShare =
    applicableProductClouds.length > 0
      ? 0.5 / applicableProductClouds.length
      : 0

  const cloudContribution = applicableProductClouds.reduce((acc, section) => {
    return acc + (sectionMap.get(section) ?? 0) * cloudShare
  }, 0)

  // If no product clouds, redistribute their 50% weight to CorePrereqs + DataCloud
  let overall: number
  if (applicableProductClouds.length === 0) {
    overall = pct(coreRaw * 0.65 + dataRaw * 0.35)
  } else {
    overall = pct(coreRaw * 0.35 + dataRaw * 0.15 + cloudContribution)
  }

  const tier = scoreToTier(overall, LAYER2_TIERS)

  const productScores = calculateProductScores(
    responses,
    activeClouds,
    sectionMap
  )

  return { sections, productScores, overall, tier }
}

// ─── Product Scores ───────────────────────────────────────────────────────────

/**
 * Derive per-product Agentforce readiness scores.
 *
 * Each product score blends:
 *   CorePrereqs (50%) + DataCloud (20%) + ProductCloud (30%)
 *
 * An 'Overall' score is also included (equal to the weighted overall from
 * calculateLayer2Scores — pass it in via sectionMap for consistency).
 */
export function calculateProductScores(
  _responses: Record<string, YesNoValue>,
  activeClouds: SalesforceCloud[],
  sectionMap: Map<Layer2Section | string, number>
): ProductScore[] {
  const coreRaw = sectionMap.get('CorePrereqs') ?? 0
  const dataRaw = sectionMap.get('DataCloud') ?? 0

  const productClouds: { cloud: SalesforceCloud; section: Layer2Section }[] = [
    { cloud: 'SalesCloud', section: 'SalesCloud' },
    { cloud: 'ServiceCloud', section: 'ServiceCloud' },
    { cloud: 'MarketingCloud', section: 'MarketingCloud' },
  ]

  const cloudScores: ProductScore[] = productClouds
    .filter(({ cloud }) => activeClouds.includes(cloud))
    .map(({ cloud, section }) => {
      const cloudRaw = sectionMap.get(section) ?? 0
      const score = pct(coreRaw * 0.5 + dataRaw * 0.2 + cloudRaw * 0.3)
      const tier = scoreToTier(score, LAYER2_TIERS)
      return { cloud, score, tier }
    })

  // Overall Agentforce score — foundation only (CorePrereqs + DataCloud)
  // when no product clouds are active
  const overallScore =
    cloudScores.length > 0
      ? pct(
          cloudScores.reduce((acc, c) => acc + c.score, 0) / cloudScores.length
        )
      : pct(coreRaw * 0.65 + dataRaw * 0.35)

  const overallTier = scoreToTier(overallScore, LAYER2_TIERS)

  return [
    ...cloudScores,
    { cloud: 'Overall', score: overallScore, tier: overallTier },
  ]
}

// ─── Convenience: score an entire assessment ─────────────────────────────────

export interface AssessmentScoreInput {
  layer1Responses: Record<string, number>
  layer2Responses: Record<string, YesNoValue>
  activeClouds: SalesforceCloud[]
  salesforceEdition?: SalesforceEdition | null
}

export interface AssessmentScoreOutput {
  layer1: Layer1Scores
  layer2: Layer2Scores | null   // null if respondent is not a Salesforce user
  editionGateResult: EditionGateResult | null
  overallTier: ReadinessTier
}

/**
 * Score a complete assessment in one call.
 * Pass usesSalesforce=false to skip Layer 2.
 */
export function scoreAssessment(
  input: AssessmentScoreInput,
  usesSalesforce: boolean
): AssessmentScoreOutput {
  const layer1 = calculateLayer1Scores(input.layer1Responses)

  const layer2 = usesSalesforce
    ? calculateLayer2Scores(input.layer2Responses, input.activeClouds)
    : null

  const editionGateResult = usesSalesforce
    ? editionGate(input.salesforceEdition)
    : null

  return {
    layer1,
    layer2,
    editionGateResult,
    overallTier: layer1.tier,
  }
}
