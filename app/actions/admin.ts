"use server"

import { headers } from "next/headers"

import { db } from "@/drizzle/db"
import { category, entity, moderatorScope, user } from "@/drizzle/db/schema"
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { getModeratorScope, getModeratorScopeDescription } from "@/lib/moderator-permissions"

// verify admin access
async function checkAdminAccess() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user?.role || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }
}

// Get all users and entity stats
export async function getAdminStatsAndUsers() {
  await checkAdminAccess()

  // Get all users, sorted by registration date descending
  const usersData = await db.select().from(user).orderBy(desc(user.createdAt))

  // Get entity counts for each user
  const entityCounts = await db
    .select({
      userId: entity.createdBy,
      count: sql<number>`count(*)::int`,
    })
    .from(entity)
    .where(sql`${entity.createdBy} IS NOT NULL`)
    .groupBy(entity.createdBy)

  // Create a map for quick lookup
  const entityCountMap = new Map(entityCounts.map((ec) => [ec.userId, ec.count]))

  // Get moderator scopes for all moderators
  const moderatorScopes = await db.select().from(moderatorScope)
  const scopeMap = new Map(moderatorScopes.map((s) => [s.moderatorId, s]))

  // Get entity names for entity-specific scopes
  const entityScopeIds = moderatorScopes
    .filter((s) => s.entityId)
    .map((s) => s.entityId!)
    .filter((id): id is string => id !== null)

  const entityNames = new Map<string, string>()
  if (entityScopeIds.length > 0) {
    const entities = await db
      .select({ id: entity.id, name: entity.name })
      .from(entity)
      .where(inArray(entity.id, entityScopeIds))
    entities.forEach((e) => entityNames.set(e.id, e.name))
  }

  // Combine user data with entity counts and moderator scope
  const users = usersData.map((u) => {
    const scope = scopeMap.get(u.id)
    let scopeDescription = null

    if (scope) {
      switch (scope.scopeType) {
        case "all":
          scopeDescription = "All entities"
          break
        case "state":
          scopeDescription = `State: ${scope.state}`
          break
        case "city":
          scopeDescription = `City: ${scope.city}, ${scope.state}`
          break
        case "entity":
          scopeDescription = scope.entityId
            ? `Entity: ${entityNames.get(scope.entityId) || "Unknown"}`
            : "Entity: Not set"
          break
      }
    }

    return {
      ...u,
      hasPublished: (entityCountMap.get(u.id) || 0) > 0,
      entityCount: entityCountMap.get(u.id) || 0,
      moderatorScope: scopeDescription,
    }
  })

  // Get today's date at midnight UTC
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  // Get new users today
  const newUsersToday = await db
    .select({ count: sql`count(*)` })
    .from(user)
    .where(gte(user.createdAt, today))

  // Get entity stats
  const totalEntities = await db.select({ count: sql`count(*)` }).from(entity)

  const publishedEntities = await db
    .select({ count: sql`count(*)` })
    .from(entity)
    .where(eq(entity.status, "published"))

  const pendingEntities = await db
    .select({ count: sql`count(*)` })
    .from(entity)
    .where(eq(entity.status, "pending"))

  // Get new entities today
  const newEntitiesToday = await db
    .select({ count: sql`count(*)` })
    .from(entity)
    .where(gte(entity.createdAt, today))

  // Get new pending entities today
  const newPendingEntitiesToday = await db
    .select({ count: sql`count(*)` })
    .from(entity)
    .where(and(gte(entity.createdAt, today), eq(entity.status, "pending")))

  // Get new published entities today
  const newPublishedEntitiesToday = await db
    .select({ count: sql`count(*)` })
    .from(entity)
    .where(and(gte(entity.createdAt, today), eq(entity.status, "published")))

  return {
    users,
    stats: {
      totalEntities: Number(totalEntities[0]?.count || 0),
      publishedEntities: Number(publishedEntities[0]?.count || 0),
      pendingEntities: Number(pendingEntities[0]?.count || 0),
      totalUsers: users.length,
      newUsersToday: Number(newUsersToday[0]?.count || 0),
      newEntitiesToday: Number(newEntitiesToday[0]?.count || 0),
      newPendingEntitiesToday: Number(newPendingEntitiesToday[0]?.count || 0),
      newPublishedEntitiesToday: Number(newPublishedEntitiesToday[0]?.count || 0),
    },
  }
}

// Get all categories
export async function getCategories() {
  await checkAdminAccess()

  const categories = await db
    .select({
      name: category.name,
    })
    .from(category)
    .orderBy(category.name)

  const totalCount = await db.select({ count: sql<number>`count(*)::int` }).from(category)

  return {
    categories,
    totalCount: totalCount[0]?.count || 0,
  }
}

// Change user role
export async function changeUserRole(userId: string, newRole: "user" | "moderator" | "admin") {
  await checkAdminAccess()

  try {
    await db.update(user).set({ role: newRole }).where(eq(user.id, userId))

    // If demoting from moderator to user, remove their scope
    if (newRole === "user") {
      await removeModeratorScope(userId)
    }

    return { success: true }
  } catch (error) {
    console.error("Error changing user role:", error)
    return { success: false, error: "Failed to change user role" }
  }
}

// Assign moderator scope
export async function assignModeratorScope(
  userId: string,
  scopeData: {
    scopeType: "all" | "state" | "city" | "entity"
    entityId?: string
    state?: string
    city?: string
  },
) {
  await checkAdminAccess()

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    // Check that user exists
    const [targetUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1)
    if (!targetUser) {
      return { success: false, error: "User not found" }
    }

    // Validate scope type
    const validScopeTypes = ["all", "state", "city", "entity"]
    if (!validScopeTypes.includes(scopeData.scopeType)) {
      return { success: false, error: "Invalid scope type" }
    }

    // Validate scope data based on type
    if (scopeData.scopeType === "entity") {
      if (!scopeData.entityId) {
        return { success: false, error: "Entity ID is required for entity scope" }
      }
      // Verify entity exists
      const [entityExists] = await db
        .select({ id: entity.id })
        .from(entity)
        .where(eq(entity.id, scopeData.entityId))
        .limit(1)
      if (!entityExists) {
        return { success: false, error: "Entity not found" }
      }
    }

    if (scopeData.scopeType === "state") {
      if (!scopeData.state) {
        return { success: false, error: "State is required for state scope" }
      }
      // Validate state is in INDIAN_STATES
      const { INDIAN_STATES } = await import("@/lib/constants")
      if (!INDIAN_STATES.includes(scopeData.state)) {
        return { success: false, error: "Invalid state" }
      }
    }

    if (scopeData.scopeType === "city") {
      if (!scopeData.city || !scopeData.state) {
        return { success: false, error: "City and state are required for city scope" }
      }
      // Validate state
      const { INDIAN_STATES } = await import("@/lib/constants")
      if (!INDIAN_STATES.includes(scopeData.state)) {
        return { success: false, error: "Invalid state" }
      }
      // Validate city is not empty and reasonable length
      if (scopeData.city.trim().length === 0 || scopeData.city.length > 100) {
        return { success: false, error: "Invalid city name" }
      }
    }

    // Remove existing scope and insert new scope in a transaction
    await db.transaction(async (tx) => {
      // Remove existing scope if any
      await tx.delete(moderatorScope).where(eq(moderatorScope.moderatorId, userId))

      // Insert new scope
      await tx.insert(moderatorScope).values({
        id: crypto.randomUUID(),
        moderatorId: userId,
        scopeType: scopeData.scopeType,
        entityId: scopeData.entityId || null,
        state: scopeData.state || null,
        city: scopeData.city || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: session?.user?.id || null,
        updatedBy: session?.user?.id || null,
      })
    })

    return { success: true }
  } catch (error) {
    console.error("Error assigning moderator scope:", error)
    return { success: false, error: "Failed to assign moderator scope" }
  }
}

// Update moderator scope
export async function updateModeratorScope(
  userId: string,
  scopeData: {
    scopeType: "all" | "state" | "city" | "entity"
    entityId?: string
    state?: string
    city?: string
  },
) {
  await checkAdminAccess()

  // Just use assignModeratorScope as it already handles removing old scope
  return assignModeratorScope(userId, scopeData)
}

// Remove moderator scope
export async function removeModeratorScope(userId: string) {
  await checkAdminAccess()

  try {
    await db.delete(moderatorScope).where(eq(moderatorScope.moderatorId, userId))
    return { success: true }
  } catch (error) {
    console.error("Error removing moderator scope:", error)
    return { success: false, error: "Failed to remove moderator scope" }
  }
}

// Get moderator scope with description
export async function getModeratorScopeInfo(userId: string) {
  await checkAdminAccess()

  try {
    const scope = await getModeratorScope(userId)
    const description = await getModeratorScopeDescription(userId)

    return {
      success: true,
      scope,
      description,
    }
  } catch (error) {
    console.error("Error getting moderator scope:", error)
    return { success: false, error: "Failed to get moderator scope" }
  }
}

// Add a new category
export async function addCategory(name: string) {
  await checkAdminAccess()

  // Name validation
  const trimmedName = name.trim()
  if (!trimmedName) {
    return { success: false, error: "Category name cannot be empty" }
  }
  if (trimmedName.length < 2) {
    return { success: false, error: "Category name must be at least 2 characters long" }
  }
  if (trimmedName.length > 50) {
    return { success: false, error: "Category name cannot exceed 50 characters" }
  }

  try {
    // Check if category already exists
    const existingCategory = await db
      .select()
      .from(category)
      .where(eq(category.name, trimmedName))
      .limit(1)

    if (existingCategory.length > 0) {
      return { success: false, error: "This category already exists" }
    }

    const id = trimmedName.toLowerCase().replace(/\s+/g, "-")

    await db.insert(category).values({
      id,
      name: trimmedName,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error adding category:", error)
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return { success: false, error: "This category already exists" }
    }
    return { success: false, error: "An error occurred while adding the category" }
  }
}
