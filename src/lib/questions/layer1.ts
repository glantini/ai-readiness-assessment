import type { Question } from '@/types'

/**
 * Layer 1 — General AI Readiness (36 questions, 6 per category)
 *
 * All respondents answer these regardless of Salesforce usage.
 * inputType: 'scale' — 5-point Likert from 1 (Not at all) to 5 (Fully / Always)
 *
 * Categories and weights:
 *   AI Strategy         20%
 *   People & Culture    15%
 *   Data Foundation     20%
 *   Process Readiness   15%
 *   Risk & Governance   15%
 *   AI Agent Governance 15%
 */

export type Layer1Category =
  | 'AI Strategy'
  | 'People & Culture'
  | 'Data Foundation'
  | 'Process Readiness'
  | 'Risk & Governance'
  | 'AI Agent Governance'

export const LAYER1_CATEGORY_WEIGHTS: Record<Layer1Category, number> = {
  'AI Strategy': 0.20,
  'People & Culture': 0.15,
  'Data Foundation': 0.20,
  'Process Readiness': 0.15,
  'Risk & Governance': 0.15,
  'AI Agent Governance': 0.15,
}

export const SCALE_LABELS = {
  min: 'Not at all',
  max: 'Fully / Always',
}

export const layer1Questions: Question[] = [
  // ── AI Strategy (6) ────────────────────────────────────────────────────────
  {
    id: 'l1_strat_01',
    category: 'AI Strategy',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Our organization has a documented AI strategy or roadmap with defined goals.',
  },
  {
    id: 'l1_strat_02',
    category: 'AI Strategy',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Leadership has committed dedicated budget for AI initiatives in the current or next fiscal year.',
  },
  {
    id: 'l1_strat_03',
    category: 'AI Strategy',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We have defined measurable success metrics for AI adoption across the business.',
  },
  {
    id: 'l1_strat_04',
    category: 'AI Strategy',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Specific business problems that AI will solve have been clearly identified and prioritized.',
  },
  {
    id: 'l1_strat_05',
    category: 'AI Strategy',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'There is active executive sponsorship and visible leadership support for AI projects.',
  },
  {
    id: 'l1_strat_06',
    category: 'AI Strategy',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We have evaluated or piloted AI tools in the past 12 months and documented learnings.',
  },

  // ── People & Culture (6) ──────────────────────────────────────────────────
  {
    id: 'l1_people_01',
    category: 'People & Culture',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Employees across teams understand the difference between AI automation and AI-assisted work.',
  },
  {
    id: 'l1_people_02',
    category: 'People & Culture',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Our team members feel comfortable experimenting with and adopting AI tools in day-to-day work.',
  },
  {
    id: 'l1_people_03',
    category: 'People & Culture',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'The organization provides AI literacy training, resources, or structured learning opportunities.',
  },
  {
    id: 'l1_people_04',
    category: 'People & Culture',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'There is a designated person, team, or center of excellence responsible for AI adoption.',
  },
  {
    id: 'l1_people_05',
    category: 'People & Culture',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We actively collect employee feedback on AI tool adoption and use it to shape our approach.',
  },
  {
    id: 'l1_people_06',
    category: 'People & Culture',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Leadership visibly models and encourages the use of AI tools in their own workflows.',
  },

  // ── Data Foundation (6) ───────────────────────────────────────────────────
  {
    id: 'l1_data_01',
    category: 'Data Foundation',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Customer and operational data is centralized in a single system of record (e.g., CRM, ERP).',
  },
  {
    id: 'l1_data_02',
    category: 'Data Foundation',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Our data is regularly cleaned, deduplicated, and validated for accuracy.',
  },
  {
    id: 'l1_data_03',
    category: 'Data Foundation',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We have defined data ownership, stewardship roles, and governance policies in place.',
  },
  {
    id: 'l1_data_04',
    category: 'Data Foundation',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Decision-makers can access accurate, real-time data to guide business decisions.',
  },
  {
    id: 'l1_data_05',
    category: 'Data Foundation',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We track data quality metrics and enforce data standards across systems.',
  },
  {
    id: 'l1_data_06',
    category: 'Data Foundation',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Our data architecture and integration patterns are documented and understood by technical staff.',
  },

  // ── Process Readiness (6) ─────────────────────────────────────────────────
  {
    id: 'l1_process_01',
    category: 'Process Readiness',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Core business processes are documented, standardized, and followed consistently across teams.',
  },
  {
    id: 'l1_process_02',
    category: 'Process Readiness',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We can identify at least three high-volume, repetitive workflows that are candidates for automation.',
  },
  {
    id: 'l1_process_03',
    category: 'Process Readiness',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Key business systems are integrated with each other to reduce manual handoffs and data re-entry.',
  },
  {
    id: 'l1_process_04',
    category: 'Process Readiness',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Workflows are actively monitored for performance, cycle times, and bottlenecks.',
  },
  {
    id: 'l1_process_05',
    category: 'Process Readiness',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Handoff points between teams or departments are clearly defined and tracked.',
  },
  {
    id: 'l1_process_06',
    category: 'Process Readiness',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Our current processes are designed or ready to be extended by automation without a full rebuild.',
  },

  // ── Risk & Governance (6) ─────────────────────────────────────────────────
  {
    id: 'l1_risk_01',
    category: 'Risk & Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We have a published AI use policy or acceptable-use guidelines for employees.',
  },
  {
    id: 'l1_risk_02',
    category: 'Risk & Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'There is a defined review and approval process for introducing new AI tools or capabilities.',
  },
  {
    id: 'l1_risk_03',
    category: 'Risk & Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We regularly audit AI outputs for accuracy, bias, and alignment with business intent.',
  },
  {
    id: 'l1_risk_04',
    category: 'Risk & Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We are aware of AI-related compliance and regulatory requirements relevant to our industry.',
  },
  {
    id: 'l1_risk_05',
    category: 'Risk & Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We have defined processes for identifying, reporting, and remediating AI errors or hallucinations.',
  },
  {
    id: 'l1_risk_06',
    category: 'Risk & Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Customer and employee data is handled in compliance with applicable privacy laws (e.g., GDPR, CCPA).',
  },

  // ── AI Agent Governance (6) ───────────────────────────────────────────────
  {
    id: 'l1_agent_01',
    category: 'AI Agent Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Our team understands the distinction between AI copilots (suggestions) and autonomous AI agents (actions).',
  },
  {
    id: 'l1_agent_02',
    category: 'AI Agent Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We have guardrails, human-in-the-loop checkpoints, or approval workflows for AI-initiated actions.',
  },
  {
    id: 'l1_agent_03',
    category: 'AI Agent Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We can monitor and audit the actions AI agents take on behalf of users or processes.',
  },
  {
    id: 'l1_agent_04',
    category: 'AI Agent Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Rollback, undo, or corrective capabilities exist if an AI agent takes an incorrect action.',
  },
  {
    id: 'l1_agent_05',
    category: 'AI Agent Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'Team members are trained on how to review, supervise, and override AI agent outputs.',
  },
  {
    id: 'l1_agent_06',
    category: 'AI Agent Governance',
    inputType: 'scale',
    scaleMin: SCALE_LABELS.min,
    scaleMax: SCALE_LABELS.max,
    text: 'We have incident response procedures defined for failures or unexpected behavior from AI agents.',
  },
]

/** Grouped by category for ordered rendering */
export const layer1ByCategory: Record<Layer1Category, Question[]> = {
  'AI Strategy': layer1Questions.filter((q) => q.category === 'AI Strategy'),
  'People & Culture': layer1Questions.filter((q) => q.category === 'People & Culture'),
  'Data Foundation': layer1Questions.filter((q) => q.category === 'Data Foundation'),
  'Process Readiness': layer1Questions.filter((q) => q.category === 'Process Readiness'),
  'Risk & Governance': layer1Questions.filter((q) => q.category === 'Risk & Governance'),
  'AI Agent Governance': layer1Questions.filter((q) => q.category === 'AI Agent Governance'),
}

export const LAYER1_CATEGORIES: Layer1Category[] = [
  'AI Strategy',
  'People & Culture',
  'Data Foundation',
  'Process Readiness',
  'Risk & Governance',
  'AI Agent Governance',
]
