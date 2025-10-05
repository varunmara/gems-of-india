import { Suspense } from "react"
import { headers } from "next/headers"
import Link from "next/link"

import { category, entityStatus } from "@/drizzle/db/schema"

import { auth } from "@/lib/auth"
import { ENTITY_LIMITS_VARIABLES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { EntityCard } from "@/components/home/entity-card"
// import { RiFilterLine, RiArrowDownSLine } from "@remixicon/react";
import { getTopCategories } from "@/app/actions/entities"
import { getMonthBestEntities, getTodayEntities, getYesterdayEntities } from "@/app/actions/home"

interface EntitySummary {
  id: string
  slug: string
  name: string
  description: string | null
  logoUrl: string | null
  websiteUrl?: string | null
  upvoteCount?: number | null
  commentCount?: number | null
  avgRating?: number | null
  reviewCount?: number | null
  dailyRanking?: number | null
  status: string
  createdAt: Date | string | null
  userHasUpvoted?: boolean
  categories?: (typeof category.$inferSelect)[]
}

export const metadata = {
  title: "Trending - Gems of India",
  description: "Discover trending gems of India",
}

// Main Skeleton component
function TrendingDataSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="px-3 sm:px-4">
        <div className="bg-muted h-8 w-64 animate-pulse rounded"></div>
      </div>
      <div className="-mx-3 flex flex-col sm:-mx-4">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="mx-3 animate-pulse rounded-xl border border-zinc-100 bg-white/70 p-3 shadow-sm sm:mx-4 sm:p-4 dark:border-zinc-800/50 dark:bg-zinc-900/30"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-muted h-12 w-12 rounded-md sm:h-14 sm:w-14"></div>
                </div>
                <div className="min-w-0 flex-grow">
                  <div className="flex flex-col">
                    <div className="bg-muted mb-2 h-5 w-1/3 rounded"></div>
                    <div className="bg-muted h-4 w-2/3 rounded"></div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-start">
                  <div className="bg-muted h-10 w-10 rounded-xl border-2 border-dashed"></div>
                  <div className="bg-muted hidden h-10 w-10 rounded-xl border-2 border-dashed sm:block"></div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

// Component to display the data
async function TrendingData({
  filter,
  isAuthenticated,
}: {
  filter: string
  isAuthenticated: boolean
}) {
  let entities: EntitySummary[] = [] // Use the defined type
  let title

  if (filter === "today") {
    entities = await getTodayEntities(ENTITY_LIMITS_VARIABLES.VIEW_ALL_PAGE_TODAY_YESTERDAY_LIMIT)
    title = "Today's Gems"
  } else if (filter === "yesterday") {
    entities = await getYesterdayEntities(
      ENTITY_LIMITS_VARIABLES.VIEW_ALL_PAGE_TODAY_YESTERDAY_LIMIT,
    )
    title = "Yesterday's Gems"
  } else {
    entities = await getMonthBestEntities(ENTITY_LIMITS_VARIABLES.VIEW_ALL_PAGE_MONTH_LIMIT)
    title = "Best of the Month"
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      </div>

      {entities.length === 0 ? (
        <div className="text-muted-foreground border-border bg-card rounded-lg border border-dashed py-8 text-center text-sm">
          No gems found for this period.
        </div>
      ) : (
        <div className="-mx-3 flex flex-col sm:-mx-4">
          {entities.map((entity: EntitySummary, index: number) => (
            <EntityCard
              key={entity.id}
              {...entity}
              description={entity.description ?? ""}
              index={index}
              userHasUpvoted={entity.userHasUpvoted ?? false}
              isAuthenticated={isAuthenticated}
              logoUrl={entity.logoUrl ?? ""}
              upvoteCount={entity.upvoteCount ?? 0}
              avgRating={entity.avgRating ?? 0}
              reviewCount={entity.reviewCount ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default async function TrendingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams
  const filter = params.filter || "today"
  const topCategories = await getTopCategories(5)

  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const isAuthenticated = !!session?.user

  const todayEntities = await getTodayEntities()
  const ongoingGems = todayEntities.filter(
    (entity) => entity.status === entityStatus.PUBLISHED,
  ).length

  return (
    <main className="bg-secondary/20">
      <div className="container mx-auto min-h-screen max-w-6xl px-4 pt-8 pb-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:items-start">
          {/* Main content */}
          <div className="space-y-6 sm:space-y-8 lg:col-span-2">
            <Suspense fallback={<TrendingDataSkeleton />}>
              <TrendingData filter={filter} isAuthenticated={isAuthenticated} />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="top-24">
            {/* Quick Stats */}
            <div className="space-y-3 py-5 pt-0">
              <h3 className="flex items-center gap-2 font-semibold">Live Now</h3>
              <Link
                href="/trending"
                className="bg-secondary/30 hover:bg-secondary/50 border-primary block rounded-md border-l-4 px-5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-primary text-2xl font-bold">{ongoingGems}</div>
                  <div className="text-sm font-medium">Active Gems</div>
                </div>
              </Link>
            </div>

            {/* Time Filters */}
            <div className="space-y-3 py-5">
              <h3 className="flex items-center gap-2 font-semibold">Time Range</h3>
              <div className="space-y-2">
                <Link
                  href="/trending?filter=today"
                  className={`-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors ${
                    filter === "today" ? "bg-muted font-medium" : "hover:bg-muted/40"
                  }`}
                >
                  Today&apos;s Gems
                </Link>
                <Link
                  href="/trending?filter=yesterday"
                  className={`-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors ${
                    filter === "yesterday" ? "bg-muted font-medium" : "hover:bg-muted/40"
                  }`}
                >
                  Yesterday&apos;s Gems
                </Link>
                <Link
                  href="/trending?filter=month"
                  className={`-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors ${
                    filter === "month" ? "bg-muted font-medium" : "hover:bg-muted/40"
                  }`}
                >
                  This Month&apos;s Best
                </Link>
              </div>
            </div>

            {/* Quick Access */}
            <div className="space-y-3 py-5">
              <h3 className="flex items-center gap-2 font-semibold">Quick Access</h3>
              <div className="space-y-2">
                <Link
                  href="/categories"
                  className="-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:underline"
                >
                  Browse Categories
                </Link>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3 py-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">Top Categories</h3>
                <Button variant="ghost" size="sm" className="text-sm" asChild>
                  <Link href="/categories" className="flex items-center gap-1">
                    View all
                  </Link>
                </Button>
              </div>
              <div className="space-y-2">
                {topCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories?category=${category.id}`}
                    className="hover:bg-muted/40 -mx-2 flex items-center justify-between rounded-md p-2"
                  >
                    <span className="text-sm">{category.name}</span>
                    <span className="text-muted-foreground bg-secondary rounded-full px-2 py-0.5 text-xs">
                      {category.count} gems
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
