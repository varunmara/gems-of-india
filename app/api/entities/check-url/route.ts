import { NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import { entity } from "@/drizzle/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    // Normalize the URL for comparison
    const normalizedUrl = url.toLowerCase().replace(/\/$/, "")

    // Check if the URL already exists
    const [existingEntity] = await db
      .select({ id: entity.id, status: entity.status })
      .from(entity)
      .where(eq(entity.websiteUrl, normalizedUrl))

    // If no entity found, the URL is available
    if (!existingEntity) {
      return NextResponse.json({ exists: false })
    }

    // If the entity exists, the URL is considered taken
    return NextResponse.json({ exists: true })
  } catch (error) {
    console.error("Error checking URL:", error)
    return NextResponse.json({ error: "Failed to check URL" }, { status: 500 })
  }
}
