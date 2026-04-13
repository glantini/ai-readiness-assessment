import type { Layer1Scores, Layer2Scores } from '@/types'

type StatsBarAssessment = {
  id: string
  status: string
}

type StatsBarReport = {
  assessment_id: string
  layer1_scores: Layer1Scores | null
  layer2_scores: Layer2Scores | null
}

export default function StatsBar({
  assessments,
  reports,
}: {
  assessments: StatsBarAssessment[]
  reports: StatsBarReport[]
}) {
  const totalSent = assessments.length
  const completed = assessments.filter((a) => a.status === 'completed')
  const completedCount = completed.length
  const completedIds = new Set(completed.map((a) => a.id))

  const completedReports = reports.filter((r) => completedIds.has(r.assessment_id))

  const l1Scores = completedReports
    .map((r) => r.layer1_scores?.overall)
    .filter((v): v is number => typeof v === 'number')
  const l2Scores = completedReports
    .map((r) => r.layer2_scores?.overall)
    .filter((v): v is number => typeof v === 'number')

  const avgL1 = l1Scores.length
    ? l1Scores.reduce((acc, v) => acc + v, 0) / l1Scores.length
    : null
  const avgL2 = l2Scores.length
    ? l2Scores.reduce((acc, v) => acc + v, 0) / l2Scores.length
    : null

  const completionRate =
    totalSent > 0 ? Math.round((completedCount / totalSent) * 100) : null

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Assessments Completed"
        value={totalSent > 0 ? String(completedCount) : '—'}
        theme="blue"
      />
      <StatCard
        label="Completion Rate"
        value={completionRate === null ? '—' : `${completionRate}%`}
        theme="emerald"
      />
      <StatCard
        label="Avg. AI Readiness Score"
        value={avgL1 === null ? '—' : `${avgL1.toFixed(1)} / 5.0`}
        theme="orange"
      />
      <StatCard
        label="Avg. Agentforce Score"
        value={avgL2 === null ? '—' : `${avgL2.toFixed(1)} / 5.0`}
        theme="violet"
      />
    </div>
  )
}

type Theme = 'blue' | 'emerald' | 'orange' | 'violet'

const THEME_CLASSES: Record<Theme, { card: string; label: string; value: string }> = {
  blue: {
    card: 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/60',
    label: 'text-blue-700',
    value: 'text-blue-900',
  },
  emerald: {
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/60',
    label: 'text-emerald-700',
    value: 'text-emerald-900',
  },
  orange: {
    card: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/60',
    label: 'text-orange-700',
    value: 'text-orange-900',
  },
  violet: {
    card: 'border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/60',
    label: 'text-violet-700',
    value: 'text-violet-900',
  },
}

function StatCard({
  label,
  value,
  theme,
}: {
  label: string
  value: string
  theme: Theme
}) {
  const t = THEME_CLASSES[theme]
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${t.card}`}>
      <p className={`text-xs font-medium uppercase tracking-wider ${t.label}`}>
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold ${t.value}`}>{value}</p>
    </div>
  )
}
