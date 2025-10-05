"use server"

import { headers } from "next/headers"

import { db } from "@/drizzle/db"
import { entityStatus, entity as entityTable, reviews, upvote } from "@/drizzle/db/schema"
import { endOfMonth, startOfMonth } from "date-fns"
import { and, desc, eq, sql } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { ENTITY_LIMITS_VARIABLES } from "@/lib/constants"

async function getCurrentUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

async function enrichEntitiesWithUserData<T extends { id: string }>(
  entities: T[],
  userId: string | null,
): Promise<T[]> {
  if (!entities.length) return []

  const entityIds = entities.map((e) => e.id)

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
  }))
}

export async function getTodayEntities(limit: number = ENTITY_LIMITS_VARIABLES.TODAY_LIMIT) {
  const userId = await getCurrentUserId()

  const todayEntitiesBase = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      status: entityTable.status,
      description: entityTable.description,
      logoUrl: entityTable.logoUrl,
      websiteUrl: entityTable.websiteUrl,
      dailyRanking: entityTable.dailyRanking,
      createdAt: entityTable.createdAt,
      upvoteCount: sql<number>`cast(count(distinct ${upvote.id}) as int)`.mapWith(Number),
      avgRating: sql<number>`round(avg(${reviews.rating}), 1)`.mapWith(Number),
      reviewCount: sql<number>`cast(count(distinct ${reviews.id}) as int)`.mapWith(Number),
    })
    .from(entityTable)
    .leftJoin(upvote, eq(upvote.entityId, entityTable.id))
    .leftJoin(reviews, eq(reviews.entityId, entityTable.id))
    .where(eq(entityTable.status, entityStatus.PUBLISHED))
    .groupBy(entityTable.id)
    .orderBy(desc(sql<number>`cast(count(distinct ${upvote.id}) as int)`))
    .limit(limit)

  return enrichEntitiesWithUserData(todayEntitiesBase, userId)
}

export async function getYesterdayEntities(
  limit: number = ENTITY_LIMITS_VARIABLES.YESTERDAY_LIMIT,
) {
  const userId = await getCurrentUserId()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const yesterdayEnd = new Date(yesterday)
  yesterdayEnd.setHours(23, 59, 59, 999)

  const yesterdayEntitiesBase = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      description: entityTable.description,
      logoUrl: entityTable.logoUrl,
      websiteUrl: entityTable.websiteUrl,
      status: entityTable.status,
      createdAt: entityTable.createdAt,
      dailyRanking: entityTable.dailyRanking,
      upvoteCount: sql<number>`cast(count(distinct ${upvote.id}) as int)`.mapWith(Number),
      avgRating: sql<number>`round(avg(${reviews.rating}), 1)`.mapWith(Number),
      reviewCount: sql<number>`cast(count(distinct ${reviews.id}) as int)`.mapWith(Number),
    })
    .from(entityTable)
    .leftJoin(upvote, eq(upvote.entityId, entityTable.id))
    .leftJoin(reviews, eq(reviews.entityId, entityTable.id))
    .where(
      and(
        eq(entityTable.status, entityStatus.PUBLISHED),
        sql`${entityTable.createdAt} >= ${yesterday.toISOString()}`,
        sql`${entityTable.createdAt} <= ${yesterdayEnd.toISOString()}`,
      ),
    )
    .groupBy(entityTable.id)
    .orderBy(desc(entityTable.dailyRanking))
    .limit(limit)

  return enrichEntitiesWithUserData(yesterdayEntitiesBase, userId)
}

export async function getMonthBestEntities(limit: number = ENTITY_LIMITS_VARIABLES.MONTH_LIMIT) {
  const userId = await getCurrentUserId()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const monthEntitiesBase = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      status: entityTable.status,
      description: entityTable.description,
      logoUrl: entityTable.logoUrl,
      websiteUrl: entityTable.websiteUrl,
      dailyRanking: entityTable.dailyRanking,
      createdAt: entityTable.createdAt,
      upvoteCount: sql<number>`cast(count(distinct ${upvote.id}) as int)`.mapWith(Number),
      avgRating: sql<number>`round(avg(${reviews.rating}), 1)`.mapWith(Number),
      reviewCount: sql<number>`cast(count(distinct ${reviews.id}) as int)`.mapWith(Number),
    })
    .from(entityTable)
    .leftJoin(upvote, eq(upvote.entityId, entityTable.id))
    .leftJoin(reviews, eq(reviews.entityId, entityTable.id))
    .where(
      and(
        eq(entityTable.status, entityStatus.PUBLISHED),
        sql`${entityTable.createdAt} >= ${monthStart.toISOString()}`,
        sql`${entityTable.createdAt} <= ${monthEnd.toISOString()}`,
      ),
    )
    .groupBy(entityTable.id)
    .orderBy(
      desc(
        sql<number>`cast(count(distinct ${upvote.id}) as int) + (round(avg(${reviews.rating}), 1) * 10)`,
      ),
    )
    .limit(limit)

  return enrichEntitiesWithUserData(monthEntitiesBase, userId)
}

// New function for trending entities based on upvotes and ratings
export async function getTrendingEntities(limit: number = 10) {
  const userId = await getCurrentUserId()
  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)

  const trendingEntities = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      status: entityTable.status,
      description: entityTable.description,
      logoUrl: entityTable.logoUrl,
      websiteUrl: entityTable.websiteUrl,
      dailyRanking: entityTable.dailyRanking,
      createdAt: entityTable.createdAt,
      upvoteCount: sql<number>`cast(count(distinct ${upvote.id}) as int)`.mapWith(Number),
      avgRating: sql<number>`round(avg(${reviews.rating}), 1)`.mapWith(Number),
      reviewCount: sql<number>`cast(count(distinct ${reviews.id}) as int)`.mapWith(Number),
      // Trending score: recent upvotes + rating weight
      trendingScore: sql<number>`
        cast(count(distinct ${upvote.id}) as int) + 
        (round(avg(${reviews.rating}), 1) * 5)
      `.mapWith(Number),
    })
    .from(entityTable)
    .leftJoin(upvote, eq(upvote.entityId, entityTable.id))
    .leftJoin(reviews, eq(reviews.entityId, entityTable.id))
    .where(
      and(
        eq(entityTable.status, entityStatus.PUBLISHED),
        sql`${entityTable.createdAt} >= ${last7Days.toISOString()}`,
      ),
    )
    .groupBy(entityTable.id)
    .orderBy(
      desc(
        sql<number>`cast(count(distinct ${upvote.id}) as int) + (round(avg(${reviews.rating}), 1) * 5)`,
      ),
    )
    .limit(limit)

  return enrichEntitiesWithUserData(trendingEntities, userId)
}

export async function getFeaturedPremiumEntities() {
  const entities = await db.query.entity.findMany({
    where: and(
      eq(entityTable.featuredOnHomepage, true),
      eq(entityTable.status, entityStatus.PUBLISHED),
    ),
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      websiteUrl: true,
      status: true,
      dailyRanking: true,
    },
    limit: 3,
    orderBy: [desc(entityTable.createdAt)],
  })
  return entities
}

export async function getYesterdayTopEntities() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const yesterdayEnd = new Date(yesterday)
  yesterdayEnd.setHours(23, 59, 59, 999)

  const topEntities = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      status: entityTable.status,
      logoUrl: entityTable.logoUrl,
      dailyRanking: entityTable.dailyRanking,
    })
    .from(entityTable)
    .where(
      and(
        eq(entityTable.status, entityStatus.PUBLISHED),
        sql`${entityTable.dailyRanking} IS NOT NULL`,
        sql`${entityTable.createdAt} >= ${yesterday.toISOString()}`,
        sql`${entityTable.createdAt} <= ${yesterdayEnd.toISOString()}`,
      ),
    )
    .orderBy(entityTable.dailyRanking)
    .limit(3)

  return topEntities
}

export async function getWinnersByDate(date: Date) {
  const userId = await getCurrentUserId()
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const winnersBase = await db
    .select({
      id: entityTable.id,
      name: entityTable.name,
      slug: entityTable.slug,
      description: entityTable.description,
      logoUrl: entityTable.logoUrl,
      websiteUrl: entityTable.websiteUrl,
      dailyRanking: entityTable.dailyRanking,
      status: entityTable.status,
      createdAt: entityTable.createdAt,
      upvoteCount: sql<number>`cast(count(distinct ${upvote.id}) as int)`.mapWith(Number),
      avgRating: sql<number>`round(avg(${reviews.rating}), 1)`.mapWith(Number),
      reviewCount: sql<number>`cast(count(distinct ${reviews.id}) as int)`.mapWith(Number),
    })
    .from(entityTable)
    .leftJoin(upvote, eq(upvote.entityId, entityTable.id))
    .leftJoin(reviews, eq(reviews.entityId, entityTable.id))
    .where(
      and(
        eq(entityTable.status, entityStatus.PUBLISHED),
        sql`${entityTable.dailyRanking} IS NOT NULL`,
        sql`${entityTable.dailyRanking} <= 3`,
        sql`${entityTable.createdAt} >= ${dayStart.toISOString()}`,
        sql`${entityTable.createdAt} <= ${dayEnd.toISOString()}`,
      ),
    )
    .groupBy(entityTable.id)
    .orderBy(entityTable.dailyRanking)

  return enrichEntitiesWithUserData(winnersBase, userId)
}
