/**
 * AEIntelligence — 1-page React-PDF document for the Salesforce AE.
 *
 * Contains: contact/company info, scores, agent products in play,
 * operations snapshot symptoms as conversation starters, top gaps,
 * recommended next step with talk track opener, and lead tier badge.
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
} from '@/types'

// ─── Colors ──────────────────────────────────────────────────────────────────

const C = {
  primary: '#1d4ed8',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  exploring: '#DC2626',
  building: '#EA580C',
  scaling: '#CA8A04',
  leading: '#16A34A',
  notReady: '#DC2626',
  gettingReady: '#EA580C',
  nearlyReady: '#CA8A04',
  readyToDeploy: '#16A34A',
  // Lead tiers
  nurture: '#6366f1',
  foundation: '#f59e0b',
  implementationReady: '#16a34a',
}

function l1Color(tier: string) {
  switch (tier) {
    case 'Leading': return C.leading
    case 'Scaling': return C.scaling
    case 'Building': return C.building
    default: return C.exploring
  }
}

function l2Color(tier: string) {
  switch (tier) {
    case 'Ready to Deploy': return C.readyToDeploy
    case 'Nearly Ready': return C.nearlyReady
    case 'Getting Ready': return C.gettingReady
    default: return C.notReady
  }
}

// ─── Lead Tier Logic ─────────────────────────────────────────────────────────

type LeadTier = 'Nurture' | 'Foundation Engagement' | 'Implementation Ready'

function determineLeadTier(
  l1Overall: number,
  l2Overall: number | null,
): { tier: LeadTier; color: string } {
  const agentforce = l2Overall ?? 0
  if (l1Overall >= 3.5 && agentforce >= 3.1) {
    return { tier: 'Implementation Ready', color: C.implementationReady }
  }
  if (l1Overall >= 2.5 || agentforce >= 2.1) {
    return { tier: 'Foundation Engagement', color: C.foundation }
  }
  return { tier: 'Nurture', color: C.nurture }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 36,
    paddingVertical: 28,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: C.gray800,
    backgroundColor: C.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.primary,
  },
  headerSub: {
    fontSize: 7,
    color: C.gray500,
    marginTop: 2,
  },
  leadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    color: C.white,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    color: C.gray400,
    marginBottom: 6,
    marginTop: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  fieldLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.gray500,
    width: 70,
  },
  fieldValue: {
    fontSize: 8,
    color: C.gray900,
    flex: 1,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    padding: 8,
    borderRadius: 6,
    backgroundColor: C.gray50,
    borderWidth: 1,
    borderColor: C.gray200,
  },
  scoreNum: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.gray900,
  },
  tierInline: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    color: C.white,
  },
  bullet: {
    fontSize: 8,
    color: C.gray700,
    marginBottom: 3,
    paddingLeft: 8,
    lineHeight: 1.5,
  },
  talkTrack: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 6,
    color: C.gray400,
  },
})

const CLOUD_LABELS: Record<string, string> = {
  SalesCloud: 'Sales Cloud',
  ServiceCloud: 'Service Cloud',
  MarketingCloud: 'Marketing Cloud',
  DataCloud: 'Data Cloud',
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface AEIntelligenceProps {
  assessment: Assessment
  l1Scores: Layer1Scores
  l2Scores: Layer2Scores | null
  productScores: ProductScore[] | null
  narrative: ReportNarrative
  agentforceNarrative: AgentforceNarrative | null
  checkedSymptoms: string[]
}

// ─── Document ────────────────────────────────────────────────────────────────

export function AEIntelligenceDoc({
  assessment,
  l1Scores,
  l2Scores,
  productScores,
  narrative,
  agentforceNarrative,
  checkedSymptoms,
}: AEIntelligenceProps) {
  const isSalesforce = !!assessment.uses_salesforce
  const companyName = assessment.company_name ?? 'Unknown Company'
  const contactName =
    [assessment.contact_first_name, assessment.contact_last_name]
      .filter(Boolean)
      .join(' ') || 'Unknown'
  const lead = determineLeadTier(l1Scores.overall, l2Scores?.overall ?? null)
  const activeClouds = assessment.salesforce_clouds ?? []
  const productClouds = activeClouds.filter((c) => c !== 'DataCloud')

  // Top 3 gaps = 3 lowest-scoring categories
  const sortedCats = [...l1Scores.categories].sort((a, b) => a.raw - b.raw)
  const topGaps = sortedCats.slice(0, 3)

  // Recommended next step
  let nextStep = ''
  let talkTrack = ''
  if (lead.tier === 'Implementation Ready') {
    nextStep = 'Schedule implementation scoping call with IMG'
    talkTrack = `"Based on your assessment results, your organization is well-positioned to move forward with Agentforce. I'd like to connect you with our implementation partner IMG to scope out a deployment plan — would next week work for a 30-minute call?"`
  } else if (lead.tier === 'Foundation Engagement') {
    nextStep = 'Share report and schedule follow-up to discuss foundation gaps'
    talkTrack = `"Your AI readiness report highlights some strong areas and a few gaps worth addressing before deploying agents. I'd like to walk you through the findings — are you available for 20 minutes this week?"`
  } else {
    nextStep = 'Nurture with educational content; revisit in 90 days'
    talkTrack = `"We put together an AI readiness snapshot for ${companyName}. There are some interesting findings I'd love to share — no pressure, just want to make sure you're set up for success as you explore AI."`
  }

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>AE Intelligence Brief</Text>
            <Text style={s.headerSub}>
              {companyName} — {new Date().toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </Text>
          </View>
          <Text style={[s.leadBadge, { backgroundColor: lead.color }]}>
            {lead.tier}
          </Text>
        </View>

        {/* Contact + Company row */}
        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.sectionLabel}>CONTACT</Text>
            <Field label="Name" value={contactName} />
            <Field label="Title" value={assessment.contact_title} />
            <Field label="Email" value={assessment.contact_email} />
            <Field label="Phone" value={assessment.contact_phone} />
          </View>
          <View style={s.col}>
            <Text style={s.sectionLabel}>COMPANY</Text>
            <Field label="Industry" value={assessment.company_industry} />
            <Field label="Size" value={assessment.company_size} />
            <Field label="Revenue" value={assessment.company_revenue} />
            {isSalesforce && (
              <Field label="SF Edition" value={assessment.salesforce_edition} />
            )}
          </View>
        </View>

        {/* Scores row */}
        <View style={[s.row, { marginTop: 8 }]}>
          <View style={s.col}>
            <Text style={s.sectionLabel}>AI MATURITY</Text>
            <View style={s.scoreBadge}>
              <Text style={s.scoreNum}>{l1Scores.overall.toFixed(1)}</Text>
              <Text style={{ fontSize: 8, color: C.gray500 }}>/5</Text>
              <Text style={[s.tierInline, { backgroundColor: l1Color(l1Scores.tier) }]}>
                {l1Scores.tier}
              </Text>
            </View>
          </View>
          {isSalesforce && l2Scores && (
            <View style={s.col}>
              <Text style={s.sectionLabel}>AGENTFORCE READINESS</Text>
              <View style={s.scoreBadge}>
                <Text style={s.scoreNum}>{l2Scores.overall.toFixed(1)}</Text>
                <Text style={{ fontSize: 8, color: C.gray500 }}>/5</Text>
                <Text style={[s.tierInline, { backgroundColor: l2Color(l2Scores.tier) }]}>
                  {l2Scores.tier}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Agent products in play (Salesforce only) */}
        {isSalesforce && productClouds.length > 0 && (
          <View>
            <Text style={s.sectionLabel}>AGENTS IN PLAY</Text>
            {productClouds.map((cloud) => {
              const ps = (productScores ?? []).find((p) => p.cloud === cloud)
              const rec = agentforceNarrative?.agentRecommendations?.[cloud]
              return (
                <View key={cloud} style={{ flexDirection: 'row', marginBottom: 3, gap: 6 }}>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray900, width: 90 }}>
                    {CLOUD_LABELS[cloud] ?? cloud}
                  </Text>
                  {ps && (
                    <Text style={[s.tierInline, { backgroundColor: l2Color(ps.tier) }]}>
                      {ps.tier}
                    </Text>
                  )}
                  {rec && (
                    <Text style={{ fontSize: 7, color: C.gray500 }}>
                      {rec.timeline}
                    </Text>
                  )}
                </View>
              )
            })}
            {l2Scores?.edition_flag && (
              <Text style={{ fontSize: 7, color: C.exploring, marginTop: 2 }}>
                Edition flag: scores capped due to {assessment.salesforce_edition} edition
              </Text>
            )}
            {agentforceNarrative?.dataCloudFlag?.required && (
              <Text style={{ fontSize: 7, color: C.primary, marginTop: 2 }}>
                Data Cloud required — {agentforceNarrative.dataCloudFlag.reason}
              </Text>
            )}
          </View>
        )}

        {/* Operations Snapshot — conversation starters */}
        <View>
          <Text style={s.sectionLabel}>CONVERSATION STARTERS (FROM SNAPSHOT)</Text>
          {checkedSymptoms.length > 0 ? (
            checkedSymptoms.map((symptom, i) => (
              <Text key={i} style={s.bullet}>{'\u2022'} {symptom}</Text>
            ))
          ) : (
            <Text style={{ fontSize: 8, color: C.gray400, fontStyle: 'italic' }}>
              No snapshot symptoms checked
            </Text>
          )}
        </View>

        {/* Top 3 Gaps */}
        <View>
          <Text style={s.sectionLabel}>TOP GAPS (ACCOUNT INTELLIGENCE)</Text>
          {topGaps.map((cat, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 4, gap: 6 }}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray900, width: 120 }}>
                {cat.category}
              </Text>
              <Text style={{ fontSize: 8, color: C.gray500 }}>
                {cat.raw.toFixed(1)}/5
              </Text>
              <Text style={{ fontSize: 8, color: C.gray700, flex: 1 }}>
                {narrative.categories[
                  Object.keys(narrative.categories).find(
                    (k) =>
                      (k === 'AIStrategy' && cat.category === 'AI Strategy') ||
                      (k === 'PeopleAndCulture' && cat.category === 'People & Culture') ||
                      (k === 'DataFoundation' && cat.category === 'Data Foundation') ||
                      (k === 'ProcessReadiness' && cat.category === 'Process Readiness') ||
                      (k === 'RiskAndGovernance' && cat.category === 'Risk & Governance') ||
                      (k === 'AIAgentGovernance' && cat.category === 'AI Agent Governance'),
                  ) as keyof typeof narrative.categories
                ]?.recommendations[0] ?? ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Recommended Next Step */}
        <View>
          <Text style={s.sectionLabel}>RECOMMENDED NEXT STEP</Text>
          <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.gray900, marginBottom: 4 }}>
            {nextStep}
          </Text>
          <View style={s.talkTrack}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.primary, marginBottom: 3 }}>
              SUGGESTED TALK TRACK
            </Text>
            <Text style={{ fontSize: 8, lineHeight: 1.5, color: C.gray700 }}>
              {talkTrack}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Confidential — AE Use Only | IMG Contact: gil@growwithimg.com
          </Text>
          <Text style={s.footerText}>Powered by IMG</Text>
        </View>
      </Page>
    </Document>
  )
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value ?? '—'}</Text>
    </View>
  )
}
