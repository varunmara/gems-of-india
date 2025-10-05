"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { db } from "@/drizzle/db"
import {
  category,
  entity,
  entityRelationship,
  entityToCategory,
  reviews,
  reviewVotes,
  ReviewWithUser,
  roleAssignment,
  upvote,
  User,
  user,
} from "@/drizzle/db/schema"
import { and, asc, count, desc, eq, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"

// Get session helper
async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

// Get entity by slug
export async function getEntityBySlug(slug: string) {
  // Get entity details - only published entities
  const [entityData] = await db.select().from(entity).where(eq(entity.slug, slug)).limit(1)

  if (!entityData) {
    return null
  }

  // Get creator information if available
  let creator: User | null = null
  if (entityData.createdBy) {
    const [creatorData] = await db
      .select()
      .from(user)
      .where(eq(user.id, entityData.createdBy))
      .limit(1)
    creator = creatorData
  }

  // Get categories
  const categories = await db
    .select({
      id: category.id,
      name: category.name,
    })
    .from(category)
    .innerJoin(entityToCategory, eq(category.id, entityToCategory.categoryId))
    .where(eq(entityToCategory.entityId, entityData.id))

  // Get upvote count
  const [upvoteCount] = await db
    .select({
      count: sql`count(*)`,
    })
    .from(upvote)
    .where(eq(upvote.entityId, entityData.id))

  // Get role assignment
  const roleAssignmentData = await db
    .select()
    .from(roleAssignment)
    .where(eq(roleAssignment.personId, entityData.id))
    .orderBy(desc(roleAssignment.startDate))
    .limit(1)

  // Get review statistics
  const [reviewStats] = await db
    .select({
      totalReviews: count(),
      avgRating: sql<number>`ROUND(AVG(CAST(${reviews.rating} AS DECIMAL)), 1)`,
    })
    .from(reviews)
    .where(eq(reviews.entityId, entityData.id))

  // Get parent entities
  const parentEntities = await getParentEntities(entityData.id)

  return {
    ...entityData,
    categories,
    upvoteCount: Number(upvoteCount?.count || 0),
    reviewStats: {
      totalReviews: Number(reviewStats?.totalReviews || 0),
      avgRating: Number(reviewStats?.avgRating || 0),
    },
    creator,
    parentEntities,
    roleAssignmentData,
  }
}

// Check if a user has upvoted an entity
export async function hasUserUpvoted(entityId: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return false
  }

  const userUpvotes = await db
    .select()
    .from(upvote)
    .where(and(eq(upvote.userId, session.user.id), eq(upvote.entityId, entityId)))
    .limit(1)

  return userUpvotes.length > 0
}

// Update entity description and categories
// Only allowed for entity owners and only if entity is in "scheduled" status
export async function updateEntity(
  entityId: string,
  data: {
    description: string
    categories: string[]
  },
) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" }
  }

  try {
    // Get entity to check ownership and status
    const [entityData] = await db.select().from(entity).where(eq(entity.id, entityId)).limit(1)

    if (!entityData) {
      return { success: false, error: "Entity not found" }
    }

    // Check if user is the owner
    if (entityData.createdBy !== session.user.id) {
      return {
        success: false,
        error: "You don't have permission to edit this entity",
      }
    }

    // Check if entity is in scheduled status
    if (entityData.status !== "scheduled") {
      return {
        success: false,
        error: "You can only edit entities that are pending",
      }
    }

    // Update description
    await db
      .update(entity)
      .set({
        description: data.description,
        updatedAt: new Date(),
      })
      .where(eq(entity.id, entityId))

    // Update categories (remove old ones and add new ones)
    // First, delete existing categories
    await db.delete(entityToCategory).where(eq(entityToCategory.entityId, entityId))

    // Then add new categories
    if (data.categories.length > 0) {
      await db.insert(entityToCategory).values(
        data.categories.map((categoryId) => ({
          entityId: entityId,
          categoryId,
        })),
      )
    }

    // Revalidate the entity page
    revalidatePath(`/${entityData.slug}`)

    return {
      success: true,
      message: "Entity updated successfully",
    }
  } catch (error) {
    console.error("Error updating entity:", error)
    return {
      success: false,
      error: "Failed to update entity",
    }
  }
}

export type SortOption = "newest" | "oldest" | "highest" | "lowest" | "helpful"

// Get reviews for a entity with sorting and pagination
export async function getEntityReviews(
  entityId: string,
  options: {
    sortBy?: SortOption
    limit?: number
    offset?: number
    currentUserId?: string
  } = {},
) {
  const { sortBy = "newest", limit = 10, offset = 0, currentUserId } = options

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

  const reviewsQuery = db
    .select({
      review: reviews,
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

  const result = await reviewsQuery

  return result.map((row) => ({
    ...row.review,
    user: row.user,
    userVote: row.userVote as "helpful" | "not_helpful" | null,
  })) as ReviewWithUser[]
}

// Get parent entities (organizations/departments this entity is a member of)
export async function getParentEntities(entityId: string) {
  const parentEntities = await db
    .select({
      id: entity.id,
      name: entity.name,
      logoUrl: entity.logoUrl,
      entityType: entity.entityType,
      relationshipType: entityRelationship.relationshipType,
      slug: entity.slug,
    })
    .from(entityRelationship)
    .innerJoin(entity, eq(entityRelationship.parentEntityId, entity.id))
    .where(eq(entityRelationship.childEntityId, entityId))

  return parentEntities
}

type RelatedEntity = {
  id: string
  name: string
  logoUrl?: string | null
  entityType: string
  slug: string
  city?: string | null
  state?: string | null
  relationType: string
}

// Get related entities (children, siblings, and location-based)
export async function getRelatedEntities(
  entityId: string,
  entityData: { city?: string | null; state?: string | null },
) {
  const relatedEntities: RelatedEntity[] = []

  try {
    // Get child entities (entities that are members of this entity)
    const childEntities = await db
      .select({
        id: entity.id,
        name: entity.name,
        logoUrl: entity.logoUrl,
        entityType: entity.entityType,
        slug: entity.slug,
        city: entity.city,
        state: entity.state,
        relationType: sql<string>`'child'`,
      })
      .from(entityRelationship)
      .innerJoin(entity, eq(entityRelationship.childEntityId, entity.id))
      .where(and(eq(entityRelationship.parentEntityId, entityId), eq(entity.status, "published")))
      .limit(3)

    relatedEntities.push(...childEntities)

    // Get sibling entities (entities that share the same parent)
    const siblingEntities = await db
      .select({
        id: entity.id,
        name: entity.name,
        logoUrl: entity.logoUrl,
        entityType: entity.entityType,
        slug: entity.slug,
        city: entity.city,
        state: entity.state,
        relationType: sql<string>`'sibling'`,
      })
      .from(entityRelationship)
      .innerJoin(entity, eq(entityRelationship.childEntityId, entity.id))
      .where(
        and(
          eq(
            entityRelationship.parentEntityId,
            sql`(SELECT parent_entity_id FROM entity_relationship WHERE child_entity_id = ${entityId} LIMIT 1)`,
          ),
          sql`${entity.id} != ${entityId}`,
          eq(entity.status, "published"),
        ),
      )
      .limit(3)

    relatedEntities.push(...siblingEntities)

    // Get entities from the same city/state
    if (entityData.city || entityData.state) {
      const locationEntities = await db
        .select({
          id: entity.id,
          name: entity.name,
          logoUrl: entity.logoUrl,
          entityType: entity.entityType,
          slug: entity.slug,
          city: entity.city,
          state: entity.state,
          relationType: sql<string>`'location'`,
        })
        .from(entity)
        .where(
          and(
            sql`${entity.id} != ${entityId}`,
            eq(entity.status, "published"),
            entityData.city
              ? eq(entity.city, entityData.city)
              : eq(entity.state, entityData.state || ""),
          ),
        )
        .limit(4)

      relatedEntities.push(...locationEntities)
    }

    // Remove duplicates and limit to 6 entities
    const uniqueEntities = relatedEntities
      .filter((entity, index, self) => index === self.findIndex((e) => e.id === entity.id))
      .slice(0, 6)

    return uniqueEntities
  } catch (error) {
    console.error("Error fetching related entities:", error)
    return []
  }
}

// Update entity status (admin/maintainer only)
export async function updateEntityStatus(
  entityId: string,
  status: "pending" | "in_review" | "published",
) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" }
  }

  // Check if user is admin or maintainer
  if (!session.user.role || !["admin", "maintainer"].includes(session.user.role)) {
    return {
      success: false,
      error: "You don't have permission to update entity status",
    }
  }

  try {
    // Get entity to check if it exists
    const [entityData] = await db.select().from(entity).where(eq(entity.id, entityId)).limit(1)

    if (!entityData) {
      return { success: false, error: "Entity not found" }
    }

    // Update entity status
    await db
      .update(entity)
      .set({
        status: status,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      })
      .where(eq(entity.id, entityId))

    // Revalidate the entity page
    revalidatePath(`/${entityData.slug}`)

    return {
      success: true,
      message: "Entity status updated successfully",
    }
  } catch (error) {
    console.error("Error updating entity status:", error)
    return {
      success: false,
      error: "Failed to update entity status",
    }
  }
}
