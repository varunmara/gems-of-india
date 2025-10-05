import { Resend } from "resend"

// Lazy initialize Resend to avoid build-time API key requirement
let resend: Resend | null = null

function getResendClient() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

interface EmailPayload {
  to: string
  subject: string
  html: string
}

/**
 * Sends an email using Resend
 * @param payload - Email configuration object
 * @returns Promise that resolves when email is sent
 */
export async function sendEmail(payload: EmailPayload) {
  const { to, subject, html } = payload

  try {
    const resendClient = getResendClient()
    const data = await resendClient.emails.send({
      from: "Gems Of India <contact@gemsofindia.org>",
      to,
      subject,
      html,
    })

    return { success: true, data }
  } catch (error) {
    console.error("Failed to send email:", error)
    throw new Error("Failed to send email")
  }
}
