import type { Question } from '@/types'

/**
 * Operations Snapshot — 5 symptom checkboxes.
 *
 * These are NOT scored. They provide context for the assessment narrative and
 * help the AE frame the debrief conversation. All inputType = 'checkbox'.
 *
 * Rendered as: "Before we begin, check any of the following that apply to your
 * organization right now. This helps us tailor your report."
 */
export const snapshotQuestions: Question[] = [
  {
    id: 'snap_01',
    text: 'Our team spends significant time on manual data entry, reporting, or handoffs between systems',
    inputType: 'checkbox',
  },
  {
    id: 'snap_02',
    text: 'Customer inquiries or internal requests regularly fall through the cracks or go unanswered',
    inputType: 'checkbox',
  },
  {
    id: 'snap_03',
    text: 'We struggle to get a consistent, real-time view of our sales pipeline or customer activity',
    inputType: 'checkbox',
  },
  {
    id: 'snap_04',
    text: 'Our best processes live in people\'s heads — not documented systems',
    inputType: 'checkbox',
  },
  {
    id: 'snap_05',
    text: 'We\'ve tried AI or automation tools but haven\'t seen clear, measurable results',
    inputType: 'checkbox',
  },
]
