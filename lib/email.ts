import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping email:", { to, subject })
    return null
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to,
    subject,
    html,
  })

  if (error) {
    console.error("Failed to send email:", error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}
