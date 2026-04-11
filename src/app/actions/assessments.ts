'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function createAssessment(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const supabase = createServiceClient()

  const usesSalesforce = formData.get('uses_salesforce') === 'yes'
  const rawClouds = formData.getAll('salesforce_clouds') as string[]
  const salesforceClouds = usesSalesforce && rawClouds.length ? rawClouds : null

  const str = (key: string): string | null =>
    (formData.get(key) as string)?.trim() || null

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      status: 'pending',
      // Contact
      contact_first_name: str('contact_first_name'),
      contact_last_name:  str('contact_last_name'),
      contact_title:      str('contact_title'),
      contact_email:      str('contact_email'),
      contact_phone:      str('contact_phone'),
      contact_linkedin:   str('contact_linkedin'),
      // Company
      company_name:         str('company_name'),
      company_industry:     str('company_industry'),
      company_size:         str('company_size'),
      company_revenue:      str('company_revenue'),
      company_headquarters: str('company_headquarters'),
      company_website:      str('company_website'),
      // AI context
      ai_motivation:     str('ai_motivation'),
      ai_current_usage:  str('ai_current_usage'),
      uses_salesforce:   usesSalesforce,
      salesforce_edition: usesSalesforce ? str('salesforce_edition') : null,
      salesforce_clouds:  salesforceClouds,
      // AE info
      ae_name:   str('ae_name'),
      ae_email:  str('ae_email'),
      ae_region: str('ae_region'),
      ae_notes:  str('ae_notes'),
    })
    .select('id, token, contact_first_name, contact_last_name, contact_email, company_name')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create assessment.' }
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  const assessmentUrl = `${siteUrl}/assess/${data.token}`
  const contactName =
    [data.contact_first_name, data.contact_last_name].filter(Boolean).join(' ') || 'there'

  if (data.contact_email) {
    try {
      // NOTE: update the `from` address to a verified Resend domain before deploying
      await resend.emails.send({
        from: 'IMG Assessments <assessments@growwithimg.com>',
        to: data.contact_email,
        subject: `Your AI Readiness Assessment${data.company_name ? ` — ${data.company_name}` : ''}`,
        html: inviteEmailHtml({ contactName, assessmentUrl, companyName: data.company_name }),
      })
    } catch (emailErr) {
      // Assessment is already created — don't fail the whole operation
      console.error('[Resend] Failed to send invite email:', emailErr)
    }
  }

  return undefined
}

// ─── Email template ───────────────────────────────────────────────────────────

function inviteEmailHtml({
  contactName,
  assessmentUrl,
  companyName,
}: {
  contactName: string
  assessmentUrl: string
  companyName: string | null
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:#1d4ed8;padding:32px 40px;">
          <p style="margin:0;color:#93c5fd;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;">Powered by IMG</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">
            AI Readiness Assessment
          </h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hi ${contactName},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.65;">
            ${companyName ? `Your AI Readiness Assessment for <strong>${companyName}</strong> is ready.` : 'Your AI Readiness Assessment is ready.'}
            This assessment helps us understand your organization's current AI capabilities and identify the best path forward with Salesforce Agentforce.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.65;">
            It takes approximately <strong>15–20 minutes</strong> to complete. You can save your progress and return at any time using the link below — no account required.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 32px;">
            <tr><td style="border-radius:8px;background:#1d4ed8;">
              <a href="${assessmentUrl}"
                style="display:block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:.01em;">
                Start Your Assessment &rarr;
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Or copy this link into your browser:</p>
          <p style="margin:0;font-size:13px;color:#1d4ed8;word-break:break-all;">${assessmentUrl}</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
            This link is unique to your assessment — please keep it private. If you have questions, reply to this email and your account executive will follow up.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
