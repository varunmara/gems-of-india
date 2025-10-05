import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { saveReviewWithExtras } from "@/lib/review-attributes"

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const {
      entityId,
      rating,
      title,
      content,
      overallSatisfaction,
      recommendToOthers,
      hasEvidence,
      isAnonymous,
      experienceDate,
      attributeResponses,
      selectedTagIds,
    } = body

    // Validate required fields
    if (!entityId || !rating || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await saveReviewWithExtras(
      {
        userId: session.user.id,
        entityId,
        rating,
        title,
        content,
        overallSatisfaction,
        recommendToOthers,
        hasEvidence,
        isAnonymous,
        experienceDate,
      },
      attributeResponses || {},
      selectedTagIds || [],
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, reviewId: result.reviewId })
  } catch (error) {
    console.error("Error creating enhanced review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
