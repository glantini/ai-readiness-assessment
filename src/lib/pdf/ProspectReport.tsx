/**
 * ProspectReport — Full React-PDF document for the prospect-facing AI Readiness Report.
 *
 * Pages:
 *   1   Cover (company, respondent, AE, score badges)
 *   2   Understanding AI in 2026 (intro, glossary, why this matters)
 *   3   Executive Summary
 *   4   Critical Gap
 *   5-10 Category Findings (one per page)
 *  11   Quick Wins vs Long-Term Investments
 *  12-14 Agentforce section (Salesforce only)
 *  15   Phased Implementation Roadmap (Salesforce only)
 *  16   Next Steps
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
}

// ─── Document ────────────────────────────────────────────────────────────────

export function ProspectReport({
  assessment,
  l1Scores,
  l2Scores,
  productScores,
  narrative,
  agentforceNarrative,
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

      {/* ── PAGE 3: Executive Summary ──────────────────────────────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>EXECUTIVE SUMMARY</Text>
        <Text style={s.sectionTitle}>Your AI Readiness at a Glance</Text>
        <Text style={s.bodyText}>{narrative.executiveSummary}</Text>

        <View style={{ marginTop: 24 }}>
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

      {/* ── PAGE 3: Critical Gap ───────────────────────────────────────── */}
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

      {/* ── PAGES 4-9: Category Findings (one per page) ────────────────── */}
      {CATEGORY_KEYS.map((key) => {
        const catNarrative = narrative.categories[key]
        if (!catNarrative) return null
        const label = CATEGORY_LABELS[key] ?? key
        const l1Cat = l1Scores.categories.find((c) => c.category === label)
        const score = l1Cat?.raw ?? 0
        const tier =
          score >= 4.1 ? 'Leading'
          : score >= 3.1 ? 'Scaling'
          : score >= 2.1 ? 'Building'
          : 'Exploring'

        return (
          <Page key={key} size="LETTER" style={s.page}>
            <Text style={s.sectionLabel}>CATEGORY ASSESSMENT</Text>

            <View style={s.categoryHeader}>
              <Text style={s.categoryName}>{label}</Text>
              <View style={s.scoreContainer}>
                <Text style={s.scoreText}>{score.toFixed(1)}/5</Text>
                <ScoreBar score={score} />
                <TierBadge tier={tier} color={layer1TierColor(tier)} />
              </View>
            </View>

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

      {/* ── PAGE 10: Quick Wins vs Long-Term Investments ────────────────── */}
      <Page size="LETTER" style={s.page}>
        <Text style={s.sectionLabel}>PRIORITIZATION MATRIX</Text>
        <Text style={s.sectionTitle}>Quick Wins vs Long-Term Investments</Text>

        <QuickWinsGrid quickWins={narrative.quickWins} />

        <PageFooter companyName={companyName} />
      </Page>

      {/* ── PAGES 11-13: Agentforce Section (Salesforce only) ──────────── */}
      {isSalesforce && agentforceNarrative && l2Scores && (
        <>
          {/* Agentforce Executive Summary */}
          <Page size="LETTER" style={s.page}>
            <Text style={s.sectionLabel}>AGENTFORCE READINESS</Text>
            <Text style={s.sectionTitle}>Agentforce Executive Summary</Text>

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

                return (
                  <View key={cloud} style={s.agentCard}>
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

        <Text style={[s.bodyText, { marginBottom: 16 }]}>
          This report provides a snapshot of where {companyName} stands today. The
          recommendations above are designed to be actionable — whether you start
          with quick wins or invest in longer-term foundation work, every step
          moves your organization closer to AI-driven operations.
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
