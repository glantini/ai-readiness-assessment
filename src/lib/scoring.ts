/**
 * Scoring engine for the AI & Agentforce Readiness Assessment.
 *
 * All scores are on a 1–5 scale:
 *   Layer 1: arithmetic mean of 1–5 Likert responses per category, then weighted
 *   Layer 2: yes→5 / partial→3 / no→1 mapped to 1–5, then weighted
 *
 * Async functions (calculateLayer1Scores, calculateLayer2Scores) fetch responses
 * directly from Supabase. Call saveScoresToReport to persist results.
 *
 * Pure computation functions (scoreLayer1, scoreLayer2) are also exported for
 * use in tests or convenience wrappers.
 */

import { createServiceClient } from '@/lib/supabase/server'
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
  type YesNoValue,
} from './questions/layer2'

// ─── Tier thresholds (1–5 scale) ─────────────────────────────────────────────

const LAYER1_TIERS: { min: number; tier: ReadinessTier }[] = [
  { min: 4.1, tier: 'Leading' },
  { min: 3.1, tier: 'Scaling' },
  { min: 2.1, tier: 'Building' },
  { min: 1.0, tier: 'Exploring' },
]

const LAYER2_TIERS: { min: number; tier: AgentforceTier }[] = [
  { min: 4.1, tier: 'Ready to Deploy' },
  { min: 3.1, tier: 'Nearly Ready' },
  { min: 2.1, tier: 'Getting Ready' },
  { min: 1.0, tier: 'Not Ready' },
]

// Editions where Agentforce Readiness Index is capped at 2.5
const EDITION_FLAGGED: SalesforceEdition[] = ['Essentials', 'Professional']

// Editions with full Agentforce support
const SUPPORTED_EDITIONS: SalesforceEdition[] = [
  'Enterprise',
  'Unlimited',
  'Unlimited+',
  'Einstein 1',
  'Developer',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToTier<T>(score: number, tiers: { min: number; tier: T }[]): T {
  for (const { min, tier } of tiers) {
    if (score >= min) return tier
  }
  return tiers[tiers.length - 1].tier
}

export function getLayer1Tier(score: number): ReadinessTier {
  return scoreToTier(score, LAYER1_TIERS)
}

export function getLayer2Tier(score: number): AgentforceTier {
  return scoreToTier(score, LAYER2_TIERS)
}

/** Round to 2 decimal places */
function r2(value: number): number {
  return Math.round(value * 100) / 100
}

// ─── Edition Gate ─────────────────────────────────────────────────────────────

/**
 * Determine whether a Salesforce edition is fully compatible with Agentforce.
 *
 * - 'supported'  : Enterprise, Unlimited, Unlimited+, Einstein 1, Developer
 * - 'limited'    : Professional (requires Agentforce add-on; index capped at 2.5)
 * - 'unsupported': Essentials, Starter, or unknown (index capped at 2.5)
 */
export function editionGate(
  edition: SalesforceEdition | null | undefined,
): EditionGateResult {
  if (!edition) return 'unsupported'
  if (SUPPORTED_EDITIONS.includes(edition)) return 'supported'
  if (edition === 'Professional') return 'limited'
  return 'unsupported'
}

// ─── Pure Layer 1 computation ─────────────────────────────────────────────────

/**
 * Score Layer 1 (general AI readiness) from a map of question_id → scale value (1–5).
 *
 * Algorithm:
 *   category_score = sum(responses) / count          →  1–5 arithmetic mean
 *   overall        = Σ(category_score × weight)      →  1–5 weighted average
 *
 * Weights: AI Strategy 20% | People & Culture 20% | Data Foundation 20%
 *          Process Readiness 20% | Risk & Governance 10% | AI Agent Governance 10%
 *
 * Tiers: 1.0–2.0 Exploring | 2.1–3.0 Building | 3.1–4.0 Scaling | 4.1–5.0 Leading
 */
export function scoreLayer1(responses: Record<string, number>): Layer1Scores {
  const categories: CategoryScore[] = LAYER1_CATEGORIES.map((category) => {
    const questions = layer1Questions.filter((q) => q.category === category)
    const answered = questions.filter((q) => responses[q.id] != null)
    const weight = LAYER1_CATEGORY_WEIGHTS[category as Layer1Category]

    if (answered.length === 0) return { category, raw: 0, weighted: 0, weight }

    const sum = answered.reduce((acc, q) => acc + (responses[q.id] ?? 0), 0)
    const raw = r2(sum / answered.length)
    const weighted = r2(raw * weight)

    return { category, raw, weighted, weight }
  })

  const overall = r2(categories.reduce((acc, c) => acc + c.weighted, 0))
  const tier = scoreToTier(overall, LAYER1_TIERS)

  return { categories, overall, tier }
}

// ─── Pure Layer 2 computation ─────────────────────────────────────────────────

/** Map yes/partial/no onto the 1–5 scale used throughout the scoring engine */
const YESNO_TO_SCALE: Record<YesNoValue, number> = {
  yes: 5,
  partial: 3,
  no: 1,
}

/**
 * Score Layer 2 (Agentforce readiness) from a map of question_id → YesNoValue,
 * given the respondent's active Salesforce clouds and edition.
 *
 * Algorithm:
 *   section_score  = sum(YESNO_TO_SCALE[answer]) / count    →  1–5
 *
 *   Overall (Agentforce Readiness Index):
 *     core×0.30 + data×0.25 + Σ(cloud×(0.45 / n_clouds))
 *   If no product clouds: core×0.55 + data×0.45
 *
 *   Per-product score = avg(core + data + product_section) / 3
 *
 * Edition gate: Essentials or Professional → cap overall and product scores at 2.5,
 *               set edition_flag = true.
 *
 * Tiers: 1.0–2.0 Not Ready | 2.1–3.0 Getting Ready | 3.1–4.0 Nearly Ready | 4.1–5.0 Ready to Deploy
 */
export function scoreLayer2(
  responses: Record<string, YesNoValue>,
  activeClouds: SalesforceCloud[],
  edition: SalesforceEdition | null | undefined,
): Layer2Scores {
  const PRODUCT_CLOUD_SECTIONS: Layer2Section[] = [
    'SalesCloud',
    'ServiceCloud',
    'MarketingCloud',
  ]
  const applicableProductClouds = PRODUCT_CLOUD_SECTIONS.filter((s) =>
    activeClouds.includes(s as SalesforceCloud),
  )

  // Score each applicable section
  const sections: SectionScore[] = (
    ['CorePrereqs', 'DataCloud', ...applicableProductClouds] as Layer2Section[]
  ).map((section) => {
    const questions = layer2Questions.filter((q) => q.section === section)
    const answered = questions.filter((q) => responses[q.id] != null)

    if (answered.length === 0) return { section, raw: 1, applicable: true }

    const sum = answered.reduce(
      (acc, q) => acc + (YESNO_TO_SCALE[responses[q.id]] ?? 1),
      0,
    )
    const raw = r2(sum / answered.length)
    return { section, raw, applicable: true }
  })

  const sectionMap = new Map(sections.map((s) => [s.section, s.raw]))
  const coreScore = sectionMap.get('CorePrereqs') ?? 1
  const dataScore = sectionMap.get('DataCloud') ?? 1

  // Weighted Agentforce Readiness Index
  let overall: number
  if (applicableProductClouds.length === 0) {
    // Redistribute 45% proportionally to core (0.55) + data (0.45)
    overall = r2(coreScore * 0.55 + dataScore * 0.45)
  } else {
    const cloudShare = 0.45 / applicableProductClouds.length
    const cloudContrib = applicableProductClouds.reduce(
      (acc, c) => acc + (sectionMap.get(c) ?? 1) * cloudShare,
      0,
    )
    overall = r2(coreScore * 0.30 + dataScore * 0.25 + cloudContrib)
  }

  // Per-product scores: avg(Section A + Section B + product section)
  const productScores: ProductScore[] = applicableProductClouds.map((cloud) => {
    const cloudScore = sectionMap.get(cloud) ?? 1
    const score = r2((coreScore + dataScore + cloudScore) / 3)
    return {
      cloud: cloud as SalesforceCloud,
      score,
      tier: scoreToTier(score, LAYER2_TIERS),
    }
  })

  // Edition gate: cap at 2.5 for Essentials or Professional
  const edition_flag = edition != null && EDITION_FLAGGED.includes(edition)
  if (edition_flag) {
    if (overall > 2.5) overall = 2.5
    for (const ps of productScores) {
      if (ps.score > 2.5) {
        ps.score = 2.5
        ps.tier = scoreToTier(2.5, LAYER2_TIERS)
      }
    }
  }

  const tier = scoreToTier(overall, LAYER2_TIERS)

  return { sections, productScores, overall, tier, edition_flag }
}

// ─── Async Supabase-fetching functions ────────────────────────────────────────

/**
 * Fetch Layer 1 responses for an assessment from Supabase and return scored results.
 */
export async function calculateLayer1Scores(
  assessmentId: string,
): Promise<Layer1Scores> {
  const supabase = createServiceClient()

  const { data: rows, error } = await supabase
    .from('responses')
    .select('question_id, value')
    .eq('assessment_id', assessmentId)
    .eq('layer', 'layer1')

  if (error) throw new Error(`Failed to fetch Layer 1 responses: ${error.message}`)

  const responses: Record<string, number> = {}
  for (const row of rows ?? []) {
    const v = typeof row.value === 'number' ? row.value : Number(row.value)
    if (!Number.isNaN(v)) responses[row.question_id] = v
  }

  return scoreLayer1(responses)
}

/**
 * Fetch Layer 2 responses and assessment metadata from Supabase, then return
 * scored results including edition gate logic.
 */
export async function calculateLayer2Scores(
  assessmentId: string,
): Promise<Layer2Scores> {
  const supabase = createServiceClient()

  const [{ data: assessment, error: aErr }, { data: rows, error: rErr }] =
    await Promise.all([
      supabase
        .from('assessments')
        .select('salesforce_clouds, salesforce_edition')
        .eq('id', assessmentId)
        .single(),
      supabase
        .from('responses')
        .select('question_id, value')
        .eq('assessment_id', assessmentId)
        .eq('layer', 'layer2'),
    ])

  if (aErr || !assessment)
    throw new Error(`Assessment not found: ${aErr?.message}`)
  if (rErr)
    throw new Error(`Failed to fetch Layer 2 responses: ${rErr.message}`)

  const activeClouds = (assessment.salesforce_clouds ?? []) as SalesforceCloud[]
  const edition = assessment.salesforce_edition as SalesforceEdition | null

  const responses: Record<string, YesNoValue> = {}
  for (const row of rows ?? []) {
    if (
      typeof row.value === 'string' &&
      (row.value === 'yes' || row.value === 'partial' || row.value === 'no')
    ) {
      responses[row.question_id] = row.value as YesNoValue
    }
  }

  return scoreLayer2(responses, activeClouds, edition)
}

// ─── Save to reports ──────────────────────────────────────────────────────────

/**
 * Upsert scored results into the reports table.
 * Pass layer2 = null for non-Salesforce assessments.
 */
export async function saveScoresToReport(
  assessmentId: string,
  layer1: Layer1Scores,
  layer2: Layer2Scores | null,
): Promise<void> {
  const supabase = createServiceClient()

  const { error } = await supabase.from('reports').upsert(
    {
      assessment_id: assessmentId,
      ai_overall_score: layer1.overall,
      ai_category_scores: layer1.categories,
      agentforce_index: layer2?.overall ?? null,
      agentforce_section_scores: layer2?.sections ?? null,
      agentforce_product_scores: layer2?.productScores ?? null,
      edition_flag: layer2?.edition_flag ?? null,
      generated_at: new Date().toISOString(),
    },
    { onConflict: 'assessment_id' },
  )

  if (error) throw new Error(`Failed to save report: ${error.message}`)
}

// ─── Convenience: score a full assessment in one call ────────────────────────

export interface AssessmentScoreInput {
  layer1Responses: Record<string, number>
  layer2Responses: Record<string, YesNoValue>
  activeClouds: SalesforceCloud[]
  salesforceEdition?: SalesforceEdition | null
}

export interface AssessmentScoreOutput {
  layer1: Layer1Scores
  layer2: Layer2Scores | null
  editionGateResult: EditionGateResult | null
  overallTier: ReadinessTier
}

/**
 * Score a complete assessment from in-memory response maps.
 * Pass usesSalesforce = false to skip Layer 2.
 */
export function scoreAssessment(
  input: AssessmentScoreInput,
  usesSalesforce: boolean,
): AssessmentScoreOutput {
  const layer1 = scoreLayer1(input.layer1Responses)
  const layer2 = usesSalesforce
    ? scoreLayer2(
        input.layer2Responses,
        input.activeClouds,
        input.salesforceEdition,
      )
    : null
  const editionGateResult = usesSalesforce
    ? editionGate(input.salesforceEdition)
    : null

  return { layer1, layer2, editionGateResult, overallTier: layer1.tier }
}
