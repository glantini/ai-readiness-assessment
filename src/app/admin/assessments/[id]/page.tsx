import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RecalculateButton } from './RecalculateButton'
import type {
  Assessment,
  Layer1Scores,
  Layer2Scores,
  ProductScore,
  ReadinessTier,
  AgentforceTier,
  ReferralPartner,
} from '@/types'

export const dynamic = 'force-dynamic'

// ─── Tier display config ──────────────────────────────────────────────────────

const L1_TIER: Record<
  ReadinessTier,
  { label: string; bg: string; text: string; ring: string; bar: string }
> = {
  Leading:   { label: 'Leading',   bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-600/20',  bar: 'bg-green-600'  },
  Scaling:   { label: 'Scaling',   bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20', bar: 'bg-yellow-600' },
  Building:  { label: 'Building',  bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-600/20', bar: 'bg-orange-600' },
  Exploring: { label: 'Exploring', bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-600/20',    bar: 'bg-red-600'    },
}

const L2_TIER: Record<
  AgentforceTier,
  { label: string; bg: string; text: string; ring: string }
> = {
  'Ready to Deploy': { label: 'Ready to Deploy', bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-600/20'  },
  'Nearly Ready':    { label: 'Nearly Ready',    bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20' },
  'Getting Ready':   { label: 'Getting Ready',   bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-600/20' },
  'Not Ready':       { label: 'Not Ready',       bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-600/20'    },
}

const CLOUD_LABELS: Record<string, string> = {
  SalesCloud: 'Sales Agent',
  ServiceCloud: 'Service Agent',
  MarketingCloud: 'Marketing Agent',
}

const STATUS_STYLE: Record<string, string> = {
  pending:     'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  in_progress: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  completed:   'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Sent', in_progress: 'In Progress', completed: 'Complete',
}

// ─── Helper: score → bar width % (1–5 maps to 20–100%) ───────────────────────

function barWidth(score: number): string {
  return `${Math.round((score / 5) * 100)}%`
}

// ─── Helper: score → tier bar color class ────────────────────────────────────

function barColor(score: number): string {
  if (score >= 4.1) return 'bg-green-600'
  if (score >= 3.1) return 'bg-yellow-600'
  if (score >= 2.1) return 'bg-orange-600'
  return 'bg-red-600'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AssessmentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  // Split queries: scores use only confirmed columns; narrative columns are added
  // by migration 001 and gracefully return null until that migration runs.
  const [
    { data: assessment, error: aErr },
    { data: report },
    { data: narrativeRow },
  ] = await Promise.all([
    supabase
      .from('assessments')
      .select('*, referral_partner:referral_partners(*)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('reports')
      .select('layer1_scores, layer2_scores, product_scores, overall_tier')
      .eq('assessment_id', params.id)
      .single(),
    supabase
      .from('reports')
      .select('ai_narrative_json, report_status')
      .eq('assessment_id', params.id)
      .maybeSingle(),
  ])

  if (aErr || !assessment) notFound()

  const a = assessment as Assessment & {
    referral_partner: ReferralPartner | ReferralPartner[] | null
  }
  const partner = Array.isArray(a.referral_partner) ? a.referral_partner[0] ?? null : a.referral_partner

  const layer1Scores = report?.layer1_scores as Layer1Scores | null
  const layer2ScoresRaw = report?.layer2_scores as Layer2Scores | null
  const productScores = report?.product_scores as ProductScore[] | null

  const hasScores = !!layer1Scores
  const hasNarrative = !!(narrativeRow as { ai_narrative_json?: unknown } | null)?.ai_narrative_json
  const reportStatus = ((narrativeRow as { report_status?: string } | null)?.report_status) ?? null
  const showAgentforce = !!a.uses_salesforce

  // ── Full name helpers ────────────────────────────────────────────────────
  const fullName =
    [a.contact_first_name, a.contact_last_name].filter(Boolean).join(' ') || '—'

  const activeClouds = a.salesforce_clouds ?? []
  const cloudLabels = activeClouds
    .filter((c) => c !== 'DataCloud')
    .map((c) => ({ key: c, label: CLOUD_LABELS[c] ?? c }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Back link ─────────────────────────────────────────────────── */}
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Assessments
        </Link>

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{fullName}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[a.status] ?? STATUS_STYLE.pending}`}>
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
            </div>
            {a.company_name && (
              <p className="mt-0.5 text-sm text-gray-500">{a.company_name}</p>
            )}
          </div>

          {/* Report + recalculate buttons */}
          {a.status === 'completed' && (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {reportStatus === 'approved' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Approved
                </span>
              )}
              <RecalculateButton assessmentId={a.id} usesSalesforce={!!a.uses_salesforce} />
              {hasScores && (
                <Link
                  href={`/admin/assessments/${a.id}/report`}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {hasNarrative ? 'View Report' : 'Generate Report'}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Two-column: profile + AI Maturity ─────────────────────────── */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">

          {/* ── Client Profile ─────────────────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Client Profile
            </h2>

            <dl className="space-y-2.5 text-sm">
              <ProfileRow label="Name"    value={fullName} />
              <ProfileRow label="Title"   value={a.contact_title} />
              <ProfileRow label="Email"   value={a.contact_email} />
              <ProfileRow label="Phone"   value={a.contact_phone} />

              <div className="my-3 border-t border-gray-100" />

              <ProfileRow label="Company"  value={a.company_name} />
              <ProfileRow label="Industry" value={a.company_industry} />
              <ProfileRow label="Size"     value={a.company_size} />
              <ProfileRow label="Revenue"  value={a.company_revenue} />
              <ProfileRow label="HQ"       value={a.company_headquarters} />
              <ProfileRow label="Website"  value={a.company_website} />

              <div className="my-3 border-t border-gray-100" />

              <ProfileRow label="AI Motivation"  value={a.ai_motivation} />
              <ProfileRow label="Current AI Use" value={a.ai_current_usage} />

              {a.uses_salesforce && (
                <>
                  <div className="my-3 border-t border-gray-100" />
                  <ProfileRow label="Salesforce"   value="Yes" />
                  <ProfileRow label="Edition"      value={a.salesforce_edition} />
                  <ProfileRow
                    label="Clouds"
                    value={
                      activeClouds.length
                        ? activeClouds
                            .map((c) => c.replace('Cloud', ' Cloud').replace('Sales Cloud', 'Sales Cloud'))
                            .join(', ')
                        : null
                    }
                  />
                </>
              )}

              {partner && (
                <>
                  <div className="my-3 border-t border-gray-100" />
                  <ProfileRow label="Partner" value={partner.name} />
                  <ProfileRow label="Email"   value={partner.email} />
                  <ProfileRow label="Company" value={partner.company} />
                  <ProfileRow label="Region"  value={partner.sf_team_region} />
                  {partner.notes && (
                    <div className="flex gap-2">
                      <dt className="w-24 shrink-0 text-gray-400">Notes</dt>
                      <dd className="text-gray-700">{partner.notes}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>

          {/* ── AI Maturity Score ──────────────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              AI Maturity Score
            </h2>

            {!hasScores ? (
              <NoScoresNotice
                status={a.status}
                assessmentId={a.id}
                usesSalesforce={!!a.uses_salesforce}
              />
            ) : (
              <>
                {/* Overall score + tier */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-2xl font-bold text-gray-900">
                      {layer1Scores!.overall.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <TierBadge tier={layer1Scores!.tier} config={L1_TIER} size="lg" />
                    <p className="mt-1 text-xs text-gray-400">out of 5.0</p>
                  </div>
                </div>

                {/* Per-category score bars */}
                <div className="space-y-3">
                  {layer1Scores!.categories.map((cat) => (
                    <div key={cat.category}>
                      <div className="mb-1 flex justify-between text-xs text-gray-600">
                        <span>{cat.category}</span>
                        <span className="font-medium text-gray-900">
                          {cat.raw.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(cat.raw)}`}
                          style={{ width: barWidth(cat.raw) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Agentforce section (Salesforce users only) ─────────────────── */}
        {showAgentforce && hasScores && layer2ScoresRaw && (
          <div className="space-y-6">

            {/* Edition flag callout */}
            {layer2ScoresRaw.edition_flag && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Edition Limitation</p>
                  <p className="mt-0.5 text-sm text-amber-700">
                    This client is on <strong>{a.salesforce_edition}</strong> edition, which requires an
                    Agentforce add-on license. The Agentforce Readiness Index has been capped at{' '}
                    <strong>2.5</strong> to reflect this constraint. Upgrading to Enterprise or Unlimited
                    edition unlocks full Agentforce capability.
                  </p>
                </div>
              </div>
            )}

            {/* Agentforce Readiness Index */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Agentforce Readiness Index
              </h2>

              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <span className="text-2xl font-bold text-gray-900">
                    {layer2ScoresRaw.overall.toFixed(1)}
                  </span>
                </div>
                <div>
                  <TierBadge tier={layer2ScoresRaw.tier} config={L2_TIER} size="lg" />
                  <p className="mt-1 text-xs text-gray-400">out of 5.0</p>
                </div>
              </div>

              {/* Section scores */}
              <div className="space-y-3">
                {layer2ScoresRaw.sections.map((sec) => (
                  <div key={sec.section}>
                    <div className="mb-1 flex justify-between text-xs text-gray-600">
                      <span>{sectionLabel(sec.section)}</span>
                      <span className="font-medium text-gray-900">
                        {sec.raw.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(sec.raw)}`}
                        style={{ width: barWidth(sec.raw) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-product scores */}
            {productScores && productScores.length > 0 && cloudLabels.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Per-Product Agent Scores
                </h2>

                <div className="space-y-5">
                  {productScores
                    .filter((ps) => ps.cloud !== 'Overall')
                    .map((ps) => {
                      const label = CLOUD_LABELS[ps.cloud] ?? ps.cloud
                      const tierCfg = L2_TIER[ps.tier]
                      return (
                        <div key={ps.cloud}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {ps.score.toFixed(1)}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tierCfg.bg} ${tierCfg.text} ${tierCfg.ring}`}
                              >
                                {tierCfg.label}
                              </span>
                            </div>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full transition-all ${barColor(ps.score)}`}
                              style={{ width: barWidth(ps.score) }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Agentforce pending (SF user, scores not yet available) ──────── */}
        {showAgentforce && !hasScores && a.status !== 'completed' && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-400">
            Agentforce scores will be available once the assessment is completed.
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-gray-400">{label}</dt>
      <dd className="text-gray-700">{value}</dd>
    </div>
  )
}

function TierBadge<T extends string>({
  tier,
  config,
  size = 'sm',
}: {
  tier: T
  config: Record<string, { label: string; bg: string; text: string; ring: string }>
  size?: 'sm' | 'lg'
}) {
  const c = config[tier]
  if (!c) return null
  const px = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ring-inset ${px} ${c.bg} ${c.text} ${c.ring}`}
    >
      {c.label}
    </span>
  )
}

function NoScoresNotice({
  status,
  assessmentId,
  usesSalesforce,
}: {
  status: string
  assessmentId: string
  usesSalesforce: boolean
}) {
  if (status !== 'completed') {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
        Scores will be available once the assessment is completed.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
      <p className="font-medium text-amber-800">Scores not yet calculated</p>
      <p className="mt-1 mb-3 text-amber-700">
        Scoring may have failed during completion. Click below to recalculate.
      </p>
      <RecalculateButton assessmentId={assessmentId} usesSalesforce={usesSalesforce} />
    </div>
  )
}

function sectionLabel(section: string): string {
  const map: Record<string, string> = {
    CorePrereqs: 'Section A — Core Prerequisites',
    DataCloud: 'Section B — Data Cloud',
    SalesCloud: 'Section C — Sales Cloud',
    ServiceCloud: 'Section D — Service Cloud',
    MarketingCloud: 'Section E — Marketing Cloud',
  }
  return map[section] ?? section
}
