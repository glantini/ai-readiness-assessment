/**
 * Shared helpers for AI narrative generation.
 *
 * Used by:
 *   - /app/actions/generateReport.ts   (server action, non-streaming)
 *   - /app/api/reports/[id]/generate   (streaming SSE route handler)
 */

import type {
  Assessment,
  Layer1Scores,
  Layer2Scores,
  ProductScore,
  ReportNarrative,
  AgentforceNarrative,
} from '@/types'
import { snapshotQuestions } from '@/lib/questions/snapshot'
import { layer1Questions } from '@/lib/questions/layer1'

// ─── System prompt ────────────────────────────────────────────────────────────

export const REPORT_SYSTEM_PROMPT = `You are a senior AI strategy advisor writing a confidential readiness report for a business leader. Tone: professional, direct, practical. No vendor language. No filler phrases. Write as the most credible advisor in the room. Be specific, reference the company's industry, size, and stated motivations throughout. A 50-person professional services firm and a 500-person manufacturer at the same score have fundamentally different implementation realities. Reflect that. Never reference a specific fiscal year. Use "this fiscal year" or "the next 90 days" instead of naming a year. Never use em dashes in any output. Use commas, colons, or periods instead.

For every recommendation, provide specific how-to guidance including named tools, concrete steps, and measurable thresholds where relevant. Never give generic advice. A recommendation without implementation detail is not useful to a business leader. Examples of good how-to guidance by category:

Data Foundation: Name specific tools (Cloudingo, ZoomInfo, Clearbit), specific Salesforce reports to run (Duplicate Records report), specific field completion thresholds to target (aim for less than 20% null rate on Contact email, phone, and title fields).

Process Readiness: Reference specific process documentation formats (SIPOC diagrams, swimlane flowcharts), specific Salesforce tools (Flow Builder, Process Builder), specific metrics to measure (what percentage of cases are manually routed vs auto-routed).

AI Strategy: Reference specific budget ranges for AI pilots, specific ROI calculation approaches (time-to-value analysis, hours saved per week multiplied by fully-loaded labor cost), specific steering committee cadences.

People and Culture: Reference specific training resources (Salesforce Trailhead AI modules, LinkedIn Learning AI courses), specific change management frameworks (ADKAR), specific ways to identify AI champions within a team.

AI Policies: Reference specific policy frameworks (NIST AI Risk Management Framework, ISO 42001), specific Salesforce tools (Einstein Trust Layer settings, permission sets, field-level security), specific incident response components to define.

Agent Controls: Reference specific Salesforce tools (Agent Builder, permission sets, audit logs), specific metrics to track per agent (task success rate, escalation rate, user satisfaction score), specific stage-gate criteria for moving from sandbox to pilot to production.

Always tie the why-it-matters to the company's specific industry, size, and stated primary motivation. A 50-person professional services firm and a 500-person manufacturer at the same score need fundamentally different implementation guidance. Never use em dashes in any output. Use commas, colons, or periods instead.`

// ─── Helpers ──────────────────────────────────────────────────────────────────

export interface LowestQuestion {
  text: string
  category: string
  score: number
}

/**
 * Given a map of question_id → score (1–5), find the question with the lowest score.
 * Ties broken by order in layer1Questions array (first occurrence wins).
 */
export function findLowestQuestion(
  layer1ResponseMap: Record<string, number>,
): LowestQuestion {
  let lowest: LowestQuestion = { text: 'Unknown', category: 'Unknown', score: 5 }

  for (const q of layer1Questions) {
    const score = layer1ResponseMap[q.id]
    if (score != null && score < lowest.score) {
      lowest = {
        text: q.text,
        category: q.category ?? 'Unknown',
        score,
      }
    }
  }

  return lowest
}

/**
 * Map snapshot responses (Record<question_id, boolean>) to checked symptom texts.
 */
export function getCheckedSymptoms(
  snapshotResponseMap: Record<string, boolean>,
): string[] {
  return snapshotQuestions
    .filter((q) => snapshotResponseMap[q.id] === true)
    .map((q) => q.text)
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

export function buildReportPrompt(
  assessment: Assessment,
  l1: Layer1Scores,
  l2: Layer2Scores | null,
  productScores: ProductScore[] | null,
  checkedSymptoms: string[],
  lowestQuestion: LowestQuestion,
): string {
  const isSalesforce = !!assessment.uses_salesforce
  const activeClouds = assessment.salesforce_clouds ?? []
  const productClouds = activeClouds.filter((c) => c !== 'DataCloud')

  // ── Layer 1 category scores ────────────────────────────────────────────────
  const catScoreLines = l1.categories
    .map((c) => `  - ${c.category}: ${c.raw.toFixed(1)}/5`)
    .join('\n')

  // ── Snapshot symptoms ──────────────────────────────────────────────────────
  const snapshotText =
    checkedSymptoms.length > 0
      ? checkedSymptoms.map((s) => `  - ${s}`).join('\n')
      : '  None checked'

  // ── Salesforce + Agentforce section ───────────────────────────────────────
  let salesforceSection = ''
  if (isSalesforce && l2) {
    const sectionLines = l2.sections
      .map((s) => `  - ${s.section}: ${s.raw.toFixed(1)}/5`)
      .join('\n')

    const productLines =
      (productScores ?? []).length > 0
        ? (productScores ?? [])
            .map((p) => `  - ${p.cloud}: ${p.score.toFixed(1)}/5, ${p.tier}`)
            .join('\n')
        : '  No product clouds selected'

    salesforceSection = `

SALESFORCE CONTEXT:
- Edition: ${assessment.salesforce_edition ?? 'Unknown'}
- Active Clouds: ${activeClouds.length > 0 ? activeClouds.join(', ') : 'None specified'}

AGENTFORCE READINESS (Layer 2):
- Overall: ${l2.overall.toFixed(1)}/5, ${l2.tier}${l2.edition_flag ? ' ⚠️ Edition cap applied (capped at 2.5 due to edition)' : ''}
Section scores:
${sectionLines}

PER-PRODUCT AGENT SCORES:
${productLines}`
  }

  // ── Block 2 schema example (dynamic per active product clouds) ────────────
  let block2Template = 'BLOCK 2: Not required, client does not use Salesforce.'
  if (isSalesforce) {
    const agentRecs = productClouds
      .map((c) => {
        const ps = (productScores ?? []).find((p) => p.cloud === c)
        return `    "${c}": {
      "agentName": "Specific Agentforce agent name for ${c}",
      "readinessTier": "${ps?.tier ?? 'Not Ready'}",
      "timeline": "Realistic deployment timeline based on scores",
      "conditions": ["First prerequisite condition that must be met", "Second prerequisite condition"],
      "expectedOutcome": "Specific measurable business outcome after deployment"
    }`
      })
      .join(',\n')

    const editionFlagValue =
      assessment.salesforce_edition === 'Pro' ||
      assessment.salesforce_edition === 'Starter'
        ? '"Specific, direct note about this edition constraint and the upgrade path required"'
        : 'null'

    block2Template = `BLOCK 2 (required, this client uses Salesforce):
\`\`\`json
{
  "agentforceExecutiveSummary": "3–4 sentence Agentforce-specific executive summary grounded in this company's specific scores and clouds",
  "editionFlag": ${editionFlagValue},
  "dataCloudFlag": {
    "required": true,
    "reason": "Explain why Data Cloud is or is not a prerequisite given their specific scores and use case",
    "phase": "Specify when in the roadmap Data Cloud should be addressed"
  },
  "agentRecommendations": {
${agentRecs.length > 0 ? agentRecs : '    // No product clouds selected'}
  },
  "implementationRoadmap": {
    "phase1": {
      "title": "Foundation phase title",
      "duration": "0–60 days",
      "actions": ["Specific foundation action 1", "Specific foundation action 2", "Specific foundation action 3"]
    },
    "phase2": {
      "title": "First agent deployment",
      "duration": "60–120 days",
      "agent": "Which agent to deploy first and exactly why given their scores",
      "outcome": "Specific measurable outcome after first agent deployment"
    },
    "phase3": {
      "title": "Expansion",
      "duration": "120–180 days",
      "expansion": "Which additional agents or capabilities to expand to, and in what order"
    }
  }
}
\`\`\``
  }

  return `ASSESSMENT PROFILE:
- Company: ${assessment.company_name ?? 'Unknown'}
- Industry: ${assessment.company_industry ?? 'Unknown'}
- Company Size: ${assessment.company_size ?? 'Unknown'}
- Respondent Title: ${assessment.contact_title ?? 'Unknown'}
- Primary AI Motivation: ${assessment.ai_motivation ?? 'Unknown'}
- Current AI Usage Level: ${assessment.ai_current_usage ?? 'Unknown'}

OPERATIONS SNAPSHOT (self-identified pain points):
${snapshotText}

AI MATURITY SCORES (Layer 1):
- Overall: ${l1.overall.toFixed(1)}/5, ${l1.tier}
Category scores:
${catScoreLines}

LOWEST SCORING INDIVIDUAL QUESTION:
"${lowestQuestion.text}"
Score: ${lowestQuestion.score.toFixed(1)}/5 | Category: ${lowestQuestion.category}
${salesforceSection}

---

Generate the assessment report as ${isSalesforce ? 'two' : 'one'} JSON code block${isSalesforce ? 's' : ''}.

BLOCK 1 (required for all respondents):
\`\`\`json
{
  "executiveSummary": "3–4 sentence executive summary. Specific to this company, industry, and motivation. No generic phrases.",
  "criticalGap": {
    "area": "The single category or capability most urgently blocking AI progress",
    "finding": "2-3 sentence specific finding about what is weak or missing and why it matters for this company",
    "recommendation": "The one concrete action leadership should take first to close this gap",
    "impactIfUnaddressed": "2-3 sentences describing the specific business consequences if this gap is not closed in the next 6-12 months. Reference their industry and competitive landscape.",
    "immediateNextStep": "One concrete, specific action the prospect can take this week to begin closing this gap. Make it actionable and time-bound."
  },
  "quickWins": [
    { "action": "Specific action this company can take in the near term", "effort": "Low", "impact": "High", "timeline": "2–4 weeks" },
    { "action": "Second quick win specific to their situation", "effort": "Low", "impact": "Medium", "timeline": "1 month" },
    { "action": "Third quick win with medium effort but high payoff", "effort": "Medium", "impact": "High", "timeline": "6–8 weeks" }
  ],
  "categories": {
    "AIStrategy": {
      "context": "2-3 sentences personalized to the company's industry and size, explaining what this category means for their specific situation and why it matters right now.",
      "summary": "2-3 sentences on what this company's AI Strategy score reveals. Be specific to their industry and motivation.",
      "recommendations": [
        { "action": "Short headline of what to do", "howTo": "Specific steps, named tools, concrete examples, measurable thresholds. 3-5 sentences minimum.", "whyItMatters": "1-2 sentences tied specifically to their industry, size, and stated motivation" },
        { "action": "Second recommendation headline", "howTo": "Specific implementation steps with named tools and measurable targets. 3-5 sentences minimum.", "whyItMatters": "1-2 sentences tied to their specific context" }
      ]
    },
    "PeopleAndCulture": { "context": "2-3 sentences personalized context...", "summary": "...", "recommendations": [{ "action": "...", "howTo": "...", "whyItMatters": "..." }, { "action": "...", "howTo": "...", "whyItMatters": "..." }] },
    "DataFoundation": { "context": "2-3 sentences personalized context...", "summary": "...", "recommendations": [{ "action": "...", "howTo": "...", "whyItMatters": "..." }, { "action": "...", "howTo": "...", "whyItMatters": "..." }] },
    "ProcessReadiness": { "context": "2-3 sentences personalized context...", "summary": "...", "recommendations": [{ "action": "...", "howTo": "...", "whyItMatters": "..." }, { "action": "...", "howTo": "...", "whyItMatters": "..." }] },
    "AIPolicies": { "context": "2-3 sentences personalized context...", "summary": "...", "recommendations": [{ "action": "...", "howTo": "...", "whyItMatters": "..." }, { "action": "...", "howTo": "...", "whyItMatters": "..." }] },
    "AgentControls": { "context": "2-3 sentences personalized context...", "summary": "...", "recommendations": [{ "action": "...", "howTo": "...", "whyItMatters": "..." }, { "action": "...", "howTo": "...", "whyItMatters": "..." }] }
  }
}
\`\`\`

${block2Template}

Return ONLY the JSON code blocks. No explanatory text before, between, or after them.`
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

export interface ParsedNarratives {
  block1: ReportNarrative | null
  block2: AgentforceNarrative | null
  rawText: string
}

/**
 * Extract the two JSON blocks from Claude's response.
 * Robust to extra whitespace and varied fence styles.
 */
export function parseNarrativeBlocks(fullText: string): ParsedNarratives {
  const jsonPattern = /```(?:json)?\s*([\s\S]*?)```/g
  const captured: string[] = []
  let m: RegExpExecArray | null
  while ((m = jsonPattern.exec(fullText)) !== null) {
    captured.push(m[1].trim())
  }

  let block1: ReportNarrative | null = null
  let block2: AgentforceNarrative | null = null

  console.log('[reportGeneration] Parsing narrative blocks:', {
    rawTextLength: fullText.length,
    jsonBlocksFound: captured.length,
    block1Length: captured[0]?.length ?? 0,
    block2Length: captured[1]?.length ?? 0,
    rawTextStart: fullText.substring(0, 200),
  })

  if (captured[0]) {
    try {
      block1 = JSON.parse(captured[0])
    } catch (e) {
      console.error('[reportGeneration] Failed to parse Block 1 JSON:', e)
      console.error('[reportGeneration] Block 1 raw start:', captured[0].substring(0, 500))
    }
  } else {
    console.error('[reportGeneration] No JSON blocks found in Claude response. Raw start:', fullText.substring(0, 500))
  }

  if (captured[1]) {
    try {
      block2 = JSON.parse(captured[1])
    } catch (e) {
      // Block 2 parse failure should not block Block 1 from being saved
      console.error('[reportGeneration] Failed to parse Block 2 JSON (non-fatal):', e)
      console.error('[reportGeneration] Block 2 raw start:', captured[1].substring(0, 500))
    }
  }

  return { block1, block2, rawText: fullText }
}

/**
 * Extract the executiveSummary value from a partial JSON stream in real time.
 * Used to show a preview while Claude is still generating.
 */
export function extractPartialSummary(partialText: string): string {
  const match = partialText.match(/"executiveSummary"\s*:\s*"((?:[^"\\]|\\.)*)/m)
  if (!match) return ''
  // Unescape basic sequences
  return match[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}
