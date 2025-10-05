import { NextRequest, NextResponse } from "next/server"

import { EntityType, ReviewAttribute, ReviewTag } from "@/drizzle/db/schema"

import {
  getAttributesForEntityType,
  getAttributeStatsForEntity,
  getTagsForEntityType,
  getTagStatsForEntity,
} from "@/lib/review-attributes"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get("entityType") as EntityType
    const entityId = searchParams.get("entityId")

    if (!entityType) {
      return NextResponse.json({ error: "entityType is required" }, { status: 400 })
    }

    // Get attributes and tags for the entity type
    const [attributes, tags] = await Promise.all([
      getAttributesForEntityType(entityType),
      getTagsForEntityType(entityType),
    ])

    // Get stats if entityId is provided
    let attributeStats: ReviewAttribute[] = []
    let tagStats: ReviewTag[] = []

    if (entityId) {
      const [attributeStatsData, tagStatsData] = await Promise.all([
        getAttributeStatsForEntity(entityId),
        getTagStatsForEntity(entityId),
      ])
      attributeStats = attributeStatsData
      tagStats = tagStatsData
    }

    return NextResponse.json({
      attributes,
      tags,
      attributeStats,
      tagStats,
    })
  } catch (error) {
    console.error("Error fetching review attributes:", error)
    return NextResponse.json({ error: "Failed to fetch review attributes" }, { status: 500 })
  }
}
