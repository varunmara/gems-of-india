/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/drizzle/db"
import {
  EntityType,
  reviewAttribute,
  reviewAttributeResponse,
  ReviewAttributeResponse,
  reviews,
  reviewTag,
  reviewTagSelection,
} from "@/drizzle/db/schema"
import { and, desc, eq, sql } from "drizzle-orm"

// Fetch attributes for a specific entity type
export async function getAttributesForEntityType(entityType: EntityType) {
  try {
    const attributes = await db
      .select()
      .from(reviewAttribute)
      .where(and(eq(reviewAttribute.entityType, entityType), eq(reviewAttribute.isActive, true)))
      .orderBy(reviewAttribute.displayOrder, reviewAttribute.createdAt)

    return attributes
  } catch (error) {
    console.error("Error fetching attributes:", error)
    return []
  }
}

// Fetch tags for a specific entity type
export async function getTagsForEntityType(entityType: EntityType) {
  try {
    const tags = await db
      .select()
      .from(reviewTag)
      .where(and(eq(reviewTag.entityType, entityType), eq(reviewTag.isActive, true)))
      .orderBy(reviewTag.tagType, reviewTag.name)

    return tags
  } catch (error) {
    console.error("Error fetching tags:", error)
    return []
  }
}

// Calculate attribute statistics for an entity
export async function getAttributeStatsForEntity(entityId: string) {
  try {
    // Get all attribute responses for this entity's reviews
    const attributeStats = await db
      .select({
        attributeId: reviewAttributeResponse.attributeId,
        attribute: reviewAttribute,
        responses: sql<ReviewAttributeResponse[]>`json_agg(${reviewAttributeResponse})`,
        count: sql<number>`count(*)::int`,
      })
      .from(reviewAttributeResponse)
      .innerJoin(reviews, eq(reviewAttributeResponse.reviewId, reviews.id))
      .innerJoin(reviewAttribute, eq(reviewAttributeResponse.attributeId, reviewAttribute.id))
      .where(eq(reviews.entityId, entityId))
      .groupBy(reviewAttributeResponse.attributeId, reviewAttribute.id)

    // Calculate averages and percentages
    const processedStats = attributeStats.map((stat) => {
      let averageScore: number | undefined
      let positivePercentage: number | undefined

      if (stat.attribute.attributeType === "scale") {
        const scores = stat.responses
          .map((r: any) => r.value?.score)
          .filter((score) => typeof score === "number")

        if (scores.length > 0) {
          averageScore =
            scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
        }
      } else if (stat.attribute.attributeType === "boolean") {
        const booleanValues = stat.responses
          .map((r: any) => r.value?.value)
          .filter((value) => typeof value === "boolean")

        if (booleanValues.length > 0) {
          const positiveCount = booleanValues.filter((value) => value === true).length
          positivePercentage = (positiveCount / booleanValues.length) * 100
        }
      }

      return {
        ...stat.attribute,
        responses: stat.responses,
        averageScore,
        positivePercentage,
      }
    })

    return processedStats
  } catch (error) {
    console.error("Error fetching attribute stats:", error)
    return []
  }
}

// Calculate tag statistics for an entity
export async function getTagStatsForEntity(entityId: string) {
  try {
    const tagStats = await db
      .select({
        tagId: reviewTagSelection.tagId,
        tag: reviewTag,
        count: sql<number>`count(*)::int`,
      })
      .from(reviewTagSelection)
      .innerJoin(reviews, eq(reviewTagSelection.reviewId, reviews.id))
      .innerJoin(reviewTag, eq(reviewTagSelection.tagId, reviewTag.id))
      .where(eq(reviews.entityId, entityId))
      .groupBy(reviewTagSelection.tagId, reviewTag.id)
      .orderBy(desc(sql`count(*)`))

    // Get total review count for percentage calculation
    const totalReviewsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(eq(reviews.entityId, entityId))

    const totalReviews = totalReviewsResult[0]?.count || 0

    // Calculate percentages
    const processedStats = tagStats.map((stat) => ({
      ...stat.tag,
      count: stat.count,
      percentage: totalReviews > 0 ? (stat.count / totalReviews) * 100 : 0,
    }))

    return processedStats
  } catch (error) {
    console.error("Error fetching tag stats:", error)
    return []
  }
}

// Save review with attributes and tags
export async function saveReviewWithExtras(
  reviewData: {
    userId: string
    entityId: string
    rating: number
    title: string
    content: string
    overallSatisfaction?: number
    recommendToOthers?: boolean
    hasEvidence?: boolean
    isAnonymous?: boolean
    experienceDate?: string
  },
  attributeResponses: Record<string, any>,
  selectedTagIds: string[],
) {
  try {
    const result = await db.transaction(async (tx) => {
      // Insert the main review
      const [review] = await tx
        .insert(reviews)
        .values({
          ...reviewData,
          experienceDate: reviewData.experienceDate
            ? new Date(reviewData.experienceDate)
            : undefined,
        })
        .returning()

      // Insert attribute responses
      if (Object.keys(attributeResponses).length > 0) {
        const attributeResponsesData = Object.entries(attributeResponses).map(
          ([attributeId, value]) => ({
            reviewId: review.id,
            attributeId,
            value,
          }),
        )

        await tx.insert(reviewAttributeResponse).values(attributeResponsesData)
      }

      // Insert tag selections
      if (selectedTagIds.length > 0) {
        const tagSelectionsData = selectedTagIds.map((tagId) => ({
          reviewId: review.id,
          tagId,
        }))

        await tx.insert(reviewTagSelection).values(tagSelectionsData)
      }

      return review
    })

    return { success: true, reviewId: result.id }
  } catch (error) {
    console.error("Error saving review with extras:", error)
    return { success: false, error: "Failed to save review" }
  }
}

// Get reviews with attributes and tags for an entity
export async function getEnhancedReviewsForEntity(entityId: string, limit = 10, offset = 0) {
  try {
    // This is a complex query that would need to be built step by step
    // For now, return basic reviews and fetch attributes/tags separately
    const reviewsData = await db
      .select()
      .from(reviews)
      .where(eq(reviews.entityId, entityId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset)

    // For each review, fetch its attributes and tags
    const enhancedReviews = await Promise.all(
      reviewsData.map(async (review) => {
        // Fetch attribute responses
        const attributeResponses = await db
          .select({
            id: reviewAttributeResponse.id,
            attributeId: reviewAttributeResponse.attributeId,
            value: reviewAttributeResponse.value,
            createdAt: reviewAttributeResponse.createdAt,
            attribute: reviewAttribute,
          })
          .from(reviewAttributeResponse)
          .innerJoin(reviewAttribute, eq(reviewAttributeResponse.attributeId, reviewAttribute.id))
          .where(eq(reviewAttributeResponse.reviewId, review.id))

        // Fetch tag selections
        const tags = await db
          .select({
            id: reviewTagSelection.tagId,
            tagId: reviewTagSelection.tagId,
            reviewId: reviewTagSelection.reviewId,
            createdAt: reviewTagSelection.createdAt,
            tag: reviewTag,
          })
          .from(reviewTagSelection)
          .innerJoin(reviewTag, eq(reviewTagSelection.tagId, reviewTag.id))
          .where(eq(reviewTagSelection.reviewId, review.id))

        return {
          ...review,
          attributeResponses,
          tags,
          user: {
            id: review.userId,
            name: "User Name", // This would come from a join with users table
            image: null,
          },
        }
      }),
    )

    return enhancedReviews
  } catch (error) {
    console.error("Error fetching enhanced reviews:", error)
    return []
  }
}
