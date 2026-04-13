import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getPartner } from '@/lib/partnerAuth'
import type {
  Assessment,
  Layer1Scores,
  Layer2Scores,
  ProductScore,
  ReadinessTier,
  AgentforceTier,
} from '@/types'

export const dynamic = 'force-dynamic'

const L1_TIER: Record<
  ReadinessTier,
  { label: string; bg: string; text: string; ring: string }
> = {
  Leading: { label: 'Leading', bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-600/20' },
  Scaling: { label: 'Scaling', bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20' },
  Building: { label: 'Building', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-600/20' },
  Exploring: { label: 'Exploring', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20' },
}

const L2_TIER: Record<
  AgentforceTier,
  { label: string; bg: string; text: string; ring: string }
> = {
  'Ready to Deploy': { label: 'Ready to Deploy', bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-600/20' },
  'Nearly Ready':    { label: 'Nearly Ready', bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20' },
  'Getting Ready':   { label: 'Getting Ready', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-600/20' },
  'Not Ready':       { label: 'Not Ready', bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20' },
}

const CLOUD_LABELS: Record<string, string> = {
  SalesCloud: 'Sales Agent',
  ServiceCloud: 'Service Agent',
  MarketingCloud: 'Marketing Agent',
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  in_progress: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  completed: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Sent',
  in_progress: 'In Progress',
  completed: 'Complete',
}

function barWidth(score: number): string {
  return `${Math.round((score / 5) * 100)}%`
}

function barColor(score: number): string {
  if (score >= 4.1) return 'bg-green-600'
  if (score >= 3.1) return 'bg-yellow-600'
  if (score >= 2.1) return 'bg-orange-600'
  return 'bg-red-600'
}

export default async function PartnerAssessmentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const partner = await getPartner()
  if (!partner) notFound()

  const supabase = createServiceClient()

  const [{ data: assessment, error: aErr }, { data: report }] = await Promise.all([
    supabase
      .from('assessments')
      .select('*')
      .eq('id', params.id)
      .eq('referral_partner_id', partner.id)
      .single(),
    supabase
      .from('reports')
      .select('layer1_scores, layer2_scores, product_scores, overall_tier')
      .eq('assessment_id', params.id)
      .maybeSingle(),
  ])

  if (aErr || !assessment) notFound()

  const a = assessment as Assessment
  const layer1Scores = report?.layer1_scores as Layer1Scores | null
  const layer2ScoresRaw = report?.layer2_scores as Layer2Scores | null
  const productScores = report?.product_scores as ProductScore[] | null

  const hasScores = !!layer1Scores
  const showAgentforce = !!a.uses_salesforce
  const fullName =
    [a.contact_first_name, a.contact_last_name].filter(Boolean).join(' ') || '—'

  const activeClouds = a.salesforce_clouds ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/partner/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Assessments
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{fullName}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[a.status] ?? STATUS_STYLE.pending}`}
            >
              {STATUS_LABEL[a.status] ?? a.status}
            </span>
          </div>
          {a.company_name && (
            <p className="mt-0.5 text-sm text-gray-500">{a.company_name}</p>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Client Profile */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Client Profile
          </h2>

          <dl className="space-y-2.5 text-sm">
            <ProfileRow label="Name" value={fullName} />
            <ProfileRow label="Title" value={a.contact_title} />
            <ProfileRow label="Email" value={a.contact_email} />
            <ProfileRow label="Phone" value={a.contact_phone} />

            <div className="my-3 border-t border-gray-100" />

            <ProfileRow label="Company" value={a.company_name} />
            <ProfileRow label="Industry" value={a.company_industry} />
            <ProfileRow label="Size" value={a.company_size} />
            <ProfileRow label="Revenue" value={a.company_revenue} />
            <ProfileRow label="HQ" value={a.company_headquarters} />
            <ProfileRow label="Website" value={a.company_website} />

            {a.uses_salesforce && (
              <>
                <div className="my-3 border-t border-gray-100" />
                <ProfileRow label="Salesforce" value="Yes" />
                <ProfileRow label="Edition" value={a.salesforce_edition} />
                <ProfileRow
                  label="Clouds"
                  value={activeClouds.length ? activeClouds.join(', ') : null}
                />
              </>
            )}
          </dl>
        </div>

        {/* AI Maturity Score */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            AI Maturity Score
          </h2>

          {!hasScores ? (
            <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
              Scores will be available once the assessment is completed.
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <span className="text-2xl font-bold text-gray-900">
                    {layer1Scores!.overall.toFixed(1)}
                  </span>
                </div>
                <div>
                  <TierBadge tier={layer1Scores!.tier} config={L1_TIER} />
                  <p className="mt-1 text-xs text-gray-400">out of 5.0</p>
                </div>
              </div>

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

      {showAgentforce && hasScores && layer2ScoresRaw && (
        <div className="space-y-6">
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
                <TierBadge tier={layer2ScoresRaw.tier} config={L2_TIER} />
                <p className="mt-1 text-xs text-gray-400">out of 5.0</p>
              </div>
            </div>

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

          {productScores && productScores.length > 0 && (
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
    </div>
  )
}

function ProfileRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
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
}: {
  tier: T
  config: Record<string, { label: string; bg: string; text: string; ring: string }>
}) {
  const c = config[tier]
  if (!c) return null
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${c.bg} ${c.text} ${c.ring}`}
    >
      {c.label}
    </span>
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
