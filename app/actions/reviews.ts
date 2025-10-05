/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { db } from "@/drizzle/db"
import {
  EntityType,
  ReviewAttribute,
  reviews,
  ReviewTag,
  reviewVotes,
  ReviewWithUser,
  user,
} from "@/drizzle/db/schema"
import { and, asc, count, desc, eq, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"
import {
  getAttributesForEntityType,
  getAttributeStatsForEntity,
  getTagsForEntityType,
  getTagStatsForEntity,
  saveReviewWithExtras,
} from "@/lib/review-attributes"

// Get session helper
async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

export type SortOption = "newest" | "oldest" | "highest" | "lowest" | "helpful"

// Get reviews for an entity with sorting and pagination
export async function getEntityReviews(
  entityId: string,
  options: {
    sortBy?: SortOption
    limit?: number
    offset?: number
  } = {},
) {
  const { sortBy = "newest", limit = 10, offset = 0 } = options
  const session = await getSession()
  const currentUserId = session?.user?.id

  let orderBy
  switch (sortBy) {
    case "newest":
      orderBy = desc(reviews.createdAt)
      break
    case "oldest":
      orderBy = asc(reviews.createdAt)
      break
    case "highest":
      orderBy = desc(reviews.rating)
      break
    case "lowest":
      orderBy = asc(reviews.rating)
      break
    case "helpful":
      orderBy = desc(reviews.helpful)
      break
    default:
      orderBy = desc(reviews.createdAt)
  }

  const result = await db
    .select({
      id: reviews.id,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      userId: reviews.userId,
      entityId: reviews.entityId,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      helpful: reviews.helpful,
      notHelpful: reviews.notHelpful,
      verified: reviews.verified,
      edited: reviews.edited,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.image,
        verified: user.emailVerified,
      },
      userVote: currentUserId
        ? sql<string | null>`
            (SELECT vote_type FROM ${reviewVotes} 
             WHERE review_id = ${reviews.id} AND user_id = ${currentUserId})
          `
        : sql<null>`NULL`,
    })
    .from(reviews)
    .innerJoin(user, eq(reviews.userId, user.id))
    .where(eq(reviews.entityId, entityId))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset)

  return result.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    userId: row.userId,
    entityId: row.entityId,
    rating: row.rating,
    title: row.title,
    content: row.content,
    helpful: row.helpful || 0,
    notHelpful: row.notHelpful || 0,
    verified: row.verified || false,
    edited: row.edited || false,
    user: {
      id: row.user.id,
      name: row.user.name || "Anonymous",
      avatar: row.user.avatar,
      verified: Boolean(row.user.verified),
    },
    userVote: row.userVote as "helpful" | "not_helpful" | null,
  })) as ReviewWithUser[]
}

// Get review statistics for an entity
export async function getReviewStats(entityId: string) {
  const stats = await db
    .select({
      totalReviews: count(),
      avgRating: sql<number>`ROUND(AVG(${reviews.rating}), 1)`,
      ratingDistribution: sql<Record<string, number>>`
        JSON_OBJECT(
          '1', COUNT(CASE WHEN ${reviews.rating} = 1 THEN 1 END),
          '2', COUNT(CASE WHEN ${reviews.rating} = 2 THEN 1 END),
          '3', COUNT(CASE WHEN ${reviews.rating} = 3 THEN 1 END),
          '4', COUNT(CASE WHEN ${reviews.rating} = 4 THEN 1 END),
          '5', COUNT(CASE WHEN ${reviews.rating} = 5 THEN 1 END)
        )
      `,
    })
    .from(reviews)
    .where(eq(reviews.entityId, entityId))

  return stats[0] || { totalReviews: 0, avgRating: 0, ratingDistribution: {} }
}

// Create a new review
export async function createReview(data: {
  entityId: string
  rating: number
  title: string
  content: string
}) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" }
  }

  // Validate input
  if (data.rating < 1 || data.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5" }
  }

  if (!data.title.trim() || data.title.length > 100) {
    return { success: false, error: "Title must be between 1 and 100 characters" }
  }

  if (!data.content.trim() || data.content.length > 1000) {
    return { success: false, error: "Content must be between 1 and 1000 characters" }
  }

  try {
    // Check if user already reviewed this entity
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.entityId, data.entityId), eq(reviews.userId, session.user.id)))
      .limit(1)

    if (existingReview.length > 0) {
      return { success: false, error: "You have already reviewed this entity" }
    }

    const [newReview] = await db
      .insert(reviews)
      .values({
        entityId: data.entityId,
        userId: session.user.id,
        rating: data.rating,
        title: data.title.trim(),
        content: data.content.trim(),
        helpful: 0,
        notHelpful: 0,
        verified: false,
        edited: false,
      })
      .returning()

    revalidatePath(`/entities/${data.entityId}`)

    return {
      success: true,
      review: newReview,
    }
  } catch (error) {
    console.error("Error creating review:", error)
    return {
      success: false,
      error: "Failed to create review",
    }
  }
}

// Update a review
export async function updateReview(
  reviewId: string,
  data: {
    rating: number
    title: string
    content: string
  },
) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" }
  }

  // Validate input
  if (data.rating < 1 || data.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5" }
  }

  if (!data.title.trim() || data.title.length > 100) {
    return { success: false, error: "Title must be between 1 and 100 characters" }
  }

  if (!data.content.trim() || data.content.length > 1000) {
    return { success: false, error: "Content must be between 1 and 1000 characters" }
  }

  try {
    // Check if user owns this review
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (!existingReview) {
      return { success: false, error: "Review not found" }
    }

    if (
      existingReview.userId !== session.user.id &&
      session.user.role !== "admin" &&
      session.user.role !== "maintainer"
    ) {
      return { success: false, error: "You can only edit your own reviews" }
    }

    const [updatedReview] = await db
      .update(reviews)
      .set({
        rating: data.rating,
        title: data.title.trim(),
        content: data.content.trim(),
        edited: true,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning()

    revalidatePath(`/entities/${existingReview.entityId}`)

    return {
      success: true,
      review: updatedReview,
    }
  } catch (error) {
    console.error("Error updating review:", error)
    return {
      success: false,
      error: "Failed to update review",
    }
  }
}

// Delete a review
export async function deleteReview(reviewId: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" }
  }

  try {
    // Check if user owns this review
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (!existingReview) {
      return { success: false, error: "Review not found" }
    }

    if (
      existingReview.userId !== session.user.id &&
      session.user.role !== "admin" &&
      session.user.role !== "maintainer"
    ) {
      return { success: false, error: "You can only delete your own reviews" }
    }

    await db.delete(reviews).where(eq(reviews.id, reviewId))

    revalidatePath(`/entities/${existingReview.entityId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting review:", error)
    return {
      success: false,
      error: "Failed to delete review",
    }
  }
}

// Vote on a review (helpful/not helpful)
export async function voteOnReview(reviewId: string, voteType: "helpful" | "not_helpful") {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" }
  }

  try {
    // Check if user already voted on this review
    const [existingVote] = await db
      .select()
      .from(reviewVotes)
      .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.userId, session.user.id)))
      .limit(1)

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if same type
        await db
          .delete(reviewVotes)
          .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.userId, session.user.id)))

        // Update review counts
        const updateField = voteType === "helpful" ? "helpful" : "notHelpful"
        await db
          .update(reviews)
          .set({
            [updateField]: sql`${reviews[updateField]} - 1`,
          })
          .where(eq(reviews.id, reviewId))
      } else {
        // Update vote type
        await db
          .update(reviewVotes)
          .set({ voteType })
          .where(and(eq(reviewVotes.reviewId, reviewId), eq(reviewVotes.userId, session.user.id)))

        // Update review counts (remove old, add new)
        const oldField = existingVote.voteType === "helpful" ? "helpful" : "notHelpful"
        const newField = voteType === "helpful" ? "helpful" : "notHelpful"

        await db
          .update(reviews)
          .set({
            [oldField]: sql`${reviews[oldField]} - 1`,
            [newField]: sql`${reviews[newField]} + 1`,
          })
          .where(eq(reviews.id, reviewId))
      }
    } else {
      // Create new vote
      await db.insert(reviewVotes).values({
        reviewId,
        userId: session.user.id,
        voteType,
      })

      // Update review counts
      const updateField = voteType === "helpful" ? "helpful" : "notHelpful"
      await db
        .update(reviews)
        .set({
          [updateField]: sql`${reviews[updateField]} + 1`,
        })
        .where(eq(reviews.id, reviewId))
    }

    // Get the review to find entity ID for revalidation
    const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1)

    if (review) {
      revalidatePath(`/entities/${review.entityId}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error voting on review:", error)
    return {
      success: false,
      error: "Failed to vote on review",
    }
  }
}

// Check if user can review an entity (hasn't reviewed it yet)
export async function canUserReview(entityId: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return false
  }

  const existingReview = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.entityId, entityId), eq(reviews.userId, session.user.id)))
    .limit(1)

  return existingReview.length === 0
}

// Enhanced review system functions

// Get enhanced review data (attributes, tags, stats)
export async function getEnhancedReviewData(entityType: EntityType, entityId?: string) {
  try {
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

    return {
      success: true,
      data: {
        attributes,
        tags,
        attributeStats,
        tagStats,
      },
    }
  } catch (error) {
    console.error("Error fetching enhanced review data:", error)
    return {
      success: false,
      error: "Failed to fetch enhanced review data",
      data: {
        attributes: [],
        tags: [],
        attributeStats: [],
        tagStats: [],
      },
    }
  }
}

// Create enhanced review with attributes and tags
export async function createEnhancedReview(data: {
  entityId: string
  rating: number
  title: string
  content: string
  overallSatisfaction?: number
  recommendToOthers?: boolean
  hasEvidence?: boolean
  isAnonymous?: boolean
  experienceDate?: string
  attributeResponses?: Record<string, any>
  selectedTagIds?: string[]
}) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" }
  }

  // Validate required fields
  if (!data.entityId || !data.rating || !data.title || !data.content) {
    return { success: false, error: "Missing required fields" }
  }

  if (data.rating < 1 || data.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5" }
  }

  if (!data.title.trim() || data.title.length > 100) {
    return { success: false, error: "Title must be between 1 and 100 characters" }
  }

  if (!data.content.trim() || data.content.length > 1000) {
    return { success: false, error: "Content must be between 1 and 1000 characters" }
  }

  try {
    // Check if user already reviewed this entity
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.entityId, data.entityId), eq(reviews.userId, session.user.id)))
      .limit(1)

    if (existingReview.length > 0) {
      return { success: false, error: "You have already reviewed this entity" }
    }

    const result = await saveReviewWithExtras(
      {
        userId: session.user.id,
        entityId: data.entityId,
        rating: data.rating,
        title: data.title.trim(),
        content: data.content.trim(),
        overallSatisfaction: data.overallSatisfaction,
        recommendToOthers: data.recommendToOthers,
        hasEvidence: data.hasEvidence,
        isAnonymous: data.isAnonymous,
        experienceDate: data.experienceDate,
      },
      data.attributeResponses || {},
      data.selectedTagIds || [],
    )

    if (!result.success) {
      return { success: false, error: result.error }
    }

    revalidatePath(`/entities/${data.entityId}`)

    return {
      success: true,
      reviewId: result.reviewId,
    }
  } catch (error) {
    console.error("Error creating enhanced review:", error)
    return {
      success: false,
      error: "Failed to create enhanced review",
    }
  }
}
