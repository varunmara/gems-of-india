import { sendEmail } from "@/lib/email"

interface BasicUser {
  email: string
  name: string | null
}

const APP_URL = process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"

export async function sendEntityReminderEmail({
  entityName,
  entitySlug,
  user,
}: {
  user: BasicUser
  entityName: string
  entitySlug: string
}) {
  const effectiveUserName = user.name || "Creator"
  const effectiveUserEmail = user.email

  const subject = `🚀 ${entityName} is Live on Gems Of India!`
  const entityUrl = `${APP_URL}/${entitySlug}`

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="font-size: 22px; color: #1a1a1a;">Hi ${effectiveUserName},</h1>
      <p>Just a quick heads-up: your gem, <strong>${entityName}</strong>, is live on Gems Of India!</p>
      <p>You can view your gem here: <a href="${entityUrl}">${entityUrl}</a></p> 
      <p style="margin-top: 25px;">Best of luck!</p>
      <p>The Gems Of India Team</p>
    </div>
  `

  return sendEmail({
    to: effectiveUserEmail,
    subject,
    html: htmlBody,
  })
}
