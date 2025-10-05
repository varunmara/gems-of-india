"use server"

import { headers } from "next/headers"

import { db } from "@/drizzle/db"
import { category, entity, user } from "@/drizzle/db/schema"
import { and, desc, eq, gte, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"

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

  // Combine user data with entity counts
  const users = usersData.map((u) => ({
    ...u,
    hasPublished: (entityCountMap.get(u.id) || 0) > 0,
    entityCount: entityCountMap.get(u.id) || 0,
  }))

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
