'use server'

import { revalidatePath } from 'next/cache'
import {
  calculateLayer1Scores,
  calculateLayer2Scores,
  saveScoresToReport,
} from '@/lib/scoring'

export interface RecalculateResult {
  success: boolean
  error?: string
}

/**
 * Recalculate and persist scores for a completed assessment.
 * Returns a result object so the caller can surface errors to the user.
 */
export async function recalculateScores(
  assessmentId: string,
  usesSalesforce: boolean,
): Promise<RecalculateResult> {
  try {
    const [layer1, layer2] = await Promise.all([
      calculateLayer1Scores(assessmentId),
      usesSalesforce
        ? calculateLayer2Scores(assessmentId)
        : Promise.resolve(null),
    ])

    await saveScoresToReport(assessmentId, layer1, layer2)
  } catch (err) {
    console.error('[recalculate] Failed for assessment', assessmentId, err)
    return { success: false, error: String(err) }
  }

  revalidatePath(`/admin/assessments/${assessmentId}`)
  return { success: true }
}
