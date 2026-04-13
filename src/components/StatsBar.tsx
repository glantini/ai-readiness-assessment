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
      />
      <StatCard
        label="Completion Rate"
        value={completionRate === null ? '—' : `${completionRate}%`}
      />
      <StatCard
        label="Avg. AI Readiness Score"
        value={avgL1 === null ? '—' : `${avgL1.toFixed(1)} / 5.0`}
      />
      <StatCard
        label="Avg. Agentforce Score"
        value={avgL2 === null ? '—' : `${avgL2.toFixed(1)} / 5.0`}
      />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}
