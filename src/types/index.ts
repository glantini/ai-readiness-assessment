// ─── Question Types ────────────────────────────────────────────────────────────

export type InputType = 'checkbox' | 'scale' | 'yesno'

export type SalesforceCloud =
  | 'SalesCloud'
  | 'ServiceCloud'
  | 'MarketingCloud'
  | 'CommerceCloud'
  | 'DataCloud'
  | 'ExperienceCloud'
  | 'FieldService'
  | 'RevenueCloud'

export type Layer2Section =
  | 'CorePrereqs'
  | 'DataCloud'
  | 'SalesCloud'
  | 'ServiceCloud'
  | 'MarketingCloud'

export interface Question {
  id: string
  text: string
  inputType: InputType
  /** Snapshot has no category/section */
  category?: string
  /** Layer 2 section (and optional cloud gate) */
  section?: Layer2Section
  /** If set, this question is only shown when the client selected this cloud */
  requiredCloud?: SalesforceCloud
  weight?: number
  /** For scale inputs: labels for min and max ends */
  scaleMin?: string
  scaleMax?: string
}

// ─── Assessment / Profile ─────────────────────────────────────────────────────

export type AssessmentStatus = 'pending' | 'in_progress' | 'completed'

export type SalesforceEdition =
  | 'Starter'
  | 'Pro'
  | 'Enterprise'
  | 'Unlimited'
  | 'None'

export interface Assessment {
  id: string
  token: string
  status: AssessmentStatus

  // Contact
  contact_first_name: string | null
  contact_last_name: string | null
  contact_title: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_linkedin: string | null

  // Company
  company_name: string | null
  company_industry: string | null
  company_size: string | null
  company_revenue: string | null
  company_headquarters: string | null
  company_website: string | null

  // AI context
  ai_motivation: string | null
  ai_current_usage: string | null
  uses_salesforce: boolean | null
  salesforce_edition: SalesforceEdition | null
  salesforce_clouds: SalesforceCloud[] | null

  // Optional link to a referral partner (Salesforce AE)
  referral_partner_id: string | null

  created_at: string
  updated_at: string
}

// ─── Referral Partner ────────────────────────────────────────────────────────

export type SfTeamRegion = 'SMB' | 'Mid-Market' | 'Enterprise' | 'Strategic'

export interface ReferralPartner {
  id: string
  name: string
  email: string
  company: string | null
  city: string | null
  sf_team_region: SfTeamRegion | null
  notes: string | null
  created_at: string
  updated_at: string
}

export const SF_TEAM_REGIONS: SfTeamRegion[] = ['SMB', 'Mid-Market', 'Enterprise', 'Strategic']

// ─── Responses ────────────────────────────────────────────────────────────────

export type ResponseLayer = 'snapshot' | 'layer1' | 'layer2'

export interface Response {
  id: string
  assessment_id: string
  question_id: string
  layer: ResponseLayer
  /** boolean for checkbox, 1–5 number for scale, 'yes'|'partial'|'no' for yesno */
  value: boolean | number | string
  created_at: string
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export type ReadinessTier =
  | 'Leading'
  | 'Scaling'
  | 'Building'
  | 'Exploring'

export type AgentforceTier =
  | 'Ready to Deploy'
  | 'Nearly Ready'
  | 'Getting Ready'
  | 'Not Ready'

export type EditionGateResult = 'supported' | 'limited' | 'unsupported'

export interface CategoryScore {
  category: string
  raw: number       // 1–5 average
  weighted: number  // raw × weight (contribution to overall)
  weight: number
}

export interface Layer1Scores {
  categories: CategoryScore[]
  overall: number  // 1–5 weighted average
  tier: ReadinessTier
}

export interface SectionScore {
  section: Layer2Section
  raw: number       // 1–5 average (yes→5, partial→3, no→1)
  applicable: boolean
}

export interface ProductScore {
  cloud: SalesforceCloud | 'Overall'
  score: number  // 1–5
  tier: AgentforceTier
}

export interface Layer2Scores {
  sections: SectionScore[]
  productScores: ProductScore[]
  overall: number  // 1–5 weighted average (Agentforce Readiness Index)
  tier: AgentforceTier
  /** true when edition is Essentials or Professional (index capped at 2.5) */
  edition_flag: boolean
}

/** Columns confirmed in Supabase reports table */
export interface Report {
  id: string
  assessment_id: string
  layer1_scores: Layer1Scores | null
  layer2_scores: Layer2Scores | null
  product_scores: ProductScore[] | null
  overall_tier: ReadinessTier | null
  generated_at: string
  pdf_url: string | null
}

/** Columns added by migration 001 (run supabase/migrations/001_add_narrative_columns.sql) */
export interface ReportNarrativeRow {
  ai_narrative_json: ReportNarrative | null
  agentforce_narrative_json: AgentforceNarrative | null
  report_status: ReportStatus | null
}

// ─── Report Narrative Types ───────────────────────────────────────────────────

export interface QuickWin {
  action: string
  effort: 'Low' | 'Medium' | 'High'
  impact: 'Low' | 'Medium' | 'High'
  timeline: string
}

/**
 * Rich recommendation object with action, how-to, and why-it-matters.
 * New reports generated after the rich-recommendation update use this format.
 */
export interface RichRecommendation {
  action: string
  howTo: string
  whyItMatters: string
}

/**
 * Category narrative for report output.
 * recommendations may be a legacy [string, string] tuple (existing reports)
 * or a [RichRecommendation, RichRecommendation] tuple (new reports).
 */
export interface CategoryNarrative {
  context?: string
  summary: string
  recommendations: [string, string] | [RichRecommendation, RichRecommendation]
}

export interface ReportNarrative {
  executiveSummary: string
  criticalGap: {
    area: string
    finding: string
    recommendation: string
    impactIfUnaddressed?: string
    immediateNextStep?: string
  }
  quickWins: QuickWin[]
  categories: {
    AIStrategy: CategoryNarrative
    PeopleAndCulture: CategoryNarrative
    DataFoundation: CategoryNarrative
    ProcessReadiness: CategoryNarrative
    AIPolicies: CategoryNarrative
    AgentControls: CategoryNarrative
  }
}

export interface AgentRecommendation {
  agentName: string
  readinessTier: string
  timeline: string
  conditions: [string, string]
  expectedOutcome: string
}

export interface AgentforceNarrative {
  agentforceExecutiveSummary: string
  editionFlag: string | null
  dataCloudFlag: {
    required: boolean
    reason: string
    phase: string
  }
  agentRecommendations: Record<string, AgentRecommendation>
  implementationRoadmap: {
    phase1: { title: string; duration: string; actions: [string, string, string] }
    phase2: { title: string; duration: string; agent: string; outcome: string }
    phase3: { title: string; duration: string; expansion: string }
  }
}

export type ReportStatus = 'draft' | 'approved'

// ─── Profile dropdowns (for form rendering) ──────────────────────────────────

export const INDUSTRIES = [
  'Aerospace & Defense',
  'Agriculture',
  'Automotive',
  'Banking & Financial Services',
  'Biotechnology',
  'Construction',
  'Consulting',
  'Consumer Goods',
  'Education',
  'Energy & Utilities',
  'Entertainment & Media',
  'Government',
  'Healthcare',
  'Hospitality & Travel',
  'Insurance',
  'Legal',
  'Life Sciences',
  'Logistics & Supply Chain',
  'Manufacturing',
  'Non-Profit',
  'Real Estate',
  'Retail',
  'Technology',
  'Telecommunications',
  'Other',
] as const

export const COMPANY_SIZES = [
  '1–10',
  '11–50',
  '51–200',
  '201–500',
  '501–1,000',
  '1,001–5,000',
  '5,001–10,000',
  '10,000+',
] as const

export const REVENUE_RANGES = [
  'Under $1M',
  '$1M–$5M',
  '$5M–$25M',
  '$25M–$100M',
  '$100M–$500M',
  '$500M–$1B',
  '$1B+',
] as const

export const AI_MOTIVATIONS = [
  'Reduce operational costs',
  'Improve customer experience',
  'Increase sales productivity',
  'Automate repetitive processes',
  'Enhance data-driven decisions',
  'Stay competitive in the market',
  'Support agent / employee productivity',
  'Other',
] as const

export const AI_CURRENT_USAGES = [
  'No AI tools in use',
  'Exploring AI tools (research phase)',
  'Piloting 1–2 AI tools',
  'Using AI tools in production (limited scope)',
  'AI is embedded in multiple workflows',
  'AI-first organization',
] as const

export const SALESFORCE_EDITIONS: SalesforceEdition[] = [
  'Starter',
  'Pro',
  'Enterprise',
  'Unlimited',
  'None',
]

export const SALESFORCE_CLOUDS: { value: SalesforceCloud; label: string }[] = [
  { value: 'SalesCloud',      label: 'Sales Cloud' },
  { value: 'ServiceCloud',    label: 'Service Cloud' },
  { value: 'MarketingCloud',  label: 'Marketing Cloud' },
  { value: 'CommerceCloud',   label: 'Commerce Cloud' },
  { value: 'DataCloud',       label: 'Data Cloud' },
  { value: 'ExperienceCloud', label: 'Experience Cloud' },
  { value: 'FieldService',    label: 'Field Service' },
  { value: 'RevenueCloud',    label: 'Revenue Cloud' },
]
