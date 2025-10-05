"use client"

import Link from "next/link"

import { category } from "@/drizzle/db/schema"
import { RiArrowRightLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

import { EntityCard } from "./entity-card"

interface Entity {
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
  status: string
  createdAt: Date | string | null
  userHasUpvoted?: boolean
  categories?: (typeof category.$inferSelect)[]
  dailyRanking?: number | null
}

interface EntitySectionProps {
  title: string
  entities: Entity[]
  moreHref?: string
  sortByUpvotes?: boolean
  isAuthenticated: boolean
}

export function EntitySection({
  title,
  entities,
  moreHref,
  sortByUpvotes = false,
  isAuthenticated,
}: EntitySectionProps) {
  const sortedEntities = sortByUpvotes
    ? [...entities].sort((a, b) => (b.upvoteCount ?? 0) - (a.upvoteCount ?? 0))
    : entities

  const ViewAllButton = () => (
    <Button variant="ghost" size="sm" className={"w-full justify-center text-sm sm:w-auto"} asChild>
      <Link href={moreHref!} className="flex items-center gap-1">
        View all <RiArrowRightLine className="h-4 w-4" />
      </Link>
    </Button>
  )

  const ViewAllButtonMobile = () => (
    <Button
      variant="ghost"
      size="sm"
      className={"bg-secondary w-full justify-center text-sm sm:w-auto"}
      asChild
    >
      <Link href={moreHref!} className="flex items-center gap-1">
        View all <RiArrowRightLine className="h-4 w-4" />
      </Link>
    </Button>
  )

  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
        {moreHref && (
          <div className="hidden sm:block">
            <ViewAllButton />
          </div>
        )}
      </div>

      <div>
        {sortedEntities.length > 0 ? (
          <div className="-mx-3 flex flex-col sm:-mx-4">
            {sortedEntities.map((entity, index) => (
              <EntityCard
                key={entity.id}
                id={entity.id}
                slug={entity.slug}
                name={entity.name}
                description={entity.description ?? ""}
                logoUrl={entity.logoUrl ?? ""}
                upvoteCount={entity.upvoteCount ?? 0}
                avgRating={entity.avgRating ?? 0}
                reviewCount={entity.reviewCount ?? 0}
                index={index}
                userHasUpvoted={entity.userHasUpvoted ?? false}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground border-border bg-card rounded-lg border border-dashed py-8 text-center text-sm">
            {'No gems found for "' + title + '"'}
          </div>
        )}

        {moreHref && (
          <div className="mt-4 sm:hidden">
            <ViewAllButtonMobile />
          </div>
        )}
      </div>
    </section>
  )
}
