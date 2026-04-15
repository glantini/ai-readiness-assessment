/**
 * ProspectReport: Full React-PDF document for the prospect-facing AI Readiness Report.
 *
 * Pages:
 *   1   Cover (company, respondent, AE, score badges)
 *   2   Understanding AI Today (intro, glossary, why this matters)
 *   3   Executive Summary + Operations Snapshot callout
 *   4   Score Summary, "Your AI Readiness at a Glance" (bar charts, benchmarks, methodology)
 *   5   Critical Gap
 *   6-11 Category Findings (one per page, with sidebars + context + benchmarks)
 *  12   Quick Wins vs Long-Term Investments
 *  13-15 Agentforce section (Salesforce only)
 *  16   Phased Implementation Roadmap (Salesforce only)
 *  17   Next Steps
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type {
  Assessment,
  Layer1Scores,
  Layer2Scores,
  ProductScore,
  ReportNarrative,
  AgentforceNarrative,
  QuickWin,
  RichRecommendation,
  ReferralPartner,
} from '@/types'
import {
  CAPABILITY_BY_ID,
  type UseCaseTag,
} from '@/lib/agentforce/capabilities'
import { selectROIProofPoints } from '@/lib/agentforce/roi'
import { selectAgentforceRecommendations } from '@/lib/agentforce/recommend'
import { parseExecutiveSummary } from '@/lib/reportGeneration'

// ─── Colors ──────────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#1d4ed8',
  primaryDark: '#1e3a8a',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  // Tier badge colors
  exploring: '#DC2626',
  building: '#EA580C',
  scaling: '#CA8A04',
  leading: '#16A34A',
  notReady: '#DC2626',
  gettingReady: '#EA580C',
  nearlyReady: '#CA8A04',
  readyToDeploy: '#16A34A',
  // Quick wins
  greenLight: '#dcfce7',
  greenDark: '#166534',
  blueLight: '#dbeafe',
  blueDark: '#1e40af',
  amberLight: '#fef3c7',
  amberDark: '#92400e',
  redLight: '#fee2e2',
  redDark: '#991b1b',
}

function layer1TierColor(tier: string): string {
  switch (tier) {
    case 'Leading': return COLORS.leading
    case 'Scaling': return COLORS.scaling
    case 'Building': return COLORS.building
    default: return COLORS.exploring
  }
}

function layer2TierColor(tier: string): string {
  switch (tier) {
    case 'Ready to Deploy': return COLORS.readyToDeploy
    case 'Nearly Ready': return COLORS.nearlyReady
    case 'Getting Ready': return COLORS.gettingReady
    default: return COLORS.notReady
  }
}

// Prospect-facing display labels for Agentforce tiers. Internal tier values
// stay unchanged; only PDF rendering uses these opportunity-focused labels.
function layer2TierLabel(tier: string): string {
  switch (tier) {
    case 'Getting Ready': return 'Positioned for Quick Wins'
    case 'Not Ready': return 'Early Opportunity'
    default: return tier
  }
}

function tierFromScore(score: number): string {
  if (score >= 4.1) return 'Leading'
  if (score >= 3.1) return 'Scaling'
  if (score >= 2.1) return 'Building'
  return 'Exploring'
}

// Plain-English descriptions of what each overall readiness tier means for a
// CEO's business, rendered next to the tier label wherever it appears.
const TIER_DESCRIPTIONS: Record<string, string> = {
  Exploring:
    'Exploring means AI is still a conversation inside your business, not a working capability. You have not yet committed the people, data, or funding needed to move.',
  Building:
    'Building means you have some of the pieces in place but the organization is not yet ready to run AI end to end. Early wins are possible, scale is not.',
  Scaling:
    'Scaling means the foundation is in place and early AI use is delivering real value. The next move is expanding what works across more of the business.',
  Leading:
    'Leading means AI is embedded in how your business runs. You are capturing measurable returns and setting the pace for peers in your industry.',
  'Not Ready':
    'Early Opportunity means you have not yet tuned Salesforce for Agentforce agents. Foundation work is handled alongside your first agent, so you can still start soon.',
  'Getting Ready':
    'Positioned for Quick Wins means you are close enough to start capturing value from Agentforce agents in the next 60 to 90 days, with tuning happening in parallel.',
  'Nearly Ready':
    'Nearly Ready means your Salesforce environment is well set up for Agentforce. Agents can go live quickly and start returning measurable results.',
  'Ready to Deploy':
    'Ready to Deploy means your Salesforce environment is a strong match for Agentforce today. You can launch agents with minimal preparation and start capturing value fast.',
}

function tierDescription(tier: string): string | null {
  return TIER_DESCRIPTIONS[tier] ?? null
}

// Fallback plain-English summary for a category when the narrative predates
// the plainSummary field. Gives the reader a CEO-friendly read of the score.
function fallbackPlainSummary(category: string, score: number): string {
  const tier = tierFromScore(score)
  if (category === 'Data Foundation') {
    switch (tier) {
      case 'Leading':
        return 'Your customer data is unified and reliable across systems, so AI can answer questions and take action without the team hunting for information.'
      case 'Scaling':
        return 'Your customer data is mostly unified, and AI can use it for real work with some targeted cleanup as agents go live.'
      case 'Building':
        return 'Your customer data is partially unified, so AI will deliver inconsistent results until your systems tell the same story about each customer.'
      default:
        return 'Your customer data is scattered across systems, which means AI cannot yet be trusted to answer customer questions or take action on its own.'
    }
  }
  switch (tier) {
    case 'Leading':
      return `You are running ${category} the way leaders in your industry do, which means AI has room to compound on strengths already in place.`
    case 'Scaling':
      return `${category} is working well enough for AI to produce real results, with targeted improvements while agents are deployed.`
    case 'Building':
      return `${category} has enough in place for a first AI use case, but not enough to scale AI across the business without reinforcement.`
    default:
      return `${category} is still early, which means AI would struggle to produce reliable business results until this area catches up.`
  }
}

// ─── Industry Benchmarks ────────────────────────────────────────────────────

const INDUSTRY_BENCHMARKS: Record<string, Record<string, number>> = {
  'Professional Services': { 'AI Strategy': 2.6, 'People & Culture': 2.9, 'Data Foundation': 2.8, 'Process Readiness': 2.7, 'AI Policies': 2.5, 'Agent Controls': 2.3 },
  'Consulting': { 'AI Strategy': 2.6, 'People & Culture': 2.9, 'Data Foundation': 2.8, 'Process Readiness': 2.7, 'AI Policies': 2.5, 'Agent Controls': 2.3 },
  'Legal': { 'AI Strategy': 2.6, 'People & Culture': 2.9, 'Data Foundation': 2.8, 'Process Readiness': 2.7, 'AI Policies': 2.5, 'Agent Controls': 2.3 },
  'Healthcare': { 'AI Strategy': 2.4, 'People & Culture': 2.7, 'Data Foundation': 2.8, 'Process Readiness': 2.5, 'AI Policies': 2.9, 'Agent Controls': 2.2 },
  'Life Sciences': { 'AI Strategy': 2.4, 'People & Culture': 2.7, 'Data Foundation': 2.8, 'Process Readiness': 2.5, 'AI Policies': 2.9, 'Agent Controls': 2.2 },
  'Biotechnology': { 'AI Strategy': 2.4, 'People & Culture': 2.7, 'Data Foundation': 2.8, 'Process Readiness': 2.5, 'AI Policies': 2.9, 'Agent Controls': 2.2 },
  'Banking & Financial Services': { 'AI Strategy': 3.2, 'People & Culture': 3.0, 'Data Foundation': 3.3, 'Process Readiness': 3.1, 'AI Policies': 3.4, 'Agent Controls': 2.8 },
  'Insurance': { 'AI Strategy': 3.2, 'People & Culture': 3.0, 'Data Foundation': 3.3, 'Process Readiness': 3.1, 'AI Policies': 3.4, 'Agent Controls': 2.8 },
  'Manufacturing': { 'AI Strategy': 2.3, 'People & Culture': 2.4, 'Data Foundation': 2.5, 'Process Readiness': 2.7, 'AI Policies': 2.3, 'Agent Controls': 2.1 },
  'Technology': { 'AI Strategy': 3.5, 'People & Culture': 3.4, 'Data Foundation': 3.5, 'Process Readiness': 3.3, 'AI Policies': 3.2, 'Agent Controls': 3.0 },
  'Telecommunications': { 'AI Strategy': 3.5, 'People & Culture': 3.4, 'Data Foundation': 3.5, 'Process Readiness': 3.3, 'AI Policies': 3.2, 'Agent Controls': 3.0 },
  'Retail': { 'AI Strategy': 2.4, 'People & Culture': 2.5, 'Data Foundation': 2.6, 'Process Readiness': 2.5, 'AI Policies': 2.3, 'Agent Controls': 2.1 },
  'Consumer Goods': { 'AI Strategy': 2.4, 'People & Culture': 2.5, 'Data Foundation': 2.6, 'Process Readiness': 2.5, 'AI Policies': 2.3, 'Agent Controls': 2.1 },
  'Real Estate': { 'AI Strategy': 2.2, 'People & Culture': 2.3, 'Data Foundation': 2.2, 'Process Readiness': 2.4, 'AI Policies': 2.1, 'Agent Controls': 2.0 },
  'Construction': { 'AI Strategy': 2.2, 'People & Culture': 2.3, 'Data Foundation': 2.2, 'Process Readiness': 2.4, 'AI Policies': 2.1, 'Agent Controls': 2.0 },
  'Education': { 'AI Strategy': 2.1, 'People & Culture': 2.3, 'Data Foundation': 2.2, 'Process Readiness': 2.2, 'AI Policies': 2.3, 'Agent Controls': 1.9 },
  'Non-Profit': { 'AI Strategy': 2.0, 'People & Culture': 2.2, 'Data Foundation': 2.1, 'Process Readiness': 2.1, 'AI Policies': 2.2, 'Agent Controls': 1.8 },
  'Other': { 'AI Strategy': 2.4, 'People & Culture': 2.5, 'Data Foundation': 2.4, 'Process Readiness': 2.4, 'AI Policies': 2.3, 'Agent Controls': 2.1 },
}

function getIndustryBenchmarks(industry: string | null): Record<string, number> | null {
  if (!industry) return INDUSTRY_BENCHMARKS['Other']
  return INDUSTRY_BENCHMARKS[industry] ?? INDUSTRY_BENCHMARKS['Other']
}

// ─── Educational Sidebars ───────────────────────────────────────────────────

const EDUCATIONAL_SIDEBARS: Record<string, string> = {
  AIStrategy: 'What is an AI Strategy? An AI strategy is a deliberate plan that aligns artificial intelligence investments with business outcomes. Companies with a defined AI strategy are 2.3x more likely to report measurable ROI from AI initiatives within 18 months.',
  PeopleAndCulture: 'AI Adoption is a People Problem First: The most sophisticated AI tools fail without organizational readiness. Companies that invest in AI literacy, change management, and dedicated ownership before deploying technology see 3x higher adoption rates and significantly faster time to value.',
  DataFoundation: 'Why Data Quality Matters for AI: AI models are only as reliable as the data they learn from. Before deploying any AI agent or automation, organizations need accessible, accurate, and governed data. Poor data quality is the #1 reason AI projects fail in their first year.',
  ProcessReadiness: 'AI Augments Process, It Does Not Replace It: The most successful AI deployments start with well-documented, repeatable processes. AI agents work best when they have clear rules to follow and defined outcomes to optimize for.',
  AIPolicies: 'The Cost of Moving Fast Without Guardrails: Organizations that deploy AI without governance frameworks face regulatory exposure, reputational risk, and model failures that erode trust. A lightweight governance policy takes weeks to build and can prevent months of remediation.',
  AgentControls: 'What Makes an Agent Trustworthy: An AI agent that acts autonomously on behalf of your business needs the same controls as any employee: defined scope, audit trails, escalation paths, and performance accountability. Without these, agents create liability, not leverage.',
}

const AGENTFORCE_SIDEBARS: Record<string, string> = {
  CorePrereqs: 'Why Your Salesforce Investment Is a Head Start on Agentforce: Agentforce agents run natively inside your existing Salesforce org, reading records, triggering automations, and taking action on your behalf. Every record, process, and integration you have already built becomes fuel for your agents on day one, which is why Salesforce customers consistently see faster time to value than teams starting from scratch.',
  DataCloud: 'Unified customer data across systems: We have a clear, unified view of our customer data across all systems. That means every Agentforce agent, every sales rep, and every service rep sees the same customer story in real time, so responses are personalized, accurate, and consistent no matter where the customer started the conversation.',
  SalesCloud: 'What an AI Sales Agent Delivers: Agentforce SDR Agent autonomously qualifies inbound leads, follows up on open opportunities, and surfaces next best actions for your sales team, all inside Salesforce. The result is faster response times, consistent follow-through, and reps focused on closing rather than admin, typically within 60 to 90 days of deployment.',
  ServiceCloud: 'What an AI Service Agent Delivers: Agentforce Service Agent resolves routine customer inquiries autonomously across chat, email, and messaging, deflecting cases without human intervention and escalating complex issues with full context already captured. Companies deploying service agents report 30 to 40% reduction in handle time within the first 60 days.',
  MarketingCloud: 'What an AI Marketing Agent Delivers: Agentforce for Marketing automates audience segmentation, campaign optimization, and personalized journey triggers based on real-time customer behavior. Marketing teams using AI agents see higher engagement rates and significantly less time spent on manual campaign management.',
}

// "Why It Matters" closing lines for educational sidebars
const SIDEBAR_CLOSING: Record<string, string> = {
  AIStrategy: 'Organizations without a defined AI strategy spend 3x longer evaluating tools than deploying them.',
  PeopleAndCulture: 'The #1 reason AI initiatives stall is not technology. It is people. Change readiness determines deployment speed.',
  DataFoundation: 'An AI system trained on incomplete data doesn\'t just underperform, it actively misleads. Clean data is not a nice-to-have, it is a prerequisite.',
  ProcessReadiness: 'AI agents follow rules. If your processes are undocumented, your agents will automate the chaos, not fix it.',
  AIPolicies: 'The cost of an AI incident (reputational, regulatory, or operational) far exceeds the cost of a governance framework built before deployment.',
  AgentControls: 'An agent without an owner is a liability without a name. Accountability must be established before autonomy is granted.',
}

const AGENTFORCE_CLOSING: Record<string, string> = {
  CorePrereqs: 'Your implementation partner handles the technical work. Most clients are live with their first agent in under 60 days.',
  DataCloud: 'A unified customer view gives every Agentforce agent full context across your clouds. Teams starting with the free Salesforce Foundations tier (100K Flex Credits) activate immediately, no net-new spend required.',
  SalesCloud: 'SDR Agents with clean CRM data qualify leads ~40% more accurately and cut lead response time from hours to seconds. Data and workflow tuning are included in your deployment.',
  ServiceCloud: 'Service Agents with access to your Knowledge Base resolve cases up to 3x faster and deflect 40 to 70% of routine inquiries autonomously. Your team focuses on the cases that need a human.',
  MarketingCloud: 'Marketing Agents with consented, segmented data scale personalization across every campaign, driving higher engagement with less manual work. Data enablement is part of the rollout.',
}

// Category accent colors for sidebar borders
const CATEGORY_ACCENT: Record<string, string> = {
  AIStrategy: '#1d4ed8',
  PeopleAndCulture: '#7c3aed',
  DataFoundation: '#0891b2',
  ProcessReadiness: '#059669',
  AIPolicies: '#d97706',
  AgentControls: '#dc2626',
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 48,
    paddingVertical: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.gray800,
    backgroundColor: COLORS.white,
  },
  // Cover
  coverPage: {
    paddingHorizontal: 48,
    paddingVertical: 0,
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  coverBrand: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    letterSpacing: 2,
    color: '#93c5fd',
    marginBottom: 8,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.2,
    marginBottom: 6,
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#bfdbfe',
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 10,
    color: '#bfdbfe',
    marginBottom: 3,
  },
  coverMetaValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  badge: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    minWidth: 160,
  },
  badgeLabel: {
    fontSize: 8,
    letterSpacing: 1,
    color: '#bfdbfe',
    marginBottom: 6,
  },
  badgeScore: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
  },
  badgeTier: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  // Section headers
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    letterSpacing: 2,
    color: COLORS.gray400,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray900,
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.gray700,
  },
  // Category page
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray900,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray900,
  },
  scoreBarBg: {
    width: 80,
    height: 6,
    backgroundColor: COLORS.gray200,
    borderRadius: 3,
  },
  scoreBarFill: {
    height: 6,
    borderRadius: 3,
  },
  tierBadgeInline: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    color: COLORS.white,
  },
  recNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    lineHeight: 18,
  },
  recItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  // Quick Wins grid
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gridCell: {
    flex: 1,
    padding: 12,
    borderRadius: 0,
    minHeight: 120,
  },
  gridLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  gridSubtitle: {
    fontSize: 7,
    color: COLORS.gray500,
    marginBottom: 8,
  },
  gridItem: {
    fontSize: 9,
    lineHeight: 1.5,
    color: COLORS.gray700,
    marginBottom: 4,
    paddingLeft: 8,
  },
  // Callout box
  calloutBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 24,
  },
  calloutTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.exploring,
    marginBottom: 12,
  },
  calloutLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    color: '#ef4444',
    marginBottom: 4,
  },
  calloutBody: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#7f1d1d',
    marginBottom: 12,
  },
  // Agentforce cards
  agentCard: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  agentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  // Roadmap
  phaseCard: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
  },
  phaseNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    color: COLORS.white,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  phaseTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray900,
    marginBottom: 2,
  },
  phaseDuration: {
    fontSize: 8,
    color: COLORS.gray500,
    marginBottom: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.gray400,
  },
  // Next steps
  ctaBox: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 28,
    marginTop: 20,
  },
  ctaText: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#bfdbfe',
  },
  ctaBold: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
    marginBottom: 10,
  },
  // Edition flag
  editionCallout: {
    backgroundColor: COLORS.amberLight,
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  dataCloudCallout: {
    backgroundColor: COLORS.blueLight,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
})

// ─── Shared components ───────────────────────────────────────────────────────

function PageFooter({ companyName }: { companyName: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Confidential, Prepared for {companyName}</Text>
      <Text style={s.footerText}>Powered by IMG</Text>
    </View>
  )
}

function ScoreBar({ score, width = 80 }: { score: number; width?: number }) {
  const color =
    score >= 4.1 ? COLORS.leading
    : score >= 3.1 ? COLORS.scaling
    : score >= 2.1 ? COLORS.building
    : COLORS.exploring
  return (
    <View style={[s.scoreBarBg, { width }]}>
      <View style={[s.scoreBarFill, { width: (score / 5) * width, backgroundColor: color }]} />
    </View>
  )
}

function TierBadge({ tier, color }: { tier: string; color: string }) {
  return (
    <Text style={[s.tierBadgeInline, { backgroundColor: color }]}>
      {tier}
    </Text>
  )
}


// ─── Category labels ─────────────────────────────────────────────────────────

const CATEGORY_KEYS = [
  'AIStrategy',
  'PeopleAndCulture',
  'DataFoundation',
  'ProcessReadiness',
  'AIPolicies',
  'AgentControls',
] as const

const CATEGORY_LABELS: Record<string, string> = {
  AIStrategy: 'AI Strategy',
  PeopleAndCulture: 'People & Culture',
  DataFoundation: 'Data Foundation',
  ProcessReadiness: 'Process Readiness',
  AIPolicies: 'AI Policies',
  AgentControls: 'Agent Controls',
}

const CLOUD_LABELS: Record<string, string> = {
  SalesCloud: 'Sales Cloud',
  ServiceCloud: 'Service Cloud',
  MarketingCloud: 'Marketing Cloud',
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ProspectReportProps {
  assessment: Assessment
  l1Scores: Layer1Scores
  l2Scores: Layer2Scores | null
  productScores: ProductScore[] | null
  narrative: ReportNarrative
  agentforceNarrative: AgentforceNarrative | null
  checkedSymptoms?: string[]
  /** snapshot question_id → boolean; used by the Agentforce recommendation engine */
  snapshotChecks?: Record<string, boolean>
  layer1QuestionCount?: number
  layer2QuestionCount?: number
  referralPartner?: ReferralPartner | null
}

// ─── Document ────────────────────────────────────────────────────────────────

export function ProspectReport({
  assessment,
  l1Scores,
  l2Scores,
  productScores,
  narrative,
  agentforceNarrative,
  checkedSymptoms = [],
  snapshotChecks = {},
  layer1QuestionCount = 0,
  layer2QuestionCount = 0,
  referralPartner = null,
}: ProspectReportProps) {
  const isSalesforce = !!assessment.uses_salesforce
  const companyName = assessment.company_name ?? 'Your Company'
  const respondentName =
    [assessment.contact_first_name, assessment.contact_last_name]
      .filter(Boolean)
      .join(' ') || 'Respondent'
  const respondentTitle = assessment.contact_title ?? ''
  const aeName = referralPartner?.name ?? 'Your Account Executive'
  const reportDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const activeClouds = assessment.salesforce_clouds ?? []
  const productClouds = activeClouds.filter((c) => c !== 'DataCloud')
  const benchmarks = getIndustryBenchmarks(assessment.company_industry)
  const industryLabel = assessment.company_industry ?? 'Other'

  return (
    <Document>
      {/* ── PAGE 1: Cover ───────────────────────────────────────────────── */}
      <Page size="LETTER" style={s.coverPage}>
        <Text style={s.coverBrand}>POWERED BY IMG</Text>
        <Text style={s.coverTitle}>AI Readiness{'\n'}Assessment Report</Text>
        <Text style={s.coverSubtitle}>{companyName}</Text>

        <Text style={s.coverMeta}>PREPARED FOR</Text>
        <Text style={s.coverMetaValue}>
          {respondentName}{respondentTitle ? `, ${respondentTitle}` : ''}
        </Text>

        <Text style={s.coverMeta}>DATE</Text>
        <Text style={s.coverMetaValue}>{reportDate}</Text>

        <Text style={s.coverMeta}>ACCOUNT EXECUTIVE</Text>
        <Text style={s.coverMetaValue}>{aeName}</Text>

        <View style={s.badgeRow}>
          <View style={s.badge}>
            <Text style={s.badgeLabel}>OVERALL AI MATURITY</Text>
            <Text style={s.badgeScore}>{l1Scores.overall.toFixed(1)}/5</Text>
            <Text
              style={[
                s.badgeTier,
                { backgroundColor: layer1TierColor(l1Scores.tier), color: COLORS.white },
              ]}
            >
              {l1Scores.tier}
            </Text>
            {tierDescription(l1Scores.tier) && (
              <Text
                style={{
                  fontSize: 9,
                  lineHeight: 1.45,
                  color: '#bfdbfe',
                  marginTop: 8,
                }}
              >
                {tierDescription(l1Scores.tier)}
              </Text>
            )}
          </View>

          {isSalesforce && l2Scores && (
            <View style={s.badge}>
              <Text style={s.badgeLabel}>AGENTFORCE READINESS INDEX</Text>
              <Text style={s.badgeScore}>{l2Scores.overall.toFixed(1)}/5</Text>
              <Text
                style={[
                  s.badgeTier,
                  { backgroundColor: layer2TierColor(l2Scores.tier), color: COLORS.white },
                ]}
              >
                {layer2TierLabel(l2Scores.tier)}
              </Text>
              {tierDescription(l2Scores.tier) && (
                <Text
                  style={{
                    fontSize: 9,
                    lineHeight: 1.45,
                    color: '#bfdbfe',
                    marginTop: 8,
                  }}
                >
                  {tierDescription(l2Scores.tier)}
                </Text>
              )}
            </View>
          )}
        </View>
      </Page>

      {/* ── PAGE 2: Understanding AI Today ──────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>REPORT INTRODUCTION</Text>
        <Text style={s.sectionTitle}>Understanding AI in {new Date().getFullYear()}</Text>

        {/* ── THE AI LANDSCAPE ── */}
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 8 }}>
          The AI Landscape
        </Text>
        <Text style={[s.bodyText, { marginBottom: 20 }]}>
          AI has moved beyond experimentation. In {new Date().getFullYear()}, the organizations gaining competitive advantage are not
          the ones running pilots. They are the ones deploying AI agents that take autonomous action on behalf
          of the business. Across every industry, the conversation has shifted from &quot;should we use AI?&quot;
          to &quot;how quickly can we operationalize it?&quot; The gap between companies that treat AI as
          infrastructure and those still exploring it is widening rapidly, and that gap directly impacts
          revenue, efficiency, and talent retention.
        </Text>

        {/* ── Pull Quote ── */}
        <View style={{
          borderLeftWidth: 4,
          borderLeftColor: '#EA580C',
          paddingLeft: 16,
          paddingVertical: 10,
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, color: COLORS.gray800 }}>
            &quot;Most AI projects don&apos;t fail because the technology doesn&apos;t work. They fail because the organization wasn&apos;t ready for it.&quot;
          </Text>
          <Text style={{ fontSize: 8, letterSpacing: 1.5, color: COLORS.gray400, marginTop: 6 }}>
            IMG AI READINESS RESEARCH, {new Date().getFullYear()}
          </Text>
        </View>

        {/* ── Divider ── */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.gray200, marginBottom: 16 }} />

        {/* ── KEY TERMINOLOGY ── */}
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 12 }}>
          Key Terminology
        </Text>

        {[
          ['Artificial Intelligence (AI)', 'Software systems that perform tasks that typically require human intelligence: pattern recognition, decision-making, language understanding, and prediction. Modern AI learns from data rather than following rigid rules.'],
          ['Large Language Model (LLM)', 'The technology behind tools like ChatGPT, Claude, and Copilot. LLMs are trained on vast amounts of text and can generate, summarize, translate, and reason about language at a human level. They are the foundation of most modern AI assistants and agents.'],
          ['AI Agent', 'An AI system that can take autonomous action, not just answer questions, but execute tasks, make decisions, and interact with systems on behalf of a user or organization. Agents can be given a goal and work through multiple steps to achieve it without constant human direction.'],
          ['Agentforce', "Salesforce's native AI agent platform. Agentforce agents live inside your Salesforce org and can autonomously handle sales follow-up, customer service inquiries, and marketing actions using your actual CRM data, without switching tools or systems."],
          ['Prompt', "The instruction or question given to an AI model. The quality and specificity of a prompt directly affects the quality of the AI's output. Organizations that develop internal prompt standards see more consistent and reliable AI results."],
          ['Retrieval-Augmented Generation (RAG)', "A technique that allows AI models to pull from a specific knowledge base (your company's documents, policies, or data) rather than relying solely on general training. RAG makes AI outputs more accurate, relevant, and grounded in your actual business context."],
          ['Einstein Trust Layer', "Salesforce's built-in security and compliance framework for AI. It ensures that data sent to AI models is masked, not retained by third parties, and auditable, giving IT and legal teams confidence that AI operates within established guardrails."],
          ['Data Foundation', 'The combination of data quality, accessibility, governance, and infrastructure that determines how effectively AI can operate within an organization. A strong data foundation is the single most important prerequisite for successful AI deployment.'],
          ['AI Governance', 'The policies, processes, and controls an organization puts in place to ensure AI systems operate safely, ethically, and accountably. Governance covers who owns AI decisions, how models are monitored, and what happens when an agent makes a mistake.'],
        ].map(([term, definition], i) => (
          <View key={i} style={{ flexDirection: 'row', marginBottom: 6 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, width: 135, paddingRight: 10 }}>
              {term}
            </Text>
            <Text style={{ fontSize: 8, lineHeight: 1.5, color: COLORS.gray700, flex: 1 }}>
              {definition}
            </Text>
          </View>
        ))}

        {/* ── Divider ── */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.gray200, marginTop: 12, marginBottom: 16 }} />

        {/* ── WHY THIS ASSESSMENT MATTERS ── */}
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 8 }}>
          Why This Assessment Matters
        </Text>
        <Text style={s.bodyText}>
          This report is designed to give business leaders a clear, honest view of where their organization
          stands today, not to sell a specific technology, but to identify the gaps and opportunities that
          will determine how effectively you can compete in an AI-enabled market. The findings and
          recommendations that follow are grounded in your actual responses, benchmarked against industry
          standards, and structured to drive action. IMG serves as a guide through this landscape, helping
          you see what matters, what to prioritize, and where to start.
        </Text>

        <PageFooter companyName={companyName} />
      </Page>

      {/* ── PAGE 3: Executive Summary + Operations Snapshot ──────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>EXECUTIVE SUMMARY</Text>
        <Text style={s.sectionTitle}>Executive Summary</Text>

        {(() => {
          const sections = parseExecutiveSummary(
            typeof narrative.executiveSummary === 'string' ? narrative.executiveSummary : '',
          )
          if (sections.length === 0) {
            return <Text style={s.bodyText}>{narrative.executiveSummary}</Text>
          }
          return (
            <View>
              {sections.map((sec, i) => (
                <View
                  key={sec.key}
                  style={{
                    marginBottom: i === sections.length - 1 ? 0 : 12,
                    paddingLeft: 14,
                    borderLeftWidth: 3,
                    borderLeftColor: COLORS.primary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'Helvetica-Bold',
                      color: COLORS.primaryDark,
                      marginBottom: 4,
                    }}
                  >
                    {i + 1}. {sec.display}
                  </Text>
                  <Text style={s.bodyText}>{sec.body}</Text>
                </View>
              ))}
            </View>
          )
        })()}

        {/* ── Operations Snapshot Callout ── */}
        <View style={{
          backgroundColor: '#EFF6FF',
          borderLeftWidth: 4,
          borderLeftColor: '#3B82F6',
          borderRadius: 6,
          padding: 16,
          marginTop: 20,
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 10 }}>
            You told us your organization is experiencing:
          </Text>
          {checkedSymptoms.length > 0 ? (
            checkedSymptoms.map((symptom, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 4 }}>
                <Text style={{ fontSize: 10, color: '#16A34A', marginRight: 6 }}>{'\u2713'}</Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5, color: COLORS.gray700, flex: 1 }}>{symptom}</Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 9, color: COLORS.gray500, fontStyle: 'italic', paddingLeft: 4 }}>
              No operational symptoms were flagged
            </Text>
          )}
        </View>

        <View style={{ marginTop: 4 }}>
          <Text style={[s.bodyText, { fontFamily: 'Helvetica-Bold', marginBottom: 8 }]}>
            Stated Motivation
          </Text>
          <Text style={s.bodyText}>{assessment.ai_motivation ?? 'Not provided'}</Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={[s.bodyText, { fontFamily: 'Helvetica-Bold', marginBottom: 8 }]}>
            Current AI Usage
          </Text>
          <Text style={s.bodyText}>{assessment.ai_current_usage ?? 'Not provided'}</Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={[s.bodyText, { fontFamily: 'Helvetica-Bold', marginBottom: 8 }]}>
            Company Profile
          </Text>
          <Text style={s.bodyText}>
            Industry: {assessment.company_industry ?? 'N/A'}  |  Size: {assessment.company_size ?? 'N/A'}  |  Revenue: {assessment.company_revenue ?? 'N/A'}
          </Text>
        </View>

        <PageFooter companyName={companyName} />
      </Page>

      {/* ── PAGE 4: Score Summary ──────────────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>SCORE SUMMARY</Text>
        <Text style={s.sectionTitle}>Your AI Readiness at a Glance</Text>

        {/* Overall score prominently displayed */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <View style={{
            backgroundColor: COLORS.gray100,
            borderRadius: 8,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}>
            <Text style={{ fontSize: 24, fontFamily: 'Helvetica-Bold', color: COLORS.gray900 }}>
              {l1Scores.overall.toFixed(1)}/5
            </Text>
            <TierBadge tier={l1Scores.tier} color={layer1TierColor(l1Scores.tier)} />
          </View>
          <Text style={{ fontSize: 10, color: COLORS.gray500 }}>Overall AI Maturity</Text>
        </View>
        {tierDescription(l1Scores.tier) && (
          <Text style={{ fontSize: 10, lineHeight: 1.5, color: COLORS.gray700, marginBottom: 20 }}>
            {tierDescription(l1Scores.tier)}
          </Text>
        )}

        {/* Section A: General AI Maturity bars */}
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 12 }}>
          General AI Maturity
        </Text>

        {l1Scores.categories.map((cat) => {
          const score = cat.raw
          const benchmark = benchmarks?.[cat.category]
          const tierColor =
            score >= 4.1 ? COLORS.leading
            : score >= 3.1 ? COLORS.scaling
            : score >= 2.1 ? COLORS.building
            : COLORS.exploring
          const scoreBarWidth = (score / 5) * 200
          const benchmarkPos = benchmark ? (benchmark / 5) * 200 : 0

          return (
            <View key={cat.category} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              {/* Category label */}
              <Text style={{ width: 110, fontSize: 9, color: '#374151' }}>{cat.category}</Text>

              {/* Bar track */}
              <View style={{ width: 200, height: 12, backgroundColor: '#F3F4F6', borderRadius: 6, position: 'relative', marginHorizontal: 8 }}>
                {/* Score fill */}
                <View style={{ height: 12, width: scoreBarWidth, backgroundColor: tierColor, borderRadius: 6 }} />
                {/* Benchmark marker */}
                {benchmark != null && benchmark > 0 && (
                  <View style={{ position: 'absolute', left: benchmarkPos, top: 0, width: 2, height: 12, backgroundColor: '#6B7280' }} />
                )}
              </View>

              {/* Score number */}
              <Text style={{ width: 24, fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111827', textAlign: 'right' }}>
                {score.toFixed(1)}
              </Text>

              {/* Benchmark number */}
              <Text style={{ width: 28, fontSize: 8, color: '#9CA3AF', textAlign: 'right' }}>
                {benchmark ? benchmark.toFixed(1) : ''}
              </Text>
            </View>
          )
        })}

        {/* Tier legend */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Exploring', color: '#DC2626' },
            { label: 'Building', color: '#EA580C' },
            { label: 'Scaling', color: '#CA8A04' },
            { label: 'Leading', color: '#16A34A' },
          ].map((t) => (
            <View key={t.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: t.color }} />
              <Text style={{ fontSize: 8, color: COLORS.gray700 }}>{t.label}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#6B7280' }} />
            <Text style={{ fontSize: 8, color: COLORS.gray700 }}>Industry Avg</Text>
          </View>
        </View>

        {/* Section B: Agentforce Readiness (Salesforce only) */}
        {isSalesforce && l2Scores && (
          <>
            <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.gray200, marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900 }}>
                Agentforce Readiness
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.gray900 }}>
                  {l2Scores.overall.toFixed(1)}/5
                </Text>
                <TierBadge tier={l2Scores.tier} color={layer2TierColor(l2Scores.tier)} />
              </View>
            </View>
            {tierDescription(l2Scores.tier) && (
              <Text style={{ fontSize: 10, lineHeight: 1.5, color: COLORS.gray700, marginBottom: 12 }}>
                {tierDescription(l2Scores.tier)}
              </Text>
            )}

            {l2Scores.edition_flag && (
              <View style={{ backgroundColor: COLORS.amberLight, borderRadius: 4, padding: 8, marginBottom: 12 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.amberDark }}>
                  Edition flag: {assessment.salesforce_edition}, scores capped at 2.5
                </Text>
              </View>
            )}

            {/* Per-product agent scores */}
            {(productScores ?? []).filter(p => p.cloud !== 'Overall').map((ps) => (
              <View key={ps.cloud} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.gray800 }}>
                    {ps.cloud === 'SalesCloud' ? 'Sales Agent' : ps.cloud === 'ServiceCloud' ? 'Service Agent' : ps.cloud === 'MarketingCloud' ? 'Marketing Agent' : ps.cloud}
                  </Text>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: layer2TierColor(ps.tier) }}>
                    {ps.score.toFixed(1)}/5
                  </Text>
                </View>
                <View style={{ width: 340, height: 10, backgroundColor: COLORS.gray200, borderRadius: 5 }}>
                  <View style={{ width: (ps.score / 5) * 340, height: 10, backgroundColor: layer2TierColor(ps.tier), borderRadius: 5 }} />
                </View>
              </View>
            ))}
          </>
        )}

        {/* Assessment Methodology Note */}
        <View style={{
          backgroundColor: COLORS.gray50,
          borderRadius: 4,
          padding: 10,
          marginTop: 14,
        }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 4 }}>
            About This Assessment
          </Text>
          <Text style={{ fontSize: 7.5, lineHeight: 1.5, color: COLORS.gray700 }}>
            This report is based on {layer1QuestionCount} scored responses across 6 dimensions of AI readiness
            {isSalesforce && layer2QuestionCount > 0
              ? `, plus ${layer2QuestionCount} Agentforce-specific questions across ${(activeClouds.filter(c => c !== 'DataCloud').length || 0) + 2} sections`
              : ''
            }. Each question was scored on a 1 to 5 scale: 1 = No awareness or capability, 2 = Early / ad hoc, 3 = In development / inconsistent, 4 = Mostly in place, 5 = Fully implemented / leading practice.{'\n\n'}Category scores represent the average of all responses within that dimension. The Overall AI Maturity score is a weighted composite: AI Strategy (20%), People and Culture (20%), Data Foundation (20%), Process Readiness (20%), Risk and Governance (10%), AI Agent Governance (10%). Industry benchmarks reflect aggregate data from assessments conducted across similar organizations.
          </Text>
        </View>

        <PageFooter companyName={companyName} />
      </Page>

      {/* ── PAGE 5: Critical Gap ───────────────────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>CRITICAL GAP ANALYSIS</Text>
        <Text style={s.sectionTitle}>Priority Action Required</Text>

        <View style={s.calloutBox}>
          <Text style={s.calloutTitle}>{narrative.criticalGap.area}</Text>

          <Text style={s.calloutLabel}>FINDING</Text>
          <Text style={s.calloutBody}>{narrative.criticalGap.finding}</Text>

          <Text style={s.calloutLabel}>RECOMMENDED ACTION</Text>
          <Text style={[s.calloutBody, { fontFamily: 'Helvetica-Bold', marginBottom: 0 }]}>
            {narrative.criticalGap.recommendation}
          </Text>
        </View>

        {/* Impact if Unaddressed */}
        <View style={{
          backgroundColor: '#FFF7ED',
          borderWidth: 1,
          borderColor: '#FDBA74',
          borderRadius: 8,
          padding: 20,
          marginTop: 16,
        }}>
          <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#9A3412', marginBottom: 8 }}>
            Impact if Unaddressed
          </Text>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#7C2D12' }}>
            {narrative.criticalGap.impactIfUnaddressed
              ? narrative.criticalGap.impactIfUnaddressed
              : `Without closing the gap in ${narrative.criticalGap.area}, your organization risks falling further behind industry benchmarks. Teams will continue to operate without the foundation needed for reliable AI deployment, leading to wasted investment, inconsistent results, and growing competitive disadvantage as peers accelerate their AI capabilities.`}
          </Text>
        </View>

        {/* Immediate Next Step */}
        <View style={{
          backgroundColor: '#F0FDF4',
          borderWidth: 1,
          borderColor: '#86EFAC',
          borderRadius: 8,
          padding: 20,
          marginTop: 12,
        }}>
          <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#166534', marginBottom: 8 }}>
            Immediate Next Step
          </Text>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#14532D' }}>
            {narrative.criticalGap.immediateNextStep
              ? narrative.criticalGap.immediateNextStep
              : `This week: schedule a 30-minute internal review of your current ${narrative.criticalGap.area.toLowerCase()} capabilities. Identify the single highest-priority blocker and assign an owner to scope the effort required to resolve it within the next 30 days.`}
          </Text>
        </View>

        <PageFooter companyName={companyName} />
      </Page>

      {/* ── PAGES 6-11: Category Findings (one per page) ──────────────── */}
      {CATEGORY_KEYS.map((key) => {
        const catNarrative = narrative.categories[key]
        if (!catNarrative) return null
        const label = CATEGORY_LABELS[key] ?? key
        const l1Cat = l1Scores.categories.find((c) => c.category === label)
        const score = l1Cat?.raw ?? 0
        const tier = tierFromScore(score)
        const benchmarkScore = benchmarks?.[label]
        const accentColor = CATEGORY_ACCENT[key] ?? COLORS.primary
        const sidebar = EDUCATIONAL_SIDEBARS[key]

        const diff = benchmarkScore != null ? score - benchmarkScore : null
        const diffLabel = diff != null
          ? `${Math.abs(diff).toFixed(1)} ${diff >= 0 ? 'above' : 'below'} average`
          : null

        return (
          <Page key={key} size="LETTER" style={s.page}>
            <Text style={s.sectionLabel}>CATEGORY ASSESSMENT</Text>

            {/* Educational Sidebar */}
            {sidebar && (
              <View style={{
                backgroundColor: COLORS.gray50,
                borderLeftWidth: 3,
                borderLeftColor: accentColor,
                borderRadius: 4,
                padding: 10,
                marginBottom: 14,
              }}>
                <Text style={{ fontSize: 10, lineHeight: 1.5, color: COLORS.gray700 }}>
                  {sidebar}
                </Text>
                {SIDEBAR_CLOSING[key] && (
                  <Text style={{ fontSize: 9, lineHeight: 1.5, color: COLORS.gray500, fontStyle: 'italic', marginTop: 6 }}>
                    {SIDEBAR_CLOSING[key]}
                  </Text>
                )}
              </View>
            )}

            {/* Plain-English read of the score (shown before any score or bullet findings) */}
            {(() => {
              const plain =
                catNarrative.plainSummary ?? fallbackPlainSummary(label, score)
              return (
                <View
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderLeftWidth: 3,
                    borderLeftColor: accentColor,
                    borderRadius: 4,
                    padding: 10,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      fontFamily: 'Helvetica-Bold',
                      letterSpacing: 1,
                      color: COLORS.gray500,
                      marginBottom: 4,
                    }}
                  >
                    WHAT THIS MEANS FOR YOUR BUSINESS
                  </Text>
                  <Text style={{ fontSize: 11, lineHeight: 1.5, color: COLORS.gray800 }}>
                    {plain}
                  </Text>
                </View>
              )
            })()}

            {/* Context Paragraph */}
            {catNarrative.context && (
              <Text style={{ fontSize: 10, lineHeight: 1.6, color: COLORS.gray500, marginBottom: 14 }}>
                {catNarrative.context}
              </Text>
            )}

            <View style={s.categoryHeader}>
              <Text style={s.categoryName}>{label}</Text>
              <View style={s.scoreContainer}>
                <Text style={s.scoreText}>{score.toFixed(1)}/5</Text>
                <ScoreBar score={score} />
                <TierBadge tier={tier} color={layer1TierColor(tier)} />
              </View>
            </View>

            {/* Industry Benchmark comparison */}
            {benchmarkScore != null && diffLabel && (
              <Text style={{ fontSize: 9, color: COLORS.gray400, marginBottom: 14 }}>
                Industry Average ({industryLabel}): {benchmarkScore.toFixed(1)}. You scored {diffLabel}
              </Text>
            )}

            <Text style={[s.bodyText, { marginBottom: 20 }]}>{catNarrative.summary}</Text>

            <Text style={[s.sectionLabel, { marginBottom: 12 }]}>RECOMMENDATIONS</Text>
            {catNarrative.recommendations.map((rec, i) => {
              // Rich format: object with action/howTo/whyItMatters (new reports)
              // Legacy format: plain string (existing reports in Supabase)
              const isRich = typeof rec === 'object' && rec !== null && 'action' in rec
              const richRec = isRich ? (rec as RichRecommendation) : null

              return (
                <View key={i} wrap={false}>
                  {i > 0 && (
                    <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.gray200, marginVertical: 10 }} />
                  )}
                  {richRec ? (
                    <View style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                        <Text style={s.recNumber}>{String(i + 1).padStart(2, '0')}</Text>
                        <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, flex: 1 }}>
                          {richRec.action}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 10, lineHeight: 1.6, color: COLORS.gray500, paddingLeft: 26, marginBottom: 6 }}>
                        {richRec.howTo}
                      </Text>
                      <Text style={{ fontSize: 9, fontStyle: 'italic', color: '#EA580C', paddingLeft: 34 }}>
                        {richRec.whyItMatters}
                      </Text>
                    </View>
                  ) : (
                    <View style={s.recItem}>
                      <Text style={s.recNumber}>{i + 1}</Text>
                      <Text style={[s.bodyText, { flex: 1 }]}>{rec as string}</Text>
                    </View>
                  )}
                </View>
              )
            })}

            <PageFooter companyName={companyName} />
          </Page>
        )
      })}

      {/* ── PAGE 12: Quick Wins vs Long-Term Investments ───────────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>PRIORITIZATION MATRIX</Text>
        <Text style={s.sectionTitle}>Quick Wins vs Long-Term Investments</Text>

        <QuickWinsGrid quickWins={narrative.quickWins} />

        <PageFooter companyName={companyName} />
      </Page>

      {/* ── Agentforce Opportunity (leads the section with value) ───────── */}
      {(() => {
        const recs = selectAgentforceRecommendations(
          {
            usesSalesforce: isSalesforce,
            activeClouds: (assessment.salesforce_clouds ?? []) as Parameters<typeof selectAgentforceRecommendations>[0]['activeClouds'],
            layer1: l1Scores,
            snapshot: snapshotChecks,
            editionGated: !!l2Scores?.edition_flag,
          },
          5,
        )
        const proofs = selectROIProofPoints(recs, 3)
        const motivation = assessment.ai_motivation ?? 'your stated priorities'
        const cloudCount = productClouds.length
        const cloudList = productClouds
          .map((c) => CLOUD_LABELS[c] ?? c)
          .join(', ')
          .replace(/,([^,]*)$/, cloudCount > 1 ? ' and$1' : '$1')
        const edition = assessment.salesforce_edition ?? 'your'

        return (
          <Page size="LETTER" style={s.page}>
            <Text style={s.sectionLabel}>AGENTFORCE OPPORTUNITY</Text>
            <Text style={s.sectionTitle}>Here&apos;s What&apos;s Possible for You</Text>

            <View
              style={{
                backgroundColor: '#EFF6FF',
                borderLeftWidth: 4,
                borderLeftColor: COLORS.primary,
                borderRadius: 6,
                paddingVertical: 10,
                paddingHorizontal: 14,
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 10, lineHeight: 1.55, color: COLORS.gray800 }}>
                The following results are specific to Salesforce Agentforce. This section is only relevant if you are exploring or currently using Agentforce.
              </Text>
            </View>

            <Text style={[s.bodyText, { marginBottom: 10 }]}>
              {isSalesforce
                ? `Your ${edition} Salesforce environment${cloudCount > 0 ? ` across ${cloudList}` : ''} gives you the infrastructure to deploy Agentforce agents that directly address ${motivation.toLowerCase()}. Your implementation partner configures the agents while optimizing your data foundation in parallel, so you see measurable results within 60 to 90 days.`
                : `Organizations with a readiness profile like yours are already deploying Agentforce to address ${motivation.toLowerCase()}. The outcomes below show what becomes possible when the right agents are matched to your capabilities.`}
            </Text>

            {/* Urgency / competitive context */}
            <View style={{
              backgroundColor: '#FEF3C7',
              borderLeftWidth: 4,
              borderLeftColor: '#D97706',
              borderRadius: 6,
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginBottom: 18,
            }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.amberDark, marginBottom: 2 }}>
                The competitive window is open now.
              </Text>
              <Text style={{ fontSize: 9, lineHeight: 1.5, color: COLORS.amberDark }}>
                Organizations deploying AI agents this year are seeing 30 to 50% efficiency gains. Early adopters are pulling ahead. Waiting means falling behind.
              </Text>
            </View>

            {proofs.length > 0 && (
              <>
                <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 6 }}>
                  Companies like {proofs.map((p) => p.company).slice(0, 3).join(', ').replace(/,([^,]*)$/, ' and$1')} are already seeing results
                </Text>
                <Text style={[s.bodyText, { marginBottom: 14 }]}>
                  These published customer outcomes map directly to the capabilities recommended for {companyName}. Every result below came from an Agentforce deployment in the last 18 months.
                </Text>
                {proofs.map((p, i) => (
                  <View key={`${p.company}-${i}`} wrap={false} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#EFF6FF',
                    borderLeftWidth: 4,
                    borderLeftColor: COLORS.primary,
                    borderRadius: 6,
                    padding: 16,
                    marginBottom: 10,
                  }}>
                    <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: COLORS.primaryDark, minWidth: 170, marginRight: 18 }}>
                      {p.result}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: COLORS.gray900 }}>{p.company}</Text>
                      <Text style={{ fontSize: 10, color: COLORS.gray700, marginTop: 2 }}>{p.metric}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            <PageFooter companyName={companyName} />
          </Page>
        )
      })()}

      {/* ── Your Agentforce Fit, Recommended Agents, 90-Day Path (SF only) ─ */}
      {isSalesforce && agentforceNarrative && l2Scores && (
        <>
          {/* Your Agentforce Fit */}
          <Page size="LETTER" style={s.page}>
            <Text style={s.sectionLabel}>AGENTFORCE READINESS</Text>
            <Text style={s.sectionTitle}>Your Agentforce Fit</Text>

            {/* IMG Agentforce Deployment Model — opportunity framing */}
            <View style={{
              backgroundColor: '#EFF6FF',
              borderLeftWidth: 4,
              borderLeftColor: COLORS.primary,
              borderRadius: 6,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 10 }}>
                The IMG Agentforce Deployment Model
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {/* LAUNCH — Days 1–30 */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.primary, marginBottom: 2 }}>
                    LAUNCH
                  </Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray700, marginBottom: 4 }}>
                    Days 1–30
                  </Text>
                  <Text style={{ fontSize: 8, lineHeight: 1.4, color: COLORS.gray500 }}>
                    Foundation setup and first agent configured. IMG and your Salesforce AE align on success metrics, name the business owner, and activate Salesforce Foundations. First quick wins land inside 30 days.
                  </Text>
                </View>
                {/* Arrow */}
                <Text style={{ fontSize: 16, color: COLORS.gray400, paddingHorizontal: 6, paddingTop: 2 }}>
                  {'\u2192'}
                </Text>
                {/* OPTIMIZE — Days 30–60 */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.primary, marginBottom: 2 }}>
                    OPTIMIZE
                  </Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray700, marginBottom: 4 }}>
                    Days 30–60
                  </Text>
                  <Text style={{ fontSize: 8, lineHeight: 1.4, color: COLORS.gray500 }}>
                    Your first agent goes live. Real usage informs refinement. Data and workflow work continues in parallel, so performance compounds week over week.
                  </Text>
                </View>
                {/* Arrow */}
                <Text style={{ fontSize: 16, color: COLORS.gray400, paddingHorizontal: 6, paddingTop: 2 }}>
                  {'\u2192'}
                </Text>
                {/* EXPAND — Days 60–90 */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.primary, marginBottom: 2 }}>
                    EXPAND
                  </Text>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray700, marginBottom: 4 }}>
                    Days 60–90
                  </Text>
                  <Text style={{ fontSize: 8, lineHeight: 1.4, color: COLORS.gray500 }}>
                    Layer in additional agents based on measured outcomes: task success rate, time saved, CSAT. ROI compounds as you scale.
                  </Text>
                </View>
              </View>
            </View>

            {/* Agentforce Core Prerequisites sidebar */}
            <View style={{
              backgroundColor: COLORS.gray50,
              borderLeftWidth: 3,
              borderLeftColor: '#0891b2',
              borderRadius: 4,
              padding: 10,
              marginBottom: 14,
            }}>
              <Text style={{ fontSize: 10, lineHeight: 1.5, color: COLORS.gray700 }}>
                {AGENTFORCE_SIDEBARS.CorePrereqs}
              </Text>
              <Text style={{ fontSize: 9, lineHeight: 1.5, color: COLORS.gray500, fontStyle: 'italic', marginTop: 6 }}>
                {AGENTFORCE_CLOSING.CorePrereqs}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={[s.badge, { backgroundColor: COLORS.gray100 }]}>
                <Text style={[s.badgeLabel, { color: COLORS.gray500 }]}>
                  YOUR AGENTFORCE POSITION
                </Text>
                <TierBadge tier={layer2TierLabel(l2Scores.tier)} color={layer2TierColor(l2Scores.tier)} />
              </View>
            </View>
            {tierDescription(l2Scores.tier) && (
              <Text style={{ fontSize: 10, lineHeight: 1.55, color: COLORS.gray700, marginBottom: 14 }}>
                {tierDescription(l2Scores.tier)}
              </Text>
            )}

            <Text style={s.bodyText}>
              {agentforceNarrative.agentforceExecutiveSummary}
            </Text>

            {agentforceNarrative.editionFlag && (
              <View style={[s.editionCallout, { marginTop: 16 }]}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.amberDark, marginBottom: 4 }}>
                  Edition Note: {assessment.salesforce_edition}
                </Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5, color: COLORS.amberDark }}>
                  {agentforceNarrative.editionFlag}
                </Text>
              </View>
            )}

            {agentforceNarrative.dataCloudFlag && (
              <View style={[s.dataCloudCallout, { marginTop: agentforceNarrative.editionFlag ? 0 : 16 }]}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.blueDark, marginBottom: 4 }}>
                  Unified customer data across systems
                </Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5, color: COLORS.blueDark, marginBottom: 4 }}>
                  We have a clear, unified view of our customer data across all systems. That means every Agentforce agent, every sales rep, and every service rep sees the same customer story in real time, so responses stay personalized and accurate no matter where the conversation started.
                </Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5, color: COLORS.blueDark }}>
                  {agentforceNarrative.dataCloudFlag.reason} Many clients start with the free Salesforce Foundations tier (100K Flex Credits) to activate immediately.
                </Text>
                <Text style={{ fontSize: 8, color: '#3b82f6', marginTop: 4 }}>
                  When it fits your deployment: {agentforceNarrative.dataCloudFlag.phase}
                </Text>
              </View>
            )}

            <PageFooter companyName={companyName} />
          </Page>

          {/* Per-product recommendations — outcomes-first */}
          {productClouds.length > 0 && (
            <Page size="LETTER" style={s.page}>
              <Text style={s.sectionLabel}>RECOMMENDED AGENTS</Text>
              <Text style={s.sectionTitle}>Your Recommended Agents</Text>
              <Text style={[s.bodyText, { marginBottom: 14 }]}>
                These agents map to your active Salesforce clouds and lead with the outcome you can expect. IMG handles the configuration and data work in parallel so you see results quickly.
              </Text>

              {productClouds.map((cloud) => {
                const rec = agentforceNarrative.agentRecommendations?.[cloud]
                const ps = (productScores ?? []).find((p) => p.cloud === cloud)
                if (!rec) return null

                const cloudSidebar = AGENTFORCE_SIDEBARS[cloud]

                return (
                  <View key={cloud}>
                    {/* Per-cloud educational sidebar */}
                    {cloudSidebar && (
                      <View style={{
                        backgroundColor: COLORS.gray50,
                        borderLeftWidth: 3,
                        borderLeftColor: '#7c3aed',
                        borderRadius: 4,
                        padding: 8,
                        marginBottom: 8,
                      }}>
                        <Text style={{ fontSize: 9, lineHeight: 1.4, color: COLORS.gray700 }}>
                          {cloudSidebar}
                        </Text>
                        {AGENTFORCE_CLOSING[cloud] && (
                          <Text style={{ fontSize: 8, lineHeight: 1.4, color: COLORS.gray500, fontStyle: 'italic', marginTop: 5 }}>
                            {AGENTFORCE_CLOSING[cloud]}
                          </Text>
                        )}
                      </View>
                    )}

                    <View style={s.agentCard}>
                      <View style={s.agentCardHeader}>
                        <View>
                          <Text style={{ fontSize: 8, letterSpacing: 1, color: COLORS.gray400 }}>
                            {CLOUD_LABELS[cloud] ?? cloud}
                          </Text>
                          <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginTop: 2 }}>
                            {rec.agentName}
                          </Text>
                        </View>
                        {ps && (
                          <TierBadge tier={layer2TierLabel(ps.tier)} color={layer2TierColor(ps.tier)} />
                        )}
                      </View>

                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray500, marginBottom: 2 }}>
                        Expected Impact:
                      </Text>
                      <Text style={{ fontSize: 9, color: COLORS.gray700, marginBottom: 8 }}>
                        {rec.expectedOutcome}
                      </Text>

                      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 6 }}>
                        <Text style={{ fontSize: 9, color: COLORS.gray500 }}>
                          <Text style={{ fontFamily: 'Helvetica-Bold' }}>Time to Value: </Text>
                          {rec.timeline}
                        </Text>
                      </View>

                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray500, marginBottom: 4 }}>
                        What&apos;s Included:
                      </Text>
                      {rec.conditions.map((cond, i) => (
                        <Text key={i} style={{ fontSize: 9, color: COLORS.gray700, marginBottom: 2, paddingLeft: 8 }}>
                          {'\u2713'} {cond}
                        </Text>
                      ))}
                    </View>
                  </View>
                )
              })}

              <PageFooter companyName={companyName} />
            </Page>
          )}

          {/* Your 90-Day Path — fast path to results */}
          {agentforceNarrative.implementationRoadmap && (
            <Page size="LETTER" style={s.page}>
              <Text style={s.sectionLabel}>IMPLEMENTATION PATH</Text>
              <Text style={s.sectionTitle}>Your 90-Day Path to Results</Text>

              <Text style={[s.bodyText, { marginBottom: 20 }]}>
                IMG handles the technical work while you see results. Each phase compounds on the last, so the foundation strengthens as your agents deliver measurable outcomes.
              </Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Phase 1 */}
                <View style={[s.phaseCard, { borderColor: '#3b82f6', backgroundColor: '#eff6ff' }]}>
                  <Text style={[s.phaseNum, { backgroundColor: '#2563eb' }]}>1</Text>
                  <Text style={s.phaseTitle}>
                    {agentforceNarrative.implementationRoadmap.phase1.title}
                  </Text>
                  <Text style={s.phaseDuration}>
                    {agentforceNarrative.implementationRoadmap.phase1.duration}
                  </Text>
                  {agentforceNarrative.implementationRoadmap.phase1.actions.map((a, i) => (
                    <Text key={i} style={{ fontSize: 8, color: COLORS.gray700, marginBottom: 3, paddingLeft: 6 }}>
                      {'\u203A'} {a}
                    </Text>
                  ))}
                </View>

                {/* Phase 2 */}
                <View style={[s.phaseCard, { borderColor: '#22c55e', backgroundColor: '#f0fdf4' }]}>
                  <Text style={[s.phaseNum, { backgroundColor: '#16a34a' }]}>2</Text>
                  <Text style={s.phaseTitle}>
                    {agentforceNarrative.implementationRoadmap.phase2.title}
                  </Text>
                  <Text style={s.phaseDuration}>
                    {agentforceNarrative.implementationRoadmap.phase2.duration}
                  </Text>
                  <Text style={{ fontSize: 8, color: COLORS.gray700, marginBottom: 4 }}>
                    {agentforceNarrative.implementationRoadmap.phase2.agent}
                  </Text>
                  <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: COLORS.gray500, marginTop: 4 }}>
                    Outcome:
                  </Text>
                  <Text style={{ fontSize: 8, color: COLORS.gray700 }}>
                    {agentforceNarrative.implementationRoadmap.phase2.outcome}
                  </Text>
                </View>

                {/* Phase 3 */}
                <View style={[s.phaseCard, { borderColor: '#a855f7', backgroundColor: '#faf5ff' }]}>
                  <Text style={[s.phaseNum, { backgroundColor: '#9333ea' }]}>3</Text>
                  <Text style={s.phaseTitle}>
                    {agentforceNarrative.implementationRoadmap.phase3.title}
                  </Text>
                  <Text style={s.phaseDuration}>
                    {agentforceNarrative.implementationRoadmap.phase3.duration}
                  </Text>
                  <Text style={{ fontSize: 8, color: COLORS.gray700 }}>
                    {agentforceNarrative.implementationRoadmap.phase3.expansion}
                  </Text>
                </View>
              </View>

              <PageFooter companyName={companyName} />
            </Page>
          )}
        </>
      )}

      {/* ── Agentforce Capability Mapping (always rendered) ─────────────── */}
      {(() => {
        const recs = selectAgentforceRecommendations(
          {
            usesSalesforce: isSalesforce,
            activeClouds: (assessment.salesforce_clouds ?? []) as Parameters<typeof selectAgentforceRecommendations>[0]['activeClouds'],
            layer1: l1Scores,
            snapshot: snapshotChecks,
            editionGated: !!l2Scores?.edition_flag,
          },
          5,
        )
        const caps = recs.map((r: UseCaseTag) => CAPABILITY_BY_ID[r]).filter(Boolean)
        return (
          <Page size="LETTER" style={s.page}>
            <Text style={s.sectionLabel}>AGENTFORCE CAPABILITIES</Text>
            <Text style={s.sectionTitle}>Capabilities Mapped to Your Highest-Impact Outcomes</Text>

            <Text style={[s.bodyText, { marginBottom: 12 }]}>
              {isSalesforce
                ? `Based on your category scores, active Salesforce clouds, and operational priorities, these ${caps.length} Agentforce capabilities represent your highest-impact opportunities. Each one is mapped to a specific business outcome your team can start capturing in your first deployment window.`
                : `These ${caps.length} Agentforce capabilities represent the highest-impact opportunities for an organization with your readiness profile. A "Considering Salesforce" callout on the next page outlines the fastest path to activate them.`}
            </Text>

            <View>
              {/* Header row — impact leads, SKU is last */}
              <View style={{
                flexDirection: 'row',
                borderTop: `0.5pt solid ${COLORS.gray200}`,
                borderBottom: `0.5pt solid ${COLORS.gray200}`,
                backgroundColor: COLORS.gray50,
                paddingVertical: 6,
              }}>
                <Text style={{ width: '30%', paddingHorizontal: 6, fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray500, letterSpacing: 0.6, textTransform: 'uppercase' }}>Impact for You</Text>
                <Text style={{ width: '22%', paddingHorizontal: 6, fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray500, letterSpacing: 0.6, textTransform: 'uppercase' }}>Capability</Text>
                <Text style={{ width: '30%', paddingHorizontal: 6, fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray500, letterSpacing: 0.6, textTransform: 'uppercase' }}>What It Does</Text>
                <Text style={{ width: '18%', paddingHorizontal: 6, fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray500, letterSpacing: 0.6, textTransform: 'uppercase' }}>SKU</Text>
              </View>
              {caps.map((c) => (
                <View key={c.id} wrap={false} style={{ flexDirection: 'row', borderBottom: `0.5pt solid ${COLORS.gray200}`, paddingVertical: 8 }}>
                  <Text style={{ width: '30%', paddingHorizontal: 6, fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, lineHeight: 1.45 }}>{c.businessImpact}</Text>
                  <View style={{ width: '22%', paddingHorizontal: 6 }}>
                    <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.gray900 }}>{c.name}</Text>
                    <Text style={{ fontSize: 8, color: COLORS.gray500, marginTop: 2 }}>{c.group}</Text>
                  </View>
                  <Text style={{ width: '30%', paddingHorizontal: 6, fontSize: 9, color: COLORS.gray700, lineHeight: 1.45 }}>{c.whatItDoes}</Text>
                  <View style={{ width: '18%', paddingHorizontal: 6 }}>
                    <Text style={{ fontSize: 9, color: COLORS.blueDark, fontFamily: 'Helvetica-Bold' }}>{c.sku}</Text>
                  </View>
                </View>
              ))}
            </View>

            <PageFooter companyName={companyName} />
          </Page>
        )
      })()}

      {/* ── What's Included in Your Deployment ──────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>WHAT&apos;S INCLUDED IN YOUR DEPLOYMENT</Text>
        <Text style={s.sectionTitle}>Your Deployment Package</Text>

        <Text style={[s.bodyText, { marginBottom: 14 }]}>
          Every Agentforce engagement runs as a single, integrated workstream. IMG and your Salesforce AE handle the technical lift while your first agent goes live, so quick wins compound into long-term performance.
        </Text>

        {/* Checklist of what's included */}
        <View style={{
          backgroundColor: '#ECFDF5',
          borderWidth: 1,
          borderColor: '#6EE7B7',
          borderRadius: 8,
          paddingVertical: 16,
          paddingHorizontal: 20,
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#065F46', marginBottom: 10 }}>
            Your Deployment Includes:
          </Text>
          {[
            'Unified customer data across systems — a clear, unified view of our customer data across all systems (free Salesforce Foundations tier available, 100K Flex Credits, no net-new spend to start)',
            'Einstein Trust Layer configuration for security, data masking, and compliance',
            'Data quality and workflow optimization across Lead, Contact, Account, and Opportunity',
            'Agent configuration, guardrails, and sandbox testing before go-live',
            'Team enablement and training, positioned as a productivity multiplier',
            'Weekly transcript reviews and monthly prompt refinements to compound ROI',
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 5 }}>
              <Text style={{ fontSize: 12, color: '#059669', marginRight: 8 }}>{'\u2713'}</Text>
              <Text style={{ flex: 1, fontSize: 10, color: '#065F46', lineHeight: 1.5 }}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Technical fit note */}
        <View style={{
          backgroundColor: COLORS.gray50,
          borderLeftWidth: 3,
          borderLeftColor: COLORS.primary,
          borderRadius: 4,
          paddingVertical: 10,
          paddingHorizontal: 14,
          marginBottom: 6,
        }}>
          <Text style={{ fontSize: 10, color: COLORS.gray700, lineHeight: 1.5 }}>
            {assessment.salesforce_edition === 'Enterprise' || assessment.salesforce_edition === 'Unlimited'
              ? `Your ${assessment.salesforce_edition} Salesforce edition already meets the technical requirements for Agentforce. You are ready to deploy.`
              : isSalesforce
                ? 'Your Salesforce AE can walk through any edition or add-on options that fit your deployment plan. Many configurations are ready to deploy today.'
                : 'Your Salesforce AE can walk through the fastest path to activate Agentforce for your environment.'}
          </Text>
        </View>

        {/* 90-Day enablement path */}
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginTop: 18, marginBottom: 8 }}>
          Your 90-Day Enablement Path
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { title: 'Weeks 1–2: Kickoff + Quick Wins', weeks: 'Weeks 1–2', text: 'Align on success metrics and name a business owner. Activate Salesforce Foundations and enable the Einstein Trust Layer. First quick wins land immediately.' },
            { title: 'Weeks 3–6: First Agent Live',     weeks: 'Weeks 3–6', text: 'Deploy your first pre-built agent (Service Agent or SDR Agent recommended). Capture baseline metrics. Data optimization runs in parallel, not ahead.' },
            { title: 'Weeks 7–12: Expand + Optimize',   weeks: 'Weeks 7–12', text: 'Layer in the next agent based on measured outcomes. Refine topics and guardrails. Monitor performance via the Agentforce Command Center.' },
          ].map((ph) => (
            <View key={ph.title} style={{ flex: 1, border: `0.5pt solid ${COLORS.gray200}`, borderRadius: 6, padding: 10, backgroundColor: COLORS.gray50 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.blueDark }}>{ph.title}</Text>
              <Text style={{ fontSize: 8, color: COLORS.gray500, marginTop: 2, marginBottom: 6 }}>{ph.weeks}</Text>
              <Text style={{ fontSize: 9, color: COLORS.gray700, lineHeight: 1.5 }}>{ph.text}</Text>
            </View>
          ))}
        </View>

        {/* How we ensure success */}
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginTop: 18, marginBottom: 8 }}>
          How We Ensure Success
        </Text>
        {[
          { label: 'Data optimization',      body: 'IMG tunes field completion and cleans key objects (Lead, Contact, Account, Opportunity) alongside agent rollout, so quality keeps improving as agents deliver results.' },
          { label: 'Change enablement',      body: 'Your team is briefed and enabled early, with agents positioned as a productivity multiplier rather than a headcount play. Early buy-in is the single biggest predictor of adoption.' },
          { label: 'Continuous optimization',body: 'Weekly transcript reviews, monthly prompt refinements, and quarterly capability expansions compound ROI over time. Your Salesforce AE and IMG drive the cadence.' },
          { label: 'Implementation partnership', body: 'Typical engagement investments range from $2,000 to $6,000 per agent for configuration, training, and ongoing tuning.' },
        ].map((c) => (
          <View key={c.label} style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ width: 10, fontSize: 10, color: COLORS.blueDark }}>•</Text>
            <Text style={{ flex: 1, fontSize: 9.5, color: COLORS.gray700, lineHeight: 1.5 }}>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: COLORS.gray900 }}>{c.label}: </Text>
              {c.body}
            </Text>
          </View>
        ))}

        {!isSalesforce && (
          <View style={{
            borderLeftWidth: 4,
            borderLeftColor: COLORS.blueDark,
            backgroundColor: '#eff6ff',
            borderRadius: 6,
            padding: 12,
            marginTop: 14,
          }}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.blueDark, marginBottom: 4 }}>
              Considering Salesforce?
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.gray700, lineHeight: 1.5 }}>
              Agentforce provides enterprise-grade AI agents for sales, service, and marketing automation on
              the Salesforce platform. {referralPartner?.name ? `Contact ${referralPartner.name} to explore what a readiness-aligned deployment would look like for ${companyName}.` : 'Ask IMG to introduce you to a Salesforce AE aligned to your industry and size.'}
            </Text>
          </View>
        )}

        <PageFooter companyName={companyName} />
      </Page>

      {/* ── Final Page: Next Steps ─────────────────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>NEXT STEPS</Text>
        <Text style={s.sectionTitle}>Moving Forward</Text>

        <Text style={[s.bodyText, { marginBottom: 10 }]}>
          Your scores are a launchpad, not a verdict. Every opportunity in this report is a lever your team can activate in the next 90 days. Competitors are already deploying agents, and the organizations moving deliberately with the right implementation partner are capturing the early gains.
        </Text>

        <Text style={[s.bodyText, { marginBottom: 16 }]}>
          Your Salesforce AE and IMG will guide you through a proven deployment process designed to deliver quick wins while building long-term performance.
        </Text>

        <View style={s.ctaBox}>
          <Text style={s.ctaBold}>Ready to see results in 60 days?</Text>
          <Text style={s.ctaText}>
            {isSalesforce
              ? `Schedule your deployment kickoff call this week. Your Salesforce AE and IMG will walk through this report and lock in your 90-day plan. Most clients move from this report to first agent live in under 60 days.`
              : 'Schedule your discovery call this week. The IMG team will turn these findings into a concrete 90-day implementation plan tailored to your organization.'}
          </Text>
          <Text style={[s.ctaText, { marginTop: 16, fontFamily: 'Helvetica-Bold', color: COLORS.white }]}>
            Contact: gil@growwithimg.com
          </Text>
        </View>

        {/* ── Referral Partner card (AE) ─────────────────────────────────── */}
        {referralPartner && (
          <View style={{
            borderWidth: 1,
            borderColor: '#bfdbfe',
            backgroundColor: '#eff6ff',
            borderRadius: 6,
            padding: 14,
            marginTop: 16,
          }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.blueDark, letterSpacing: 1, marginBottom: 6 }}>
              YOUR SALESFORCE ACCOUNT EXECUTIVE
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.gray900 }}>
              {referralPartner.name}
            </Text>
            {referralPartner.sf_team_region && (
              <Text style={{ fontSize: 10, color: COLORS.blueDark, marginTop: 1 }}>
                {referralPartner.sf_team_region}
                {referralPartner.company ? ` · ${referralPartner.company}` : ''}
              </Text>
            )}
            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                <Text style={{ width: 60, fontSize: 9, color: COLORS.gray500 }}>Email</Text>
                <Text style={{ flex: 1, fontSize: 9, color: COLORS.gray700 }}>{referralPartner.email}</Text>
              </View>
              {referralPartner.city && (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ width: 60, fontSize: 9, color: COLORS.gray500 }}>Based in</Text>
                  <Text style={{ flex: 1, fontSize: 9, color: COLORS.gray700 }}>{referralPartner.city}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Resources Included callout ────────────────────────────────── */}
        <View style={{
          borderWidth: 1,
          borderColor: '#6ee7b7',
          backgroundColor: '#ecfdf5',
          borderRadius: 6,
          padding: 14,
          marginTop: 14,
        }}>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#065f46', marginBottom: 6 }}>
            Resources Included with This Report
          </Text>
          {[
            'Full AI Readiness Assessment — category scores, benchmarks, quick wins, and prioritized recommendations',
            'Agentforce capability mapping — up to five agents matched to your readiness profile',
            'ROI proof points from organizations like yours',
            `Foundation requirements and a phased 8-week enablement path${isSalesforce ? '' : ' (for when you\'re ready to move on Salesforce)'}`,
            referralPartner
              ? `Direct line to ${referralPartner.name} (${referralPartner.email}) for scoping and demo scheduling`
              : 'Introduction to a Salesforce AE aligned to your industry and size',
            'Access to Salesforce Foundations and Agentforce Trailhead learning paths (free tier)',
          ].map((r, i) => (
            <Text key={i} style={{ fontSize: 10, color: '#065f46', lineHeight: 1.55 }}>
              • {r}
            </Text>
          ))}
        </View>

        <PageFooter companyName={companyName} />
      </Page>
    </Document>
  )
}

// ─── Quick Wins 2x2 Grid Component ──────────────────────────────────────────

function QuickWinsGrid({ quickWins }: { quickWins: QuickWin[] }) {
  const quickWinItems = quickWins.filter(
    (w) => w.effort === 'Low' && (w.impact === 'High' || w.impact === 'Medium'),
  )
  const strategicItems = quickWins.filter(
    (w) => (w.effort === 'Medium' || w.effort === 'High') && w.impact === 'High',
  )
  const fillInItems = quickWins.filter(
    (w) => w.effort === 'Low' && w.impact === 'Low',
  )
  const deprioritizeItems = quickWins.filter(
    (w) =>
      (w.effort === 'Medium' || w.effort === 'High') &&
      (w.impact === 'Medium' || w.impact === 'Low'),
  )

  // Top 3 quick wins + top 2 longer-term
  const topQuickWins = quickWinItems.slice(0, 3)
  const topStrategic = strategicItems.slice(0, 2)

  return (
    <View>
      {/* Y axis label */}
      <Text style={{ fontSize: 8, color: '#9CA3AF', marginBottom: 4 }}>HIGH IMPACT</Text>

      {/* Outer container */}
      <View style={{ border: '0.5pt solid #E5E7EB', borderRadius: 4 }}>
        {/* Top row */}
        <View style={{ flexDirection: 'row' }}>
          {/* Quick Wins (Low Effort, High Impact) */}
          <View style={{ flex: 1, borderRight: '0.5pt solid #E5E7EB', borderBottom: '0.5pt solid #E5E7EB', padding: 12, backgroundColor: COLORS.greenLight, minHeight: 120 }}>
            <Text style={[s.gridLabel, { color: COLORS.greenDark }]}>Quick Wins</Text>
            <Text style={s.gridSubtitle}>Low Effort / High Impact</Text>
            {topQuickWins.map((w, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={[s.gridItem, { fontFamily: 'Helvetica-Bold' }]}>
                  {w.action}
                </Text>
                <Text style={{ fontSize: 7, color: COLORS.gray500, paddingLeft: 8 }}>
                  {w.timeline}
                </Text>
              </View>
            ))}
            {topQuickWins.length === 0 && (
              <Text style={{ fontSize: 8, color: COLORS.gray400, fontStyle: 'italic' }}>No items</Text>
            )}
          </View>

          {/* Strategic Bets (High Effort, High Impact) */}
          <View style={{ flex: 1, borderBottom: '0.5pt solid #E5E7EB', padding: 12, backgroundColor: COLORS.blueLight, minHeight: 120 }}>
            <Text style={[s.gridLabel, { color: COLORS.blueDark }]}>Strategic Bets</Text>
            <Text style={s.gridSubtitle}>High Effort / High Impact</Text>
            {topStrategic.map((w, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={[s.gridItem, { fontFamily: 'Helvetica-Bold' }]}>
                  {w.action}
                </Text>
                <Text style={{ fontSize: 7, color: COLORS.gray500, paddingLeft: 8 }}>
                  {w.timeline}
                </Text>
              </View>
            ))}
            {topStrategic.length === 0 && (
              <Text style={{ fontSize: 8, color: COLORS.gray400, fontStyle: 'italic' }}>No items</Text>
            )}
          </View>
        </View>

        {/* Bottom row */}
        <View style={{ flexDirection: 'row' }}>
          {/* Fill-Ins (Low Effort, Low Impact) */}
          <View style={{ flex: 1, borderRight: '0.5pt solid #E5E7EB', padding: 12, backgroundColor: COLORS.gray50, minHeight: 120 }}>
            <Text style={[s.gridLabel, { color: COLORS.gray700 }]}>Fill-Ins</Text>
            <Text style={s.gridSubtitle}>Low Effort / Low Impact</Text>
            {fillInItems.map((w, i) => (
              <Text key={i} style={s.gridItem}>{w.action}</Text>
            ))}
            {fillInItems.length === 0 && (
              <Text style={{ fontSize: 8, color: COLORS.gray400, fontStyle: 'italic' }}>No items</Text>
            )}
          </View>

          {/* Deprioritize (High Effort, Low Impact) */}
          <View style={{ flex: 1, padding: 12, backgroundColor: COLORS.redLight, minHeight: 120 }}>
            <Text style={[s.gridLabel, { color: COLORS.redDark }]}>Deprioritize</Text>
            <Text style={s.gridSubtitle}>High Effort / Low Impact</Text>
            {deprioritizeItems.map((w, i) => (
              <Text key={i} style={s.gridItem}>{w.action}</Text>
            ))}
            {deprioritizeItems.length === 0 && (
              <Text style={{ fontSize: 8, color: COLORS.gray400, fontStyle: 'italic' }}>No items</Text>
            )}
          </View>
        </View>
      </View>

      {/* X axis label */}
      <Text style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>LOW EFFORT / HIGH EFFORT</Text>
    </View>
  )
}
