"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { db } from "@/drizzle/db"
import {
  category as categoryTable,
  entityRelationship,
  entityStatus,
  entity as entityTable,
  entityToCategory,
  EntityType,
  reviews,
  RoleAssignment,
  roleAssignment,
  upvote,
} from "@/drizzle/db/schema"
import { and, asc, count, desc, eq, ilike, inArray, or, SQL, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"

// Function to generate a unique slug
async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  // Check if the slug exists in the entity table
  const existingEntity = await db.query.entity.findFirst({
    where: eq(entityTable.slug, baseSlug),
  })

  if (!existingEntity) {
    return baseSlug
  }

  // If the slug exists, add a random suffix
  const randomSuffix = Math.floor(Math.random() * 10000)
  return `${baseSlug}-${randomSuffix}`
}

// Get session helper
async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

// Get all categories
export async function getAllCategories() {
  const categories = await db.select().from(categoryTable).orderBy(categoryTable.name)
  return categories
}

// Get top categories based on entity count
export async function getTopCategories(limit = 5) {
  const topCategories = await db
    .select({
      id: categoryTable.id,
      name: categoryTable.name,
      count: count(entityToCategory.entityId),
    })
    .from(categoryTable)
    .leftJoin(entityToCategory, eq(categoryTable.id, entityToCategory.categoryId))
    .leftJoin(entityTable, eq(entityToCategory.entityId, entityTable.id))
    .where(or(eq(entityTable.status, "published"), eq(entityTable.status, "pending")))
    .groupBy(categoryTable.id, categoryTable.name)
    .orderBy(desc(count(entityToCategory.entityId)))
    .limit(limit)

  return topCategories
}

// Get user's upvoted entities
export async function getUserUpvotedEntities() {
  const session = await getSession()

  if (!session?.user?.id) {
    return []
  }

  const upvotedEntities = await db
    .select({
      entity: entityTable,
      upvotedAt: upvote.createdAt,
    })
    .from(upvote)
    .innerJoin(entityTable, eq(upvote.entityId, entityTable.id))
    .where(eq(upvote.userId, session.user.id))
    .orderBy(desc(upvote.createdAt))
    .limit(10)

  return upvotedEntities
}

// The getUserComments function is not needed anymore as Fuma Comment handles it
export async function getUserComments() {
  return []
}

// Get entities created by user
export async function getUserCreatedEntities() {
  const session = await getSession()

  if (!session?.user?.id) {
    return []
  }

  const userEntities = await db
    .select()
    .from(entityTable)
    .where(eq(entityTable.createdBy, session.user.id))
    .orderBy(desc(entityTable.createdAt))
    .limit(10)

  return userEntities
}

// Toggle upvote on a entity
export async function toggleUpvote(entityId: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return {
      success: false,
      message: "You must be logged in to upvote",
    }
  }

  const { UPVOTE_LIMITS } = await import("@/lib/constants")
  const rateLimit = await import("@/lib/rate-limit")

  const { success, reset } = await rateLimit.checkRateLimit(
    `upvote:${session.user.id}`,
    UPVOTE_LIMITS.ACTIONS_PER_WINDOW,
    UPVOTE_LIMITS.TIME_WINDOW_MS,
  )

  if (!success) {
    return {
      success: false,
      message: `Anti-Spam Squad here: ${UPVOTE_LIMITS.ACTIONS_PER_WINDOW} upvotes in ${UPVOTE_LIMITS.TIME_WINDOW_MINUTES} minutes maxed out! Retry in ${reset} seconds.`,
    }
  }

  const lastAction = await db.query.upvote.findFirst({
    where: and(eq(upvote.userId, session.user.id), eq(upvote.entityId, entityId)),
    orderBy: [desc(upvote.createdAt)],
  })

  if (lastAction?.createdAt) {
    const timeSinceLastAction = Date.now() - lastAction.createdAt.getTime()
    if (timeSinceLastAction < UPVOTE_LIMITS.MIN_TIME_BETWEEN_ACTIONS_MS) {
      return {
        success: false,
        message: `Anti-Spam Squad here: ${UPVOTE_LIMITS.MIN_TIME_BETWEEN_ACTIONS_SECONDS}-second wait required for vote changes`,
      }
    }
  }

  // Check if the user has already upvoted the entity
  const existingUpvote = await db
    .select()
    .from(upvote)
    .where(and(eq(upvote.userId, session.user.id), eq(upvote.entityId, entityId)))
    .limit(1)

  // If upvote exists, remove it, otherwise add it
  if (existingUpvote.length > 0) {
    await db
      .delete(upvote)
      .where(and(eq(upvote.userId, session.user.id), eq(upvote.entityId, entityId)))
  } else {
    await db.insert(upvote).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      entityId,
      createdAt: new Date(),
    })
  }

  revalidatePath("/dashboard")

  return { success: true }
}

interface ParentEntity {
  id: string
  name: string
  entityType: EntityType
}

interface EntitySubmissionData {
  name: string
  description: string
  entityType: EntityType
  parentEntities: ParentEntity[] // Array of parent entity IDs
  jobTitle?: string
  jobResponsibilities?: string
  categories: string[]
  keywords: string[]
  streetAddress: string
  city: string
  state: string
  zipCode: string
  phoneNumber: string
  email: string
  websiteUrl: string
  twitterUrl: string
  facebookUrl: string
  logoUrl: string | null
  imageUrl: string | null
  netWorth: string
  featuredOnHomepage: boolean
  dailyRanking: number
}

export async function submitEntity(entityData: EntitySubmissionData) {
  const session = await getSession()

  if (!session?.user) {
    return { success: false, error: "Authentication required" }
  }

  try {
    const {
      name,
      description,
      parentEntities,
      jobTitle,
      jobResponsibilities,
      categories,
      keywords,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      email,
      entityType,
      websiteUrl,
      logoUrl,
      imageUrl,
      twitterUrl,
      facebookUrl,
      netWorth,
    } = entityData

    // Validation
    if (!name || !entityType) {
      return { success: false, error: "Missing required fields" }
    }

    // Generate slug from name
    const slug = await generateUniqueSlug(name)

    // Insert entity
    const [newEntity] = await db
      .insert(entityTable)
      .values({
        id: crypto.randomUUID(),
        name,
        slug,
        description,
        entityType,
        websiteUrl,
        logoUrl,
        imageUrl,
        twitterUrl: twitterUrl ?? undefined,
        phoneNumber: phoneNumber ?? undefined,
        email: email ?? undefined,
        streetAddress,
        city,
        state,
        zipCode,
        facebookUrl: facebookUrl ?? undefined,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        status: entityStatus.PENDING,
        netWorth: netWorth ?? undefined,
        keywords,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: entityTable.id, slug: entityTable.slug })

    // if person add role and responsibilities
    if (entityType === "person") {
      await db.insert(roleAssignment).values({
        id: crypto.randomUUID(),
        personId: newEntity.id,
        orgId: parentEntities[0].id,
        title: jobTitle ?? "",
        responsibilities: jobResponsibilities ?? "",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
    }

    // add entity relationships to parent entities
    if (parentEntities && parentEntities.length > 0) {
      await db.insert(entityRelationship).values(
        parentEntities.map((parentEntity) => ({
          id: crypto.randomUUID(),
          parentEntityId: parentEntity.id,
          childEntityId: newEntity.id,
          relationshipType: parentEntity.entityType === "person" ? "member_of" : "sub_org_of",
          createdAt: new Date(),
          createdBy: session.user.id,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        })),
      )
    }

    // Add categories
    if (categories.length > 0) {
      await db.insert(entityToCategory).values(
        categories.map((categoryId) => ({
          entityId: newEntity.id,
          categoryId,
        })),
      )
    }

    return { success: true, entityId: newEntity.id, slug: newEntity.slug }
  } catch (error) {
    console.error("Error submitting entity:", error)
    return { success: false, error: "Failed to submit entity" }
  }
}

async function enrichEntitiesWithUserData<T extends { id: string }>(
  entities: T[],
  userId: string | null,
): Promise<
  (T & {
    userHasUpvoted: boolean
    categories: { id: string; name: string }[]
  })[]
> {
  if (!entities.length) return []

  const entityIds = entities.map((p) => p.id)

  // Get categories for all entities
  const categoriesData = await db
    .select({
      entityId: entityToCategory.entityId,
      categoryId: categoryTable.id,
      categoryName: categoryTable.name,
    })
    .from(entityToCategory)
    .innerJoin(categoryTable, eq(categoryTable.id, entityToCategory.categoryId))
    .where(sql`${entityToCategory.entityId} IN ${entityIds}`)

  const categoriesByEntityId = categoriesData.reduce(
    (acc, row) => {
      if (!acc[row.entityId]) {
        acc[row.entityId] = []
      }
      acc[row.entityId].push({ id: row.categoryId, name: row.categoryName })
      return acc
    },
    {} as Record<string, { id: string; name: string }[]>,
  )

  // Get upvotes for user
  let userUpvotedEntityIds = new Set<string>()
  if (userId) {
    const userUpvotes = await db
      .select({ entityId: upvote.entityId })
      .from(upvote)
      .where(and(eq(upvote.userId, userId), sql`${upvote.entityId} IN ${entityIds}`))
    userUpvotedEntityIds = new Set(userUpvotes.map((uv) => uv.entityId))
  }

  return entities.map((entity) => ({
    ...entity,
    userHasUpvoted: userUpvotedEntityIds.has(entity.id),
    categories: categoriesByEntityId[entity.id] || [],
  }))
}

// Get entities by category with pagination and sorting
export async function getEntitiesByCategory(
  categoryId: string,
  page: number = 1,
  limit: number = 10,
  sort: string = "recent",
) {
  const session = await getSession()
  const userId = session?.user?.id || null

  let orderByClause
  switch (sort) {
    case "upvotes":
      orderByClause = desc(sql`count(distinct ${upvote.id})`)
      break
    case "alphabetical":
      orderByClause = asc(entityTable.name)
      break
    case "recent":
    default:
      orderByClause = desc(entityTable.createdAt)
      break
  }

  const offset = (page - 1) * limit

  const queryConditions = and(
    eq(entityToCategory.categoryId, categoryId),
    or(eq(entityTable.status, "published")),
  )

  const entitiesData = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      description: entityTable.description,
      logoUrl: entityTable.logoUrl,
      websiteUrl: entityTable.websiteUrl,
      status: entityTable.status,
      entityType: entityTable.entityType,
      dailyRanking: entityTable.dailyRanking,
      createdAt: entityTable.createdAt,
      upvoteCount: sql<number>`count(distinct ${upvote.id})`.mapWith(Number),
      avgRating: sql<number>`round(avg(${reviews.rating}), 1)`.mapWith(Number),
      reviewCount: sql<number>`cast(count(distinct ${reviews.id}) as int)`.mapWith(Number),
    })
    .from(entityTable)
    .innerJoin(entityToCategory, eq(entityTable.id, entityToCategory.entityId))
    .leftJoin(upvote, eq(upvote.entityId, entityTable.id))
    .leftJoin(reviews, eq(reviews.entityId, entityTable.id))
    .where(queryConditions)
    .groupBy(
      entityTable.id,
      entityTable.name,
      entityTable.slug,
      entityTable.description,
      entityTable.logoUrl,
      entityTable.websiteUrl,
      entityTable.status,
      entityTable.entityType,
      entityTable.dailyRanking,
      entityTable.createdAt,
    )
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset)

  const enrichedEntities = await enrichEntitiesWithUserData(entitiesData, userId)

  const totalEntitiesResult = await db
    .select({ count: count(entityTable.id) })
    .from(entityTable)
    .innerJoin(entityToCategory, eq(entityTable.id, entityToCategory.entityId))
    .where(queryConditions)

  const totalCount = totalEntitiesResult[0]?.count || 0

  return {
    entities: enrichedEntities,
    totalCount,
  }
}

export async function searchEntities(query: string, entityTypes: string[]) {
  // Build conditions array, only adding defined conditions
  const conditions: SQL[] = []

  if (query) {
    conditions.push(ilike(entityTable.name, `%${query}%`)) // Changed from like to ilike
  }

  if (entityTypes.length > 0) {
    conditions.push(inArray(entityTable.entityType, entityTypes))
  }

  const entities = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      entityType: entityTable.entityType,
    })
    .from(entityTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(10)

  return entities
}

// getCategoryById
export async function getCategoryById(categoryId: string) {
  const categoryData = await db
    .select()
    .from(categoryTable)
    .where(eq(categoryTable.id, categoryId))
    .limit(1)

  return categoryData[0] || null
}

// Get entity by ID for editing
export async function getEntityById(entityId: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" }
  }

  try {
    const [entityData] = await db
      .select()
      .from(entityTable)
      .where(eq(entityTable.id, entityId))
      .limit(1)

    if (!entityData) {
      return { success: false, error: "Entity not found" }
    }

    // Check permissions - owner can edit if pending, admin can edit always
    const isOwner = entityData.createdBy === session.user.id
    const isAdmin = session.user.role === "admin"
    const canEdit = isAdmin || (isOwner && entityData.status === "pending")

    if (!canEdit) {
      return {
        success: false,
        error: "You don't have permission to edit this entity",
      }
    }

    // Get categories
    const categories = await db
      .select({ categoryId: entityToCategory.categoryId })
      .from(entityToCategory)
      .where(eq(entityToCategory.entityId, entityId))

    // Get parent entities
    const parentEntities = await db
      .select({
        id: entityTable.id,
        name: entityTable.name,
        entityType: entityTable.entityType,
      })
      .from(entityRelationship)
      .innerJoin(entityTable, eq(entityRelationship.parentEntityId, entityTable.id))
      .where(eq(entityRelationship.childEntityId, entityId))

    // Get role assignment if entity is a person
    let roleAssignmentData: RoleAssignment | null = null
    if (entityData.entityType === "person") {
      const [roleData] = await db
        .select()
        .from(roleAssignment)
        .where(eq(roleAssignment.personId, entityId))
        .limit(1)
      roleAssignmentData = roleData
    }

    return {
      success: true,
      entity: {
        ...entityData,
        categories: categories.map((c) => c.categoryId),
        parentEntities,
        jobTitle: roleAssignmentData?.title || "",
        jobResponsibilities: roleAssignmentData?.responsibilities || "",
      },
    }
  } catch (error) {
    console.error("Error fetching entity:", error)
    return { success: false, error: "Failed to fetch entity" }
  }
}

// Get child entities by parent entity ID with pagination and sorting
export async function getChildEntitiesByParentId(
  parentEntityId: string,
  page: number = 1,
  limit: number = 10,
  sort: string = "recent",
) {
  const session = await getSession()
  const userId = session?.user?.id || null

  let orderByClause
  switch (sort) {
    case "upvotes":
      orderByClause = desc(sql`count(distinct ${upvote.id})`)
      break
    case "alphabetical":
      orderByClause = asc(entityTable.name)
      break
    case "recent":
    default:
      orderByClause = desc(entityTable.createdAt)
      break
  }

  const offset = (page - 1) * limit

  const queryConditions = and(
    eq(entityRelationship.parentEntityId, parentEntityId),
    eq(entityTable.status, "published"),
  )

  const entitiesData = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      description: entityTable.description,
      logoUrl: entityTable.logoUrl,
      websiteUrl: entityTable.websiteUrl,
      status: entityTable.status,
      entityType: entityTable.entityType,
      dailyRanking: entityTable.dailyRanking,
      createdAt: entityTable.createdAt,
      upvoteCount: sql<number>`count(distinct ${upvote.id})`.mapWith(Number),
      relationshipType: entityRelationship.relationshipType,
    })
    .from(entityRelationship)
    .innerJoin(entityTable, eq(entityRelationship.childEntityId, entityTable.id))
    .leftJoin(upvote, eq(upvote.entityId, entityTable.id))
    .where(queryConditions)
    .groupBy(
      entityTable.id,
      entityTable.name,
      entityTable.slug,
      entityTable.description,
      entityTable.logoUrl,
      entityTable.websiteUrl,
      entityTable.status,
      entityTable.entityType,
      entityTable.dailyRanking,
      entityTable.createdAt,
      entityRelationship.relationshipType,
    )
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset)

  const enrichedEntities = await enrichEntitiesWithUserData(entitiesData, userId)

  const totalEntitiesResult = await db
    .select({ count: count(entityTable.id) })
    .from(entityRelationship)
    .innerJoin(entityTable, eq(entityRelationship.childEntityId, entityTable.id))
    .where(queryConditions)

  const totalCount = totalEntitiesResult[0]?.count || 0

  return {
    entities: enrichedEntities,
    totalCount,
  }
}

// Get parent entity by ID to show in the members page
export async function getParentEntityById(parentEntityId: string) {
  const [parentEntity] = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      description: entityTable.description,
      logoUrl: entityTable.logoUrl,
      entityType: entityTable.entityType,
    })
    .from(entityTable)
    .where(eq(entityTable.id, parentEntityId))
    .limit(1)

  return parentEntity || null
}

// Get entity by slug
export async function getEntityBySlug(slug: string) {
  const [entity] = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      description: entityTable.description,
      logoUrl: entityTable.logoUrl,
      entityType: entityTable.entityType,
      status: entityTable.status,
    })
    .from(entityTable)
    .where(eq(entityTable.slug, slug))
    .limit(1)

  return entity || null
}

// Update entity
export async function updateEntity(entityId: string, entityData: EntitySubmissionData) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" }
  }

  try {
    // Get current entity
    const [currentEntity] = await db
      .select()
      .from(entityTable)
      .where(eq(entityTable.id, entityId))
      .limit(1)

    if (!currentEntity) {
      return { success: false, error: "Entity not found" }
    }

    // Check permissions - owner can edit if pending, admin can edit always
    const isOwner = currentEntity.createdBy === session.user.id
    const isAdmin = session.user.role === "admin"
    const canEdit = isAdmin || (isOwner && currentEntity.status === "pending")

    if (!canEdit) {
      return {
        success: false,
        error: "You don't have permission to edit this entity",
      }
    }

    const {
      name,
      description,
      parentEntities,
      jobTitle,
      jobResponsibilities,
      categories,
      keywords,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      email,
      entityType,
      websiteUrl,
      logoUrl,
      twitterUrl,
      facebookUrl,
      netWorth,
    } = entityData

    // Generate new slug if name changed
    let slug = currentEntity.slug
    if (name !== currentEntity.name) {
      slug = await generateUniqueSlug(name)
    }

    // Update entity
    await db
      .update(entityTable)
      .set({
        name,
        slug,
        description,
        entityType,
        websiteUrl,
        logoUrl,
        twitterUrl: twitterUrl ?? undefined,
        phoneNumber: phoneNumber ?? undefined,
        email: email ?? undefined,
        streetAddress,
        city,
        state,
        zipCode,
        facebookUrl: facebookUrl ?? undefined,
        updatedBy: session.user.id,
        netWorth: netWorth ?? undefined,
        keywords,
        updatedAt: new Date(),
      })
      .where(eq(entityTable.id, entityId))

    // Update role assignment if person
    if (entityType === "person") {
      // Delete existing role assignment
      await db.delete(roleAssignment).where(eq(roleAssignment.personId, entityId))

      // Insert new role assignment if parent entities exist
      if (parentEntities && parentEntities.length > 0) {
        await db.insert(roleAssignment).values({
          id: crypto.randomUUID(),
          personId: entityId,
          orgId: parentEntities[0].id,
          title: jobTitle ?? "",
          responsibilities: jobResponsibilities ?? "",
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: session.user.id,
          updatedBy: session.user.id,
        })
      }
    }

    // Update entity relationships
    // Delete existing relationships
    await db.delete(entityRelationship).where(eq(entityRelationship.childEntityId, entityId))

    // Add new relationships
    if (parentEntities && parentEntities.length > 0) {
      await db.insert(entityRelationship).values(
        parentEntities.map((parentEntity) => ({
          id: crypto.randomUUID(),
          parentEntityId: parentEntity.id,
          childEntityId: entityId,
          relationshipType: parentEntity.entityType === "person" ? "member_of" : "sub_org_of",
          createdAt: new Date(),
          createdBy: session.user.id,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        })),
      )
    }

    // Update categories
    // Delete existing categories
    await db.delete(entityToCategory).where(eq(entityToCategory.entityId, entityId))

    // Add new categories
    if (categories.length > 0) {
      await db.insert(entityToCategory).values(
        categories.map((categoryId) => ({
          entityId: entityId,
          categoryId,
        })),
      )
    }

    revalidatePath(`/${slug}`)
    revalidatePath("/dashboard")

    return { success: true, entityId, slug }
  } catch (error) {
    console.error("Error updating entity:", error)
    return { success: false, error: "Failed to update entity" }
  }
}
