/**
 * ProspectReport — Full React-PDF document for the prospect-facing AI Readiness Report.
 *
 * Pages:
 *   1   Cover (company, respondent, AE, score badges)
 *   2   Understanding AI in 2026 (intro, glossary, why this matters)
 *   3   Executive Summary + Operations Snapshot callout
 *   4   Score Summary — "Your AI Readiness at a Glance" (bar charts, benchmarks, methodology)
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
} from '@/types'

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

function tierFromScore(score: number): string {
  if (score >= 4.1) return 'Leading'
  if (score >= 3.1) return 'Scaling'
  if (score >= 2.1) return 'Building'
  return 'Exploring'
}

// ─── Industry Benchmarks ────────────────────────────────────────────────────

const INDUSTRY_BENCHMARKS: Record<string, Record<string, number>> = {
  'Professional Services': { 'AI Strategy': 2.6, 'People & Culture': 2.9, 'Data Foundation': 2.8, 'Process Readiness': 2.7, 'Risk & Governance': 2.5, 'AI Agent Governance': 2.3 },
  'Consulting': { 'AI Strategy': 2.6, 'People & Culture': 2.9, 'Data Foundation': 2.8, 'Process Readiness': 2.7, 'Risk & Governance': 2.5, 'AI Agent Governance': 2.3 },
  'Legal': { 'AI Strategy': 2.6, 'People & Culture': 2.9, 'Data Foundation': 2.8, 'Process Readiness': 2.7, 'Risk & Governance': 2.5, 'AI Agent Governance': 2.3 },
  'Healthcare': { 'AI Strategy': 2.4, 'People & Culture': 2.7, 'Data Foundation': 2.8, 'Process Readiness': 2.5, 'Risk & Governance': 2.9, 'AI Agent Governance': 2.2 },
  'Life Sciences': { 'AI Strategy': 2.4, 'People & Culture': 2.7, 'Data Foundation': 2.8, 'Process Readiness': 2.5, 'Risk & Governance': 2.9, 'AI Agent Governance': 2.2 },
  'Biotechnology': { 'AI Strategy': 2.4, 'People & Culture': 2.7, 'Data Foundation': 2.8, 'Process Readiness': 2.5, 'Risk & Governance': 2.9, 'AI Agent Governance': 2.2 },
  'Banking & Financial Services': { 'AI Strategy': 3.2, 'People & Culture': 3.0, 'Data Foundation': 3.3, 'Process Readiness': 3.1, 'Risk & Governance': 3.4, 'AI Agent Governance': 2.8 },
  'Insurance': { 'AI Strategy': 3.2, 'People & Culture': 3.0, 'Data Foundation': 3.3, 'Process Readiness': 3.1, 'Risk & Governance': 3.4, 'AI Agent Governance': 2.8 },
  'Manufacturing': { 'AI Strategy': 2.3, 'People & Culture': 2.4, 'Data Foundation': 2.5, 'Process Readiness': 2.7, 'Risk & Governance': 2.3, 'AI Agent Governance': 2.1 },
  'Technology': { 'AI Strategy': 3.5, 'People & Culture': 3.4, 'Data Foundation': 3.5, 'Process Readiness': 3.3, 'Risk & Governance': 3.2, 'AI Agent Governance': 3.0 },
  'Telecommunications': { 'AI Strategy': 3.5, 'People & Culture': 3.4, 'Data Foundation': 3.5, 'Process Readiness': 3.3, 'Risk & Governance': 3.2, 'AI Agent Governance': 3.0 },
  'Retail': { 'AI Strategy': 2.4, 'People & Culture': 2.5, 'Data Foundation': 2.6, 'Process Readiness': 2.5, 'Risk & Governance': 2.3, 'AI Agent Governance': 2.1 },
  'Consumer Goods': { 'AI Strategy': 2.4, 'People & Culture': 2.5, 'Data Foundation': 2.6, 'Process Readiness': 2.5, 'Risk & Governance': 2.3, 'AI Agent Governance': 2.1 },
  'Real Estate': { 'AI Strategy': 2.2, 'People & Culture': 2.3, 'Data Foundation': 2.2, 'Process Readiness': 2.4, 'Risk & Governance': 2.1, 'AI Agent Governance': 2.0 },
  'Construction': { 'AI Strategy': 2.2, 'People & Culture': 2.3, 'Data Foundation': 2.2, 'Process Readiness': 2.4, 'Risk & Governance': 2.1, 'AI Agent Governance': 2.0 },
  'Education': { 'AI Strategy': 2.1, 'People & Culture': 2.3, 'Data Foundation': 2.2, 'Process Readiness': 2.2, 'Risk & Governance': 2.3, 'AI Agent Governance': 1.9 },
  'Non-Profit': { 'AI Strategy': 2.0, 'People & Culture': 2.2, 'Data Foundation': 2.1, 'Process Readiness': 2.1, 'Risk & Governance': 2.2, 'AI Agent Governance': 1.8 },
  'Other': { 'AI Strategy': 2.4, 'People & Culture': 2.5, 'Data Foundation': 2.4, 'Process Readiness': 2.4, 'Risk & Governance': 2.3, 'AI Agent Governance': 2.1 },
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
  ProcessReadiness: 'AI Augments Process \u2014 It Doesn\u2019t Replace It: The most successful AI deployments start with well-documented, repeatable processes. AI agents work best when they have clear rules to follow and defined outcomes to optimize for.',
  RiskAndGovernance: 'The Cost of Moving Fast Without Guardrails: Organizations that deploy AI without governance frameworks face regulatory exposure, reputational risk, and model failures that erode trust. A lightweight governance policy takes weeks to build and can prevent months of remediation.',
  AIAgentGovernance: 'What Makes an Agent Trustworthy: An AI agent that acts autonomously on behalf of your business needs the same controls as any employee \u2014 defined scope, audit trails, escalation paths, and performance accountability. Without these, agents create liability, not leverage.',
}

const AGENTFORCE_SIDEBARS: Record<string, string> = {
  CorePrereqs: 'Why Prerequisites Matter Before Deploying Agentforce: Agentforce agents operate directly inside your Salesforce org \u2014 reading records, triggering automations, and taking action on behalf of your team. Without a strong CRM foundation, clean data, and governance guardrails already in place, agents will amplify existing problems rather than solve them.',
  DataCloud: 'What is Salesforce Data Cloud? Data Cloud is Salesforce\u2019s real-time data platform that unifies customer data from every source \u2014 CRM, website, support, marketing, and third-party systems \u2014 into a single customer profile. It\u2019s the data foundation that makes Agentforce agents smarter and more personalized.',
  SalesCloud: 'What Can an AI Sales Agent Do? Agentforce SDR Agent can autonomously qualify inbound leads, follow up on open opportunities, and surface next best actions for your sales team \u2014 all within Salesforce. The result is faster response times, consistent follow-through, and reps focused on closing rather than admin.',
  ServiceCloud: 'What Can an AI Service Agent Do? Agentforce Service Agent handles routine customer inquiries autonomously across chat, email, and messaging channels \u2014 resolving cases without human intervention and escalating complex issues with full context already captured. Companies deploying service agents report 30\u201340% reduction in handle time.',
  MarketingCloud: 'What Can an AI Marketing Agent Do? Agentforce for Marketing automates audience segmentation, campaign optimization, and personalized journey triggers based on real-time customer behavior. Marketing teams using AI agents report higher engagement rates and significantly reduced time spent on manual campaign management.',
}

// "Why It Matters" closing lines for educational sidebars
const SIDEBAR_CLOSING: Record<string, string> = {
  AIStrategy: 'Organizations without a defined AI strategy spend 3x longer evaluating tools than deploying them.',
  PeopleAndCulture: 'The #1 reason AI initiatives stall is not technology — it is people. Change readiness determines deployment speed.',
  DataFoundation: 'An AI system trained on incomplete data doesn\'t just underperform — it actively misleads. Clean data is not a nice-to-have, it is a prerequisite.',
  ProcessReadiness: 'AI agents follow rules. If your processes are undocumented, your agents will automate the chaos, not fix it.',
  RiskAndGovernance: 'The cost of an AI incident — reputational, regulatory, or operational — far exceeds the cost of a governance framework built before deployment.',
  AIAgentGovernance: 'An agent without an owner is a liability without a name. Accountability must be established before autonomy is granted.',
}

const AGENTFORCE_CLOSING: Record<string, string> = {
  CorePrereqs: 'A Salesforce org that is not ready for automation will not become ready by adding agents. Prerequisites exist for a reason.',
  DataCloud: 'Agentforce agents are only as intelligent as the data they can access. A unified data layer is not optional — it is the foundation.',
  SalesCloud: 'An SDR Agent working from incomplete CRM data will follow up on the wrong leads, miss the right ones, and erode rep trust in the tool within weeks.',
  ServiceCloud: 'A Service Agent deployed without a Knowledge Base is not an agent — it is an expensive escalation machine.',
  MarketingCloud: 'AI-powered personalization requires clean, consented, segmented data. Without it, automation scales irrelevance, not engagement.',
}

// Category accent colors for sidebar borders
const CATEGORY_ACCENT: Record<string, string> = {
  AIStrategy: '#1d4ed8',
  PeopleAndCulture: '#7c3aed',
  DataFoundation: '#0891b2',
  ProcessReadiness: '#059669',
  RiskAndGovernance: '#d97706',
  AIAgentGovernance: '#dc2626',
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
    borderRadius: 6,
    borderWidth: 1,
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
      <Text style={s.footerText}>Confidential — Prepared for {companyName}</Text>
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

/** Horizontal bar with optional benchmark marker for Score Summary page */
function HorizontalBar({
  label,
  score,
  benchmark,
  barWidth = 340,
}: {
  label: string
  score: number
  benchmark?: number
  barWidth?: number
}) {
  const fillWidth = (score / 5) * barWidth
  const tier = tierFromScore(score)
  const color = layer1TierColor(tier)
  const benchmarkPos = benchmark ? (benchmark / 5) * barWidth : 0

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.gray800 }}>{label}</Text>
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color }}>{score.toFixed(1)}/5</Text>
      </View>
      <View style={{ width: barWidth, height: 12, backgroundColor: COLORS.gray200, borderRadius: 6, position: 'relative' }}>
        <View style={{ width: fillWidth, height: 12, backgroundColor: color, borderRadius: 6 }} />
        {benchmark != null && benchmark > 0 && (
          <View style={{
            position: 'absolute',
            left: benchmarkPos - 1,
            top: -2,
            width: 2,
            height: 16,
            backgroundColor: COLORS.gray700,
          }} />
        )}
      </View>
      {benchmark != null && benchmark > 0 && (
        <Text style={{ fontSize: 7, color: COLORS.gray400, marginTop: 1 }}>
          Industry avg: {benchmark.toFixed(1)}
        </Text>
      )}
    </View>
  )
}

// ─── Category labels ─────────────────────────────────────────────────────────

const CATEGORY_KEYS = [
  'AIStrategy',
  'PeopleAndCulture',
  'DataFoundation',
  'ProcessReadiness',
  'RiskAndGovernance',
  'AIAgentGovernance',
] as const

const CATEGORY_LABELS: Record<string, string> = {
  AIStrategy: 'AI Strategy',
  PeopleAndCulture: 'People & Culture',
  DataFoundation: 'Data Foundation',
  ProcessReadiness: 'Process Readiness',
  RiskAndGovernance: 'Risk & Governance',
  AIAgentGovernance: 'AI Agent Governance',
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
  layer1QuestionCount?: number
  layer2QuestionCount?: number
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
  layer1QuestionCount = 0,
  layer2QuestionCount = 0,
}: ProspectReportProps) {
  const isSalesforce = !!assessment.uses_salesforce
  const companyName = assessment.company_name ?? 'Your Company'
  const respondentName =
    [assessment.contact_first_name, assessment.contact_last_name]
      .filter(Boolean)
      .join(' ') || 'Respondent'
  const respondentTitle = assessment.contact_title ?? ''
  const aeName = assessment.ae_name ?? 'Your Account Executive'
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
          {respondentName}{respondentTitle ? ` — ${respondentTitle}` : ''}
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
                {l2Scores.tier}
              </Text>
            </View>
          )}
        </View>
      </Page>

      {/* ── PAGE 2: Understanding AI in 2026 ──────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>REPORT INTRODUCTION</Text>
        <Text style={s.sectionTitle}>Understanding AI in 2026</Text>

        {/* ── THE AI LANDSCAPE ── */}
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 8 }}>
          The AI Landscape
        </Text>
        <Text style={[s.bodyText, { marginBottom: 20 }]}>
          AI has moved beyond experimentation. In 2026, the organizations gaining competitive advantage are not
          the ones running pilots — they are the ones deploying AI agents that take autonomous action on behalf
          of the business. Across every industry, the conversation has shifted from &quot;should we use AI?&quot;
          to &quot;how quickly can we operationalize it?&quot; The gap between companies that treat AI as
          infrastructure and those still exploring it is widening rapidly — and that gap directly impacts
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
            — IMG AI READINESS RESEARCH, 2026
          </Text>
        </View>

        {/* ── Divider ── */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.gray200, marginBottom: 16 }} />

        {/* ── KEY TERMINOLOGY ── */}
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 12 }}>
          Key Terminology
        </Text>

        {[
          ['Artificial Intelligence (AI)', 'Software systems that perform tasks that typically require human intelligence — pattern recognition, decision-making, language understanding, and prediction. Modern AI learns from data rather than following rigid rules.'],
          ['Large Language Model (LLM)', 'The technology behind tools like ChatGPT, Claude, and Copilot. LLMs are trained on vast amounts of text and can generate, summarize, translate, and reason about language at a human level. They are the foundation of most modern AI assistants and agents.'],
          ['AI Agent', 'An AI system that can take autonomous action — not just answer questions, but execute tasks, make decisions, and interact with systems on behalf of a user or organization. Agents can be given a goal and work through multiple steps to achieve it without constant human direction.'],
          ['Agentforce', "Salesforce's native AI agent platform. Agentforce agents live inside your Salesforce org and can autonomously handle sales follow-up, customer service inquiries, and marketing actions using your actual CRM data — without switching tools or systems."],
          ['Prompt', "The instruction or question given to an AI model. The quality and specificity of a prompt directly affects the quality of the AI's output. Organizations that develop internal prompt standards see more consistent and reliable AI results."],
          ['Retrieval-Augmented Generation (RAG)', "A technique that allows AI models to pull from a specific knowledge base — your company's documents, policies, or data — rather than relying solely on general training. RAG makes AI outputs more accurate, relevant, and grounded in your actual business context."],
          ['Einstein Trust Layer', "Salesforce's built-in security and compliance framework for AI. It ensures that data sent to AI models is masked, not retained by third parties, and auditable — giving IT and legal teams confidence that AI operates within established guardrails."],
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
          stands today — not to sell a specific technology, but to identify the gaps and opportunities that
          will determine how effectively you can compete in an AI-enabled market. The findings and
          recommendations that follow are grounded in your actual responses, benchmarked against industry
          standards, and structured to drive action. IMG serves as a guide through this landscape — helping
          you see what matters, what to prioritize, and where to start.
        </Text>

        <PageFooter companyName={companyName} />
      </Page>

      {/* ── PAGE 3: Executive Summary + Operations Snapshot ──────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>EXECUTIVE SUMMARY</Text>
        <Text style={s.sectionTitle}>Executive Summary</Text>
        <Text style={s.bodyText}>{narrative.executiveSummary}</Text>

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

      {/* ── PAGE 4: Score Summary — "Your AI Readiness at a Glance" ──── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>SCORE SUMMARY</Text>
        <Text style={s.sectionTitle}>Your AI Readiness at a Glance</Text>

        {/* Overall score prominently displayed */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
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

        {/* Section A: General AI Maturity bars */}
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 12 }}>
          General AI Maturity
        </Text>

        {l1Scores.categories.map((cat) => (
          <HorizontalBar
            key={cat.category}
            label={cat.category}
            score={cat.raw}
            benchmark={benchmarks?.[cat.category]}
            barWidth={340}
          />
        ))}

        {/* Tier legend */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 }}>
          {[
            { label: 'Exploring (1-2)', color: COLORS.exploring },
            { label: 'Building (2.1-3)', color: COLORS.building },
            { label: 'Scaling (3.1-4)', color: COLORS.scaling },
            { label: 'Leading (4.1-5)', color: COLORS.leading },
          ].map((t) => (
            <View key={t.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.color }} />
              <Text style={{ fontSize: 7, color: COLORS.gray500 }}>{t.label}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 8, height: 2, backgroundColor: COLORS.gray700 }} />
            <Text style={{ fontSize: 7, color: COLORS.gray500 }}>Industry Avg</Text>
          </View>
        </View>

        {/* Section B: Agentforce Readiness (Salesforce only) */}
        {isSalesforce && l2Scores && (
          <>
            <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.gray200, marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
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

            {l2Scores.edition_flag && (
              <View style={{ backgroundColor: COLORS.amberLight, borderRadius: 4, padding: 8, marginBottom: 12 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.amberDark }}>
                  Edition flag: {assessment.salesforce_edition} — scores capped at 2.5
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
          borderRadius: 6,
          padding: 14,
          marginTop: 20,
        }}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 6 }}>
            About This Assessment
          </Text>
          <Text style={{ fontSize: 9, lineHeight: 1.6, color: COLORS.gray700 }}>
            This report is based on {layer1QuestionCount} scored responses across 6 dimensions of AI readiness
            {isSalesforce && layer2QuestionCount > 0
              ? `, plus ${layer2QuestionCount} Agentforce-specific questions across ${(activeClouds.filter(c => c !== 'DataCloud').length || 0) + 2} sections`
              : ''
            }. Each question was scored on a 1–5 scale:{'\n\n'}
            1 = No awareness or capability{'\n'}
            2 = Early / ad hoc{'\n'}
            3 = In development / inconsistent{'\n'}
            4 = Mostly in place{'\n'}
            5 = Fully implemented / leading practice{'\n\n'}
            Category scores represent the average of all responses within that dimension. The Overall AI Maturity score is a weighted composite: AI Strategy (20%), People and Culture (20%), Data Foundation (20%), Process Readiness (20%), Risk and Governance (10%), AI Agent Governance (10%). Industry benchmarks reflect aggregate data from assessments conducted across similar organizations.
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
                Industry Average ({industryLabel}): {benchmarkScore.toFixed(1)} — You scored {diffLabel}
              </Text>
            )}

            <Text style={[s.bodyText, { marginBottom: 20 }]}>{catNarrative.summary}</Text>

            <Text style={[s.sectionLabel, { marginBottom: 12 }]}>RECOMMENDATIONS</Text>
            {catNarrative.recommendations.map((rec, i) => (
              <View key={i} style={s.recItem}>
                <Text style={s.recNumber}>{i + 1}</Text>
                <Text style={[s.bodyText, { flex: 1 }]}>{rec}</Text>
              </View>
            ))}

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

      {/* ── PAGES 13-15: Agentforce Section (Salesforce only) ─────────── */}
      {isSalesforce && agentforceNarrative && l2Scores && (
        <>
          {/* Agentforce Executive Summary */}
          <Page size="LETTER" style={s.page}>
            <Text style={s.sectionLabel}>AGENTFORCE READINESS</Text>
            <Text style={s.sectionTitle}>Agentforce Executive Summary</Text>

            {/* Stage-Gate Deployment Model callout */}
            <View style={{
              backgroundColor: '#FFF7ED',
              borderLeftWidth: 4,
              borderLeftColor: '#EA580C',
              borderRadius: 6,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.gray900, marginBottom: 10 }}>
                The IMG Agentforce Deployment Model
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                {/* VALIDATE */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#EA580C', marginBottom: 4 }}>
                    VALIDATE
                  </Text>
                  <Text style={{ fontSize: 8, lineHeight: 1.4, color: COLORS.gray500 }}>
                    Confirm your Salesforce foundation meets Agentforce prerequisites — edition, data completeness, automation maturity, and trust layer readiness.
                  </Text>
                </View>
                {/* Arrow */}
                <Text style={{ fontSize: 16, color: COLORS.gray400, paddingHorizontal: 6, paddingTop: 2 }}>
                  {'\u2192'}
                </Text>
                {/* PILOT */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#EA580C', marginBottom: 4 }}>
                    PILOT
                  </Text>
                  <Text style={{ fontSize: 8, lineHeight: 1.4, color: COLORS.gray500 }}>
                    Deploy one agent in a controlled environment with defined success metrics, a named owner, and a documented escalation path.
                  </Text>
                </View>
                {/* Arrow */}
                <Text style={{ fontSize: 16, color: COLORS.gray400, paddingHorizontal: 6, paddingTop: 2 }}>
                  {'\u2192'}
                </Text>
                {/* SCALE */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#EA580C', marginBottom: 4 }}>
                    SCALE
                  </Text>
                  <Text style={{ fontSize: 8, lineHeight: 1.4, color: COLORS.gray500 }}>
                    Expand based on measured outcomes — task success rate, time saved, CSAT improvement — not assumption or vendor pressure.
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

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={[s.badge, { backgroundColor: COLORS.gray100 }]}>
                <Text style={[s.badgeLabel, { color: COLORS.gray500 }]}>
                  AGENTFORCE READINESS INDEX
                </Text>
                <Text style={[s.badgeScore, { color: COLORS.gray900 }]}>
                  {l2Scores.overall.toFixed(1)}/5
                </Text>
                <TierBadge tier={l2Scores.tier} color={layer2TierColor(l2Scores.tier)} />
              </View>
            </View>

            <Text style={s.bodyText}>
              {agentforceNarrative.agentforceExecutiveSummary}
            </Text>

            {agentforceNarrative.editionFlag && (
              <View style={[s.editionCallout, { marginTop: 16 }]}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.amberDark, marginBottom: 4 }}>
                  Edition Limitation — {assessment.salesforce_edition}
                </Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5, color: COLORS.amberDark }}>
                  {agentforceNarrative.editionFlag}
                </Text>
              </View>
            )}

            {agentforceNarrative.dataCloudFlag && (
              <View style={[s.dataCloudCallout, { marginTop: agentforceNarrative.editionFlag ? 0 : 16 }]}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.blueDark, marginBottom: 4 }}>
                  Data Cloud: {agentforceNarrative.dataCloudFlag.required ? 'Required' : 'Optional'}
                </Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5, color: COLORS.blueDark }}>
                  {agentforceNarrative.dataCloudFlag.reason}
                </Text>
                <Text style={{ fontSize: 8, color: '#3b82f6', marginTop: 4 }}>
                  Recommended phase: {agentforceNarrative.dataCloudFlag.phase}
                </Text>
              </View>
            )}

            <PageFooter companyName={companyName} />
          </Page>

          {/* Per-product recommendations */}
          {productClouds.length > 0 && (
            <Page size="LETTER" style={s.page}>
              <Text style={s.sectionLabel}>AGENT RECOMMENDATIONS</Text>
              <Text style={s.sectionTitle}>Product-Level Readiness</Text>

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
                          <TierBadge tier={ps.tier} color={layer2TierColor(ps.tier)} />
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 6 }}>
                        <Text style={{ fontSize: 9, color: COLORS.gray500 }}>
                          <Text style={{ fontFamily: 'Helvetica-Bold' }}>Timeline: </Text>
                          {rec.timeline}
                        </Text>
                      </View>

                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray500, marginBottom: 4 }}>
                        Prerequisites:
                      </Text>
                      {rec.conditions.map((cond, i) => (
                        <Text key={i} style={{ fontSize: 9, color: COLORS.gray700, marginBottom: 2, paddingLeft: 8 }}>
                          {'\u2022'} {cond}
                        </Text>
                      ))}

                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.gray500, marginTop: 6, marginBottom: 2 }}>
                        Expected Outcome:
                      </Text>
                      <Text style={{ fontSize: 9, color: COLORS.gray700 }}>
                        {rec.expectedOutcome}
                      </Text>
                    </View>
                  </View>
                )
              })}

              <PageFooter companyName={companyName} />
            </Page>
          )}

          {/* Phased Implementation Roadmap */}
          {agentforceNarrative.implementationRoadmap && (
            <Page size="LETTER" style={s.page}>
              <Text style={s.sectionLabel}>IMPLEMENTATION ROADMAP</Text>
              <Text style={s.sectionTitle}>Phased Agentforce Deployment</Text>

              <Text style={[s.bodyText, { marginBottom: 20 }]}>
                IMG serves as your implementation partner throughout each phase, ensuring
                successful deployment and measurable outcomes at every milestone.
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

      {/* ── Final Page: Next Steps ─────────────────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>NEXT STEPS</Text>
        <Text style={s.sectionTitle}>Moving Forward</Text>

        <Text style={[s.bodyText, { marginBottom: 10 }]}>
          Your scores are not a verdict — they are a starting point. Every gap identified in this report is an opportunity to build the foundation that makes AI work for your business. The organizations that move deliberately, with the right implementation partner, consistently outperform those that move fast without direction.
        </Text>

        <Text style={[s.bodyText, { marginBottom: 16 }]}>
          IMG works with organizations at every stage of AI readiness — from foundation-building to full Agentforce deployment. Your Salesforce AE can connect you with an IMG specialist to review this report and build a deployment plan tailored to your timeline and goals.
        </Text>

        <View style={s.ctaBox}>
          <Text style={s.ctaBold}>Ready to take the next step?</Text>
          <Text style={s.ctaText}>
            {isSalesforce
              ? 'Your Salesforce AE can connect you with an IMG Agentforce implementation specialist to review this report and build a detailed deployment plan.'
              : 'The IMG team can help you translate these findings into a concrete implementation roadmap tailored to your organization.'}
          </Text>
          <Text style={[s.ctaText, { marginTop: 16, fontFamily: 'Helvetica-Bold', color: COLORS.white }]}>
            Contact: gil@growwithimg.com
          </Text>
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
      {/* Axis label */}
      <Text style={{ fontSize: 7, color: COLORS.gray400, marginBottom: 4, textAlign: 'center' }}>
        {'\u2191'} HIGH IMPACT
      </Text>

      <View style={[s.gridRow, { marginBottom: 8 }]}>
        {/* Quick Wins (Low Effort, High Impact) */}
        <View style={[s.gridCell, { borderColor: '#86efac', backgroundColor: COLORS.greenLight }]}>
          <Text style={[s.gridLabel, { color: COLORS.greenDark }]}>Quick Wins</Text>
          <Text style={s.gridSubtitle}>Low Effort / High Impact</Text>
          {topQuickWins.map((w, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={[s.gridItem, { fontFamily: 'Helvetica-Bold' }]}>
                {'\u2022'} {w.action}
              </Text>
              <Text style={{ fontSize: 7, color: COLORS.gray500, paddingLeft: 16 }}>
                {w.timeline}
              </Text>
            </View>
          ))}
          {topQuickWins.length === 0 && (
            <Text style={{ fontSize: 8, color: COLORS.gray400, fontStyle: 'italic' }}>No items</Text>
          )}
        </View>

        {/* Strategic Bets (High Effort, High Impact) */}
        <View style={[s.gridCell, { borderColor: '#93c5fd', backgroundColor: COLORS.blueLight }]}>
          <Text style={[s.gridLabel, { color: COLORS.blueDark }]}>Strategic Bets</Text>
          <Text style={s.gridSubtitle}>High Effort / High Impact</Text>
          {topStrategic.map((w, i) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <Text style={[s.gridItem, { fontFamily: 'Helvetica-Bold' }]}>
                {'\u2022'} {w.action}
              </Text>
              <Text style={{ fontSize: 7, color: COLORS.gray500, paddingLeft: 16 }}>
                {w.timeline}
              </Text>
            </View>
          ))}
          {topStrategic.length === 0 && (
            <Text style={{ fontSize: 8, color: COLORS.gray400, fontStyle: 'italic' }}>No items</Text>
          )}
        </View>
      </View>

      <View style={s.gridRow}>
        {/* Fill-Ins (Low Effort, Low Impact) */}
        <View style={[s.gridCell, { borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 }]}>
          <Text style={[s.gridLabel, { color: COLORS.gray700 }]}>Fill-Ins</Text>
          <Text style={s.gridSubtitle}>Low Effort / Low Impact</Text>
          {fillInItems.map((w, i) => (
            <Text key={i} style={s.gridItem}>{'\u2022'} {w.action}</Text>
          ))}
          {fillInItems.length === 0 && (
            <Text style={{ fontSize: 8, color: COLORS.gray400, fontStyle: 'italic' }}>No items</Text>
          )}
        </View>

        {/* Deprioritize (High Effort, Low Impact) */}
        <View style={[s.gridCell, { borderColor: '#fca5a5', backgroundColor: COLORS.redLight }]}>
          <Text style={[s.gridLabel, { color: COLORS.redDark }]}>Deprioritize</Text>
          <Text style={s.gridSubtitle}>High Effort / Low Impact</Text>
          {deprioritizeItems.map((w, i) => (
            <Text key={i} style={s.gridItem}>{'\u2022'} {w.action}</Text>
          ))}
          {deprioritizeItems.length === 0 && (
            <Text style={{ fontSize: 8, color: COLORS.gray400, fontStyle: 'italic' }}>No items</Text>
          )}
        </View>
      </View>

      {/* Axis label */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ fontSize: 7, color: COLORS.gray400 }}>{'\u2190'} LOW EFFORT</Text>
        <Text style={{ fontSize: 7, color: COLORS.gray400 }}>HIGH EFFORT {'\u2192'}</Text>
      </View>
    </View>
  )
}
