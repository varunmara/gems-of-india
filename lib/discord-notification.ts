/**
 * Utility for sending notifications to Discord via webhook
 */

import { db } from "@/drizzle/db"
import { entity, user } from "@/drizzle/db/schema"
import { eq } from "drizzle-orm"

interface DiscordEmbed {
  title: string
  color: number
  description: string
  url?: string
  fields: {
    name: string
    value: string
    inline: boolean
  }[]
  footer: {
    text: string
  }
  timestamp: string
}

interface DiscordMessage {
  embeds: DiscordEmbed[]
}

/**
 * Send a Discord notification for a new comment
 * @param entityId ID of the entity where the comment was posted
 * @param userId ID of the user who posted the comment
 * @param commentText Text of the comment
 */
export async function sendDiscordCommentNotification(
  entityId: string,
  userId: string,
  commentText: string,
): Promise<boolean> {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL

    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL is not defined in environment variables")
      return false
    }

    // Retrieve user information
    let userInfo = { email: userId, name: "Unknown User" }
    try {
      const userResult = await db
        .select({ email: user.email, name: user.name })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1)

      if (userResult.length > 0) {
        userInfo = userResult[0]
      }
    } catch (error) {
      console.error("Error retrieving user information:", error)
    }

    // Retrieve entity information
    let entityInfo = { slug: entityId, name: "Unknown Entity" }
    try {
      const entityResult = await db
        .select({ slug: entity.slug, name: entity.name })
        .from(entity)
        .where(eq(entity.id, entityId))
        .limit(1)

      if (entityResult.length > 0) {
        entityInfo = entityResult[0]
      }
    } catch (error) {
      console.error("Error retrieving entity information:", error)
    }

    // Build entity URL
    const entityUrl = `${process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"}/${entityInfo.slug}`

    // Truncate comment text if it's too long
    const truncatedText =
      commentText.length > 1500 ? commentText.substring(0, 1500) + "..." : commentText

    // Create message to send to Discord
    const message: DiscordMessage = {
      embeds: [
        {
          title: "New Comment",
          color: 0x00ff00, // Green for Gems of India
          description: truncatedText,
          url: entityUrl,
          fields: [
            {
              name: "Entity",
              value: `[${entityInfo.name}](${entityUrl})`,
              inline: true,
            },
            {
              name: "User",
              value: `${userInfo.name} (${userInfo.email})`,
              inline: true,
            },
          ],
          footer: {
            text: "Gems of India Comment Notification",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    }

    // Send request to Discord webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      console.error(`Error sending to Discord: ${response.status} ${response.statusText}`)
      return false
    }

    return true
  } catch (error) {
    console.error("Error sending Discord notification:", error)
    return false
  }
}

/**
 * Send a Discord notification for a submitted entity
 * @param entityName Name of the entity being submitted
 * @param state State of the entity
 * @param city City of the entity
 * @param websiteUrl URL of the entity website
 * @param entityUrl URL of the entity page on Gems of India
 * @param userId ID of the user who submitted the entity
 */
export async function notifyDiscordEntity(
  entityName: string,
  state: string,
  city: string,
  websiteUrl: string,
  entityUrl: string,
  userId?: string,
): Promise<boolean> {
  try {
    const webhookUrl = process.env.DISCORD_LAUNCH_WEBHOOK_URL

    if (!webhookUrl) {
      console.error("Discord webhook URL is not defined")
      return false
    }

    const submittedByFieldValue = await (async () => {
      if (!userId) return "N/A (User ID not provided)"
      try {
        const userResult = await db
          .select({ email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1)

        if (userResult.length > 0 && userResult[0].name && userResult[0].email) {
          return `${userResult[0].name} (${userResult[0].email})`
        } else {
          console.warn(`[DiscordNotify] User info not found for ID: ${userId}`)
          return `User ID: ${userId} (Info not fully available)`
        }
      } catch (error) {
        console.error("[DiscordNotify] Error retrieving user info:", error)
        return `User ID: ${userId} (Error fetching info)`
      }
    })()

    const submittedByField = {
      name: "Submitted By",
      value: submittedByFieldValue,
      inline: true,
    }

    // Create message to send to Discord
    const message = {
      embeds: [
        {
          title: "New Entity Submitted",
          color: 0x00ff00,
          url: entityUrl,
          description: `New entity submitted: ${entityName}`,
          fields: [
            {
              name: "Entity URL",
              value: `[Visit Entity](${entityUrl})`,
              inline: true,
            },
            {
              name: "State",
              value: state,
              inline: true,
            },
            {
              name: "City",
              value: city,
              inline: true,
            },
            {
              name: "Website URL",
              value: `[Visit Website](${websiteUrl})`,
              inline: true,
            },
            submittedByField,
          ],
          footer: {
            text: "Gems of India Notification",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    }

    // Send request to Discord webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      console.error(`Error sending to Discord: ${response.status} ${response.statusText}`)
      return false
    }

    return true
  } catch (error) {
    console.error("Error sending Discord notification:", error)
    return false
  }
}
