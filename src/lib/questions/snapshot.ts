import type { Question } from '@/types'

/**
 * Operations Snapshot — 5 symptom checkboxes.
 *
 * These are NOT scored. They provide context for the assessment narrative and
 * help the AE frame the debrief conversation. All inputType = 'checkbox'.
 *
 * Rendered as: "Check any that apply to your organization today."
 */
export const snapshotQuestions: Question[] = [
  {
    id: 'snap_01',
    text: 'Repetitive manual tasks are slowing down your team\'s productivity',
    inputType: 'checkbox',
  },
  {
    id: 'snap_02',
    text: 'Your team struggles to find the right information or knowledge quickly',
    inputType: 'checkbox',
  },
  {
    id: 'snap_03',
    text: 'Customer response or resolution times are longer than your team would like',
    inputType: 'checkbox',
  },
  {
    id: 'snap_04',
    text: 'Your sales or service team is missing follow-up opportunities due to capacity',
    inputType: 'checkbox',
  },
  {
    id: 'snap_05',
    text: 'You lack clear visibility into which processes are costing the most time or money',
    inputType: 'checkbox',
  },
]
