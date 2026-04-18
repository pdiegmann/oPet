import nodemailer from 'nodemailer'

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
) {
  const link = `${APP_URL}/verify/${token}`
  await transport.sendMail({
    from: FROM,
    to,
    subject: `Please verify your signature – ${petitionTitle}`,
    text: `Hi ${name},\n\nThank you for signing "${petitionTitle}".\n\nPlease verify your email by clicking the link below:\n${link}\n\nThis link expires in 24 hours.\n\nIf you did not sign this petition, please ignore this email.`,
    html: `<p>Hi ${name},</p>
<p>Thank you for signing <strong>${petitionTitle}</strong>.</p>
<p><a href="${link}">Verify your email address</a></p>
<p>This link expires in 24 hours.</p>
<p>If you did not sign this petition, please ignore this email.</p>`,
  })
}

export async function sendWithdrawalEmail(
  to: string,
  name: string,
  petitionTitle: string,
  token: string,
) {
  const link = `${APP_URL}/withdraw/${token}`
  await transport.sendMail({
    from: FROM,
    to,
    subject: `Withdraw your signature – ${petitionTitle}`,
    text: `Hi ${name},\n\nYou requested to withdraw your signature from "${petitionTitle}".\n\nClick the link below to confirm:\n${link}\n\nThis link expires in 24 hours.`,
    html: `<p>Hi ${name},</p>
<p>You requested to withdraw your signature from <strong>${petitionTitle}</strong>.</p>
<p><a href="${link}">Confirm withdrawal</a></p>
<p>This link expires in 24 hours.</p>`,
  })
}

export async function sendUpdateEmail(
  to: string,
  name: string,
  petitionTitle: string,
  message: string,
) {
  await transport.sendMail({
    from: FROM,
    to,
    subject: `Update on petition: ${petitionTitle}`,
    text: `Hi ${name},\n\n${message}\n\n– The oPet team`,
    html: `<p>Hi ${name},</p><p>${message}</p><p>– The oPet team</p>`,
  })
}
