import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { EntityCard } from "@/components/home/entity-card"
import { getChildEntitiesByParentId, getEntityBySlug } from "@/app/actions/entities"

// Skeleton for the entity card
function EntityCardSkeleton() {
  return (
    <div className="mx-3 animate-pulse rounded-xl border border-zinc-100 bg-white/70 p-3 shadow-sm sm:mx-4 sm:p-4 dark:border-zinc-800/50 dark:bg-zinc-900/30">
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
  )
}

// Skeleton for the members header
function MembersHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="bg-muted h-8 w-48 animate-pulse rounded"></div>
      <div className="bg-muted h-8 w-24 animate-pulse rounded"></div>
    </div>
  )
}

function MembersDataSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <MembersHeaderSkeleton />
      <div className="-mx-3 flex flex-col sm:-mx-4">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <EntityCardSkeleton key={index} />
          ))}
      </div>
    </div>
  )
}

// Server component that fetches entity by slug
async function MembersDataWithEntity({
  slug,
  sort = "recent",
  page = 1,
}: {
  slug: string
  sort?: string
  page?: number
}) {
  const entity = await getEntityBySlug(slug)

  if (!entity) {
    notFound()
  }

  return (
    <MembersData
      parentEntityId={entity.id}
      sort={sort}
      page={page}
      entityType={entity.entityType}
    />
  )
}

async function MembersData({
  parentEntityId,
  sort = "recent",
  page = 1,
  entityType,
}: {
  parentEntityId: string
  sort?: string
  page?: number
  entityType: string
}) {
  const ITEMS_PER_PAGE = 10
  const currentPage = Math.max(1, page)

  const { entities: paginatedEntities, totalCount } = await getChildEntitiesByParentId(
    parentEntityId,
    currentPage,
    ITEMS_PER_PAGE,
    sort,
  )

  const isAuthenticated =
    paginatedEntities.length > 0 ? typeof paginatedEntities[0].userHasUpvoted === "boolean" : false

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  /* eslint-disable */
  const getSortLabel = () => {
    switch (sort) {
      case "upvotes":
        return "Most Upvotes"
      case "alphabetical":
        return "A-Z"
      case "recent":
      default:
        return "Most Recent"
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">{getMemberLabel()}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} {totalCount === 1 ? "member" : "members"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <RiFilterLine className="h-3.5 w-3.5" />
              <span className="hidden md:block">{getSortLabel()}</span>
              <RiArrowDownSLine className="text-muted-foreground ml-1 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link
                href={`?sort=recent&page=1`}
                className={sort === "recent" || !sort ? "bg-muted/50 font-medium" : ""}
              >
                Most Recent
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`?sort=upvotes&page=1`}
                className={sort === "upvotes" ? "bg-muted/50 font-medium" : ""}
              >
                Most Upvotes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`?sort=alphabetical&page=1`}
                className={sort === "alphabetical" ? "bg-muted/50 font-medium" : ""}
              >
                Alphabetical
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div> */}

      {totalCount === 0 ? (
        <div className="text-muted-foreground border-border bg-card rounded-lg border border-dashed py-8 text-center text-sm">
          No members found for this {entityType}.
          <p className="mt-2">Check back later or browse other organizations.</p>
        </div>
      ) : (
        <div className="-mx-3 flex flex-col sm:-mx-4">
          {paginatedEntities.map((entity, index) => (
            <EntityCard
              key={entity.id}
              id={entity.id}
              slug={entity.slug}
              name={entity.name}
              description={entity.description ?? ""}
              logoUrl={entity.logoUrl ?? ""}
              upvoteCount={entity.upvoteCount ?? 0}
              index={index}
              isAuthenticated={isAuthenticated}
              userHasUpvoted={entity.userHasUpvoted ?? false}
              avgRating={0}
              reviewCount={0}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center space-x-4 border-t pt-4">
          <Button asChild variant="outline" size="sm" disabled={currentPage <= 1}>
            <Link
              href={`?sort=${sort}&page=${currentPage - 1}`}
              aria-disabled={currentPage <= 1}
              className={` ${
                currentPage <= 1
                  ? "text-muted-foreground hover:text-muted-foreground pointer-events-none cursor-not-allowed opacity-50"
                  : ""
              } `}
            >
              Previous
            </Link>
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button asChild variant="outline" size="sm" disabled={currentPage >= totalPages}>
            <Link
              href={`?sort=${sort}&page=${currentPage + 1}`}
              aria-disabled={currentPage >= totalPages}
              className={` ${
                currentPage >= totalPages
                  ? "text-muted-foreground hover:text-muted-foreground pointer-events-none cursor-not-allowed opacity-50"
                  : ""
              } `}
            >
              Next
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; page?: string }>
}) {
  const { slug } = await params
  const { sort = "recent", page = "1" } = await searchParams

  return (
    <div className="space-y-6">
      <Suspense fallback={<MembersDataSkeleton />}>
        <MembersDataWithEntity slug={slug} sort={sort} page={parseInt(page, 10)} />
      </Suspense>
    </div>
  )
}
