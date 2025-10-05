"use server"

import { headers } from "next/headers"

import { z } from "zod"

import { auth } from "@/lib/auth"
import { notifyDiscordEntity as sendRealDiscordEntityNotification } from "@/lib/discord-notification"

const DiscordNotificationSchema = z.object({
  entityName: z
    .string()
    .min(1, "Entity name cannot be empty.")
    .max(100, "Entity name cannot exceed 100 characters."),
  state: z.string().min(1, "State cannot be empty."),
  city: z.string().min(1, "City cannot be empty."),
  websiteUrl: z.string().url("Invalid website URL format.").min(1, "Website URL cannot be empty."),
  entityUrl: z.string().url("Invalid entity URL format.").min(1, "Entity URL cannot be empty."),
})

export async function notifyDiscordLaunch(
  entityName: string,
  state: string,
  city: string,
  websiteUrl: string,
  entityUrl: string,
) {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session?.user?.id) {
    console.error("[DiscordNotify] Unauthorized attempt: No active session.")
    return { success: false, error: "Unauthorized: User not authenticated." }
  }

  const authenticatedUserId = session.user.id

  const validation = DiscordNotificationSchema.safeParse({
    entityName,
    state,
    city,
    websiteUrl,
    entityUrl,
  })

  if (!validation.success) {
    console.error(
      "[DiscordNotify] Invalid data for notification:",
      JSON.stringify(validation.error.flatten()),
    )
    return {
      success: false,
      error: "Invalid data provided for Discord notification.",
      details: validation.error.flatten().fieldErrors,
    }
  }

  const validatedData = validation.data

  try {
    console.log(
      `[DiscordNotify] Sending notification for entity: ${validatedData.entityName}, Initiated by User ID: ${authenticatedUserId}`,
    )
    const result = await sendRealDiscordEntityNotification(
      validatedData.entityName,
      validatedData.state,
      validatedData.city,
      validatedData.websiteUrl,
      validatedData.entityUrl,
    )
    if (result) {
      console.log(
        `[DiscordNotify] Successfully sent notification for entity: ${validatedData.entityName}`,
      )
      return { success: true }
    } else {
      console.warn(
        `[DiscordNotify] sendRealDiscordLaunchNotification returned false for entity: ${validatedData.entityName}`,
      )
      return { success: false, error: "Notification sending function indicated failure." }
    }
  } catch (error) {
    console.error(
      `[DiscordNotify] Error sending Discord launch notification for entity: ${validatedData.entityName}, User ID: ${authenticatedUserId}:`,
      error,
    )
    return {
      success: false,
      error: "Internal server error during Discord notification.",
    }
  }
}
