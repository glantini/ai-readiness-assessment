/**
 * Agentforce SKU & Capability Reference
 * Source: Agentforce Assessment Specification v1.0, Section 2
 */

export type AgentforceSKU =
  | 'Agentforce for Sales'
  | 'Agentforce for Service'
  | 'Agentforce for Marketing'
  | 'Agentforce for Commerce'
  | 'Agentforce for Field Service'
  | 'Agentforce Platform'
  | 'Agentforce + Slack'
  | 'Data Cloud'
  | 'Einstein 1 Platform'
  | 'Einstein for Service'
  | 'Marketing Cloud + Data Cloud'
  | 'Revenue Cloud'

export type UseCaseTag =
  | 'SDR Agent'
  | 'Sales Coach'
  | 'Pipeline Management'
  | 'Web Lead Gen'
  | 'Service Agent'
  | 'Field Service Agent'
  | 'Campaign Agent'
  | 'Merchandiser Agent'
  | 'Personal Shopper'
  | 'Employee Support'
  | 'Data Cloud'
  | 'Einstein Trust Layer'
  | 'Agent Builder'
  | 'Agentforce Voice'
  | 'Agentforce Quoting'
  | 'Case Summarization'
  | 'Service Replies'
  | 'Einstein Personalization'

export interface AgentforceCapability {
  /** Stable identifier for lookup */
  id: UseCaseTag
  /** Display name */
  name: string
  /** Salesforce SKU required */
  sku: AgentforceSKU
  /** What the capability does */
  whatItDoes: string
  /** Generic business impact — may be personalized per report */
  businessImpact: string
  /** Functional area for sorting / grouping */
  group: 'Sales' | 'Service' | 'Marketing & Commerce' | 'Platform & Foundation'
}

export const AGENTFORCE_CAPABILITIES: AgentforceCapability[] = [
  // ── Sales ──────────────────────────────────────────────────────────────────
  {
    id: 'SDR Agent',
    name: 'SDR Agent',
    sku: 'Agentforce for Sales',
    whatItDoes:
      '24/7 lead engagement, qualification, objection handling, meeting booking.',
    businessImpact:
      'Increased pipeline, shorter cycles, reps focus on closing.',
    group: 'Sales',
  },
  {
    id: 'Sales Coach',
    name: 'Sales Coach Agent',
    sku: 'Agentforce for Sales',
    whatItDoes:
      'Role-play sessions, pitch practice, and deal-specific coaching.',
    businessImpact: 'Faster rep ramp, improved win rates.',
    group: 'Sales',
  },
  {
    id: 'Pipeline Management',
    name: 'Pipeline Management Agent',
    sku: 'Agentforce for Sales',
    whatItDoes:
      'Auto-updates Stage and Next Steps from call and email signals.',
    businessImpact: 'Reduced admin, accurate forecasting.',
    group: 'Sales',
  },
  {
    id: 'Web Lead Gen',
    name: 'Web Lead Generation',
    sku: 'Agentforce for Sales',
    whatItDoes:
      'Chat-based lead capture, qualification, and meeting booking on your website.',
    businessImpact: 'Always-on capture, no missed inquiries.',
    group: 'Sales',
  },
  {
    id: 'Agentforce Quoting',
    name: 'Agentforce Quoting',
    sku: 'Revenue Cloud',
    whatItDoes:
      'Natural language quote generation applying your business rules and pricing.',
    businessImpact: 'Faster quotes, finance-compliant outputs.',
    group: 'Sales',
  },

  // ── Service ────────────────────────────────────────────────────────────────
  {
    id: 'Service Agent',
    name: 'Service Agent',
    sku: 'Agentforce for Service',
    whatItDoes:
      'Autonomous case handling, order management, and troubleshooting.',
    businessImpact: '24/7 support, reduced costs, higher CSAT.',
    group: 'Service',
  },
  {
    id: 'Service Replies',
    name: 'Service Replies',
    sku: 'Einstein for Service',
    whatItDoes: 'AI-generated response suggestions for agent-assisted cases.',
    businessImpact: 'Faster resolution, consistent quality.',
    group: 'Service',
  },
  {
    id: 'Case Summarization',
    name: 'Case Summarization',
    sku: 'Einstein for Service',
    whatItDoes: 'Auto-summarizes case history for faster handoffs.',
    businessImpact: 'Reduced handle time, seamless handoffs.',
    group: 'Service',
  },
  {
    id: 'Field Service Agent',
    name: 'Field Service Agent',
    sku: 'Agentforce for Field Service',
    whatItDoes:
      'Appointment scheduling and job-detail surfacing for field techs.',
    businessImpact: 'Optimized routes, better first-time fix.',
    group: 'Service',
  },

  // ── Marketing & Commerce ───────────────────────────────────────────────────
  {
    id: 'Campaign Agent',
    name: 'Campaign Agent',
    sku: 'Agentforce for Marketing',
    whatItDoes:
      'Auto-generates briefs, content, and emails in your brand voice.',
    businessImpact: 'Faster time-to-market.',
    group: 'Marketing & Commerce',
  },
  {
    id: 'Einstein Personalization',
    name: 'Einstein Personalization',
    sku: 'Marketing Cloud + Data Cloud',
    whatItDoes: 'Real-time next-best-action decisions across channels.',
    businessImpact: 'Increased conversion.',
    group: 'Marketing & Commerce',
  },
  {
    id: 'Merchandiser Agent',
    name: 'Merchandiser Agent',
    sku: 'Agentforce for Commerce',
    whatItDoes: 'Site setup, promotions, and SEO recommendations.',
    businessImpact: 'Higher conversion rates.',
    group: 'Marketing & Commerce',
  },
  {
    id: 'Personal Shopper',
    name: 'Personal Shopper',
    sku: 'Agentforce for Commerce',
    whatItDoes: 'Guides B2C customers through product selection.',
    businessImpact: 'Increased average order value.',
    group: 'Marketing & Commerce',
  },

  // ── Platform & Foundation ──────────────────────────────────────────────────
  {
    id: 'Data Cloud',
    name: 'Data Cloud',
    sku: 'Data Cloud',
    whatItDoes:
      'Unifies customer profiles and powers every Agentforce agent with grounded context.',
    businessImpact: 'Single source of truth, better AI grounding.',
    group: 'Platform & Foundation',
  },
  {
    id: 'Agent Builder',
    name: 'Agent Builder',
    sku: 'Agentforce Platform',
    whatItDoes: 'Low-code agent creation for business users.',
    businessImpact: 'Rapid deployment, business-user empowerment.',
    group: 'Platform & Foundation',
  },
  {
    id: 'Einstein Trust Layer',
    name: 'Einstein Trust Layer',
    sku: 'Einstein 1 Platform',
    whatItDoes: 'Data masking, zero-retention, and toxicity filtering.',
    businessImpact: 'Enterprise security and compliance.',
    group: 'Platform & Foundation',
  },
  {
    id: 'Agentforce Voice',
    name: 'Agentforce Voice',
    sku: 'Agentforce Platform',
    whatItDoes: 'AI voice across phone, web, and mobile.',
    businessImpact: 'Natural conversations, brand-consistent.',
    group: 'Platform & Foundation',
  },
  {
    id: 'Employee Support',
    name: 'Employee Support Agent',
    sku: 'Agentforce + Slack',
    whatItDoes: 'Handles internal IT and HR requests inside Slack.',
    businessImpact: 'Reduced ticket volume, faster employee answers.',
    group: 'Platform & Foundation',
  },
]

export const CAPABILITY_BY_ID: Record<UseCaseTag, AgentforceCapability> =
  AGENTFORCE_CAPABILITIES.reduce(
    (acc, c) => ({ ...acc, [c.id]: c }),
    {} as Record<UseCaseTag, AgentforceCapability>,
  )
