import type { Question, Layer2Section, SalesforceCloud } from '@/types'

/**
 * Layer 2 — Agentforce Readiness (44 questions across 5 sections)
 *
 * inputType: 'yesno' — scored as Yes=2, Partial/In Progress=1, No=0
 *
 * Section breakdown:
 *   CorePrereqs    (20 q) — shown to ALL Salesforce users
 *   DataCloud      ( 8 q) — shown to ALL Salesforce users
 *   SalesCloud     ( 8 q) — shown only when SalesCloud is an active cloud
 *   ServiceCloud   ( 8 q) — shown only when ServiceCloud is an active cloud
 *   MarketingCloud ( 8 q) — shown only when MarketingCloud is an active cloud
 *
 * Section weights (used in calculateLayer2Scores):
 *   CorePrereqs    30%
 *   DataCloud      25%
 *   Cloud-specific 45% (split evenly across applicable clouds)
 */

export type YesNoValue = 'yes' | 'partial' | 'no'

export const YESNO_SCORES: Record<YesNoValue, number> = {
  yes: 2,
  partial: 1,
  no: 0,
}

export const LAYER2_SECTION_WEIGHTS: Record<Layer2Section, number> = {
  CorePrereqs: 0.30,
  DataCloud: 0.25,
  SalesCloud: 0.45 / 3,     // 45% split evenly across applicable product clouds
  ServiceCloud: 0.45 / 3,
  MarketingCloud: 0.45 / 3,
}

export const layer2Questions: Question[] = [
  // ── Core Prerequisites (20) — all Salesforce users ────────────────────────
  {
    id: 'l2_core_01',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Your Salesforce org data is regularly reviewed and maintained for accuracy and completeness.',
  },
  {
    id: 'l2_core_02',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Your team uses Salesforce Flow, Process Builder, or other native automation tools today.',
  },
  {
    id: 'l2_core_03',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Your Salesforce objects, fields, and data model are well-documented and understood by admins.',
  },
  {
    id: 'l2_core_04',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'You have an active, certified Salesforce Administrator or Developer on your team or on retainer.',
  },
  {
    id: 'l2_core_05',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Your Salesforce instance is on Enterprise, Unlimited, Unlimited+, or Einstein 1 edition.',
  },
  {
    id: 'l2_core_06',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Salesforce Einstein AI features (e.g., Einstein Copilot, Next Best Action) are currently enabled.',
  },
  {
    id: 'l2_core_07',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Your users receive regular Salesforce training and are following current best practices.',
  },
  {
    id: 'l2_core_08',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'You have a formal change management and release process for Salesforce deployments.',
  },
  {
    id: 'l2_core_09',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Your Salesforce data model accurately reflects your current business processes and terminology.',
  },
  {
    id: 'l2_core_10',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'You have at least one Salesforce sandbox environment for testing before deploying to production.',
  },
  {
    id: 'l2_core_11',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Multi-factor authentication (MFA) is enforced for all Salesforce users.',
  },
  {
    id: 'l2_core_12',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Inactive or former employee Salesforce accounts are deactivated in a timely manner.',
  },
  {
    id: 'l2_core_13',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'User profiles, permission sets, and field-level security are configured according to least-privilege principles.',
  },
  {
    id: 'l2_core_14',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Custom code, Apex classes, and third-party integrations are documented and have an owner.',
  },
  {
    id: 'l2_core_15',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Salesforce is integrated with your other key business systems (e.g., ERP, marketing, support).',
  },
  {
    id: 'l2_core_16',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Your teams use Salesforce reports and dashboards to guide daily business decisions.',
  },
  {
    id: 'l2_core_17',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Salesforce CRM is the authoritative system of record for customer interactions and history.',
  },
  {
    id: 'l2_core_18',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'A Salesforce project owner or steering committee is in place to guide platform strategy.',
  },
  {
    id: 'l2_core_19',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'You have previously attempted or completed a Salesforce automation or AI/Einstein project.',
  },
  {
    id: 'l2_core_20',
    section: 'CorePrereqs',
    inputType: 'yesno',
    text: 'Your organization is prepared to dedicate internal resources (admin time, IT support) to an Agentforce implementation.',
  },

  // ── Data Cloud (8) — all Salesforce users ─────────────────────────────────
  {
    id: 'l2_dc_01',
    section: 'DataCloud',
    inputType: 'yesno',
    text: 'You are currently using Salesforce Data Cloud (formerly Customer Data Platform / CDP).',
  },
  {
    id: 'l2_dc_02',
    section: 'DataCloud',
    inputType: 'yesno',
    text: 'Customer data from multiple sources is unified into a single profile in Data Cloud.',
  },
  {
    id: 'l2_dc_03',
    section: 'DataCloud',
    inputType: 'yesno',
    text: 'Identity resolution rules are configured in Data Cloud to deduplicate and match customer records.',
  },
  {
    id: 'l2_dc_04',
    section: 'DataCloud',
    inputType: 'yesno',
    text: 'Data Cloud segments are actively used in Sales, Service, or Marketing workflows.',
  },
  {
    id: 'l2_dc_05',
    section: 'DataCloud',
    inputType: 'yesno',
    text: 'Calculated insights or custom Data Model Objects (DMOs) are configured in Data Cloud.',
  },
  {
    id: 'l2_dc_06',
    section: 'DataCloud',
    inputType: 'yesno',
    text: 'Data Cloud is receiving real-time or near-real-time data streams from production systems.',
  },
  {
    id: 'l2_dc_07',
    section: 'DataCloud',
    inputType: 'yesno',
    text: 'Data Cloud is connected to an external data warehouse (e.g., Snowflake, BigQuery, Azure Synapse).',
  },
  {
    id: 'l2_dc_08',
    section: 'DataCloud',
    inputType: 'yesno',
    text: 'Data Cloud is used to power AI model training, Einstein scoring, or Next Best Action recommendations.',
  },

  // ── Sales Cloud (8) — shown only if SalesCloud is active ─────────────────
  {
    id: 'l2_sc_01',
    section: 'SalesCloud',
    requiredCloud: 'SalesCloud',
    inputType: 'yesno',
    text: 'Your full sales pipeline — from lead through close — is managed end-to-end in Sales Cloud.',
  },
  {
    id: 'l2_sc_02',
    section: 'SalesCloud',
    requiredCloud: 'SalesCloud',
    inputType: 'yesno',
    text: 'Einstein Lead Scoring or Einstein Opportunity Scoring is enabled and used by your reps.',
  },
  {
    id: 'l2_sc_03',
    section: 'SalesCloud',
    requiredCloud: 'SalesCloud',
    inputType: 'yesno',
    text: 'Sales reps consistently log call notes, emails, and activities directly in Salesforce.',
  },
  {
    id: 'l2_sc_04',
    section: 'SalesCloud',
    requiredCloud: 'SalesCloud',
    inputType: 'yesno',
    text: 'Sales Engagement (formerly High Velocity Sales) is enabled and actively used for outreach cadences.',
  },
  {
    id: 'l2_sc_05',
    section: 'SalesCloud',
    requiredCloud: 'SalesCloud',
    inputType: 'yesno',
    text: 'Your configure-price-quote (CPQ) process is managed within Salesforce (CPQ or Revenue Cloud).',
  },
  {
    id: 'l2_sc_06',
    section: 'SalesCloud',
    requiredCloud: 'SalesCloud',
    inputType: 'yesno',
    text: 'Sales Cloud Einstein Forecasting is used to generate and review revenue forecasts.',
  },
  {
    id: 'l2_sc_07',
    section: 'SalesCloud',
    requiredCloud: 'SalesCloud',
    inputType: 'yesno',
    text: 'Sales plays, outreach templates, and cadences are standardized and managed in Salesforce.',
  },
  {
    id: 'l2_sc_08',
    section: 'SalesCloud',
    requiredCloud: 'SalesCloud',
    inputType: 'yesno',
    text: 'Sales reps actively use the Salesforce mobile app or Salesforce Inbox for on-the-go updates.',
  },

  // ── Service Cloud (8) — shown only if ServiceCloud is active ──────────────
  {
    id: 'l2_svc_01',
    section: 'ServiceCloud',
    requiredCloud: 'ServiceCloud',
    inputType: 'yesno',
    text: 'Your support team manages all cases — from intake to resolution — end-to-end in Service Cloud.',
  },
  {
    id: 'l2_svc_02',
    section: 'ServiceCloud',
    requiredCloud: 'ServiceCloud',
    inputType: 'yesno',
    text: 'Omni-Channel routing is configured to automatically assign cases to the right agent or queue.',
  },
  {
    id: 'l2_svc_03',
    section: 'ServiceCloud',
    requiredCloud: 'ServiceCloud',
    inputType: 'yesno',
    text: 'Einstein Case Classification or Einstein Case Routing is enabled to automate case triaging.',
  },
  {
    id: 'l2_svc_04',
    section: 'ServiceCloud',
    requiredCloud: 'ServiceCloud',
    inputType: 'yesno',
    text: 'A self-service portal or Salesforce Experience Cloud site is live for customers to resolve issues.',
  },
  {
    id: 'l2_svc_05',
    section: 'ServiceCloud',
    requiredCloud: 'ServiceCloud',
    inputType: 'yesno',
    text: 'Knowledge Articles are published and used by agents (or customers) to resolve cases faster.',
  },
  {
    id: 'l2_svc_06',
    section: 'ServiceCloud',
    requiredCloud: 'ServiceCloud',
    inputType: 'yesno',
    text: 'SLAs, entitlements, and escalation paths are defined and enforced in Service Cloud.',
  },
  {
    id: 'l2_svc_07',
    section: 'ServiceCloud',
    requiredCloud: 'ServiceCloud',
    inputType: 'yesno',
    text: 'Service Cloud is integrated with your telephony, live chat, or messaging platform.',
  },
  {
    id: 'l2_svc_08',
    section: 'ServiceCloud',
    requiredCloud: 'ServiceCloud',
    inputType: 'yesno',
    text: 'Case deflection rates and self-service containment are actively tracked and reported on.',
  },

  // ── Marketing Cloud (8) — shown only if MarketingCloud is active ──────────
  {
    id: 'l2_mc_01',
    section: 'MarketingCloud',
    requiredCloud: 'MarketingCloud',
    inputType: 'yesno',
    text: 'Marketing Cloud (Account Engagement / SFMC) is your primary platform for email marketing and nurture.',
  },
  {
    id: 'l2_mc_02',
    section: 'MarketingCloud',
    requiredCloud: 'MarketingCloud',
    inputType: 'yesno',
    text: 'Marketing automation journeys or engagement programs are actively running in production.',
  },
  {
    id: 'l2_mc_03',
    section: 'MarketingCloud',
    requiredCloud: 'MarketingCloud',
    inputType: 'yesno',
    text: 'Marketing Cloud is connected to Sales Cloud for lead handoff, lifecycle stage sync, and attribution.',
  },
  {
    id: 'l2_mc_04',
    section: 'MarketingCloud',
    requiredCloud: 'MarketingCloud',
    inputType: 'yesno',
    text: 'Einstein Send Time Optimization or Einstein Engagement Scoring is enabled and influencing campaign timing.',
  },
  {
    id: 'l2_mc_05',
    section: 'MarketingCloud',
    requiredCloud: 'MarketingCloud',
    inputType: 'yesno',
    text: 'Marketing Cloud is used for multi-channel campaigns including email, SMS, push notifications, or ads.',
  },
  {
    id: 'l2_mc_06',
    section: 'MarketingCloud',
    requiredCloud: 'MarketingCloud',
    inputType: 'yesno',
    text: 'Marketing audiences are segmented based on behavioral data, engagement history, or predictive scores.',
  },
  {
    id: 'l2_mc_07',
    section: 'MarketingCloud',
    requiredCloud: 'MarketingCloud',
    inputType: 'yesno',
    text: 'Marketing attribution models are defined, tracked, and tied back to pipeline or revenue in Salesforce.',
  },
  {
    id: 'l2_mc_08',
    section: 'MarketingCloud',
    requiredCloud: 'MarketingCloud',
    inputType: 'yesno',
    text: 'Marketing Cloud Intelligence (Datorama) or another unified reporting tool is used for cross-channel analytics.',
  },
]

/**
 * Return only the questions applicable to a given respondent based on their
 * selected Salesforce clouds.
 *
 * CorePrereqs and DataCloud are always included for Salesforce users.
 * Each product section is gated by the requiredCloud field.
 */
export function getApplicableLayer2Questions(
  activeClouds: SalesforceCloud[]
): Question[] {
  return layer2Questions.filter((q) => {
    if (!q.requiredCloud) return true             // CorePrereqs + DataCloud
    return activeClouds.includes(q.requiredCloud)  // product cloud gate
  })
}

/** Questions grouped by section for ordered rendering */
export const layer2BySection: Record<Layer2Section, Question[]> = {
  CorePrereqs: layer2Questions.filter((q) => q.section === 'CorePrereqs'),
  DataCloud: layer2Questions.filter((q) => q.section === 'DataCloud'),
  SalesCloud: layer2Questions.filter((q) => q.section === 'SalesCloud'),
  ServiceCloud: layer2Questions.filter((q) => q.section === 'ServiceCloud'),
  MarketingCloud: layer2Questions.filter((q) => q.section === 'MarketingCloud'),
}

export const LAYER2_SECTION_LABELS: Record<Layer2Section, string> = {
  CorePrereqs: 'Core Prerequisites',
  DataCloud: 'Data Cloud',
  SalesCloud: 'Sales Cloud',
  ServiceCloud: 'Service Cloud',
  MarketingCloud: 'Marketing Cloud',
}

export const LAYER2_SECTIONS_ORDER: Layer2Section[] = [
  'CorePrereqs',
  'DataCloud',
  'SalesCloud',
  'ServiceCloud',
  'MarketingCloud',
]
