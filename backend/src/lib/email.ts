import nodemailer from 'nodemailer'
import type { Locale } from './i18n.js'
import { translate } from './i18n.js'

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
})

const FROM = process.env.FROM_EMAIL || 'noreply@example.com'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

export async function sendVerificationEmail(
  to: string,
  name: string,
  petitionTitle: string,
  token: string,
  locale: Locale = 'en',
) {
  const link = `${APP_URL}/verify/${token}`
  await transport.sendMail({
    from: FROM,
    to,
    subject: translate(locale, 'api.please_verify_your_signature_var', { petitionTitle }),
    text: translate(
      locale,
      'Hi {{name}},\n\nThank you for signing \"{{petitionTitle}}\".\n\nPlease verify your email by clicking the link below:\n{{link}}\n\nThis link expires in 24 hours.\n\nIf you did not sign this petition, please ignore this email.',
      { name, petitionTitle, link },
    ),
    html: `<p>${translate(locale, 'api.hi_var', { name })}</p>
<p>${translate(locale, 'api.thank_you_for_signing')} <strong>${petitionTitle}</strong>.</p>
<p><a href="${link}">${translate(locale, 'api.verify_your_email_address')}</a></p>
<p>${translate(locale, 'api.this_link_expires_in_24_hours')}</p>
<p>${translate(locale, 'api.if_you_did_not_sign_this_petition_please_ignore_this_email')}</p>`,
  })
}

export async function sendWithdrawalEmail(
  to: string,
  name: string,
  petitionTitle: string,
  token: string,
  locale: Locale = 'en',
) {
  const link = `${APP_URL}/withdraw/${token}`
  await transport.sendMail({
    from: FROM,
    to,
    subject: translate(locale, 'api.withdraw_your_signature_var', { petitionTitle }),
    text: translate(
      locale,
      'Hi {{name}},\n\nYou requested to withdraw your signature from \"{{petitionTitle}}\".\n\nClick the link below to confirm:\n{{link}}\n\nThis link expires in 24 hours.',
      { name, petitionTitle, link },
    ),
    html: `<p>${translate(locale, 'api.hi_var', { name })}</p>
<p>${translate(locale, 'api.you_requested_to_withdraw_your_signature_from')} <strong>${petitionTitle}</strong>.</p>
<p><a href="${link}">${translate(locale, 'api.confirm_withdrawal')}</a></p>
<p>${translate(locale, 'api.this_link_expires_in_24_hours')}</p>`,
  })
}

export async function sendUpdateEmail(
  to: string,
  name: string,
  petitionTitle: string,
  message: string,
  locale: Locale = 'en',
) {
  await transport.sendMail({
    from: FROM,
    to,
    subject: translate(locale, 'api.update_on_petition_var', { petitionTitle }),
    text: translate(locale, 'api.hi_var_n_nvar_n_n_the_opet_team', { name, message }),
    html: `<p>${translate(locale, 'api.hi_var', { name })}</p><p>${message}</p><p>${translate(locale, 'api.the_opet_team')}</p>`,
  })
}
