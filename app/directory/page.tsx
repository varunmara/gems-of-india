"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { RiArrowDownSLine, RiFilterLine } from "@remixicon/react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { EntityCard } from "@/components/home/entity-card"
import { getEntitiesForDirectory } from "@/app/actions/entities"

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

// Skeleton for the header
function DirectoryHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="bg-muted h-8 w-48 animate-pulse rounded"></div>
      <div className="bg-muted h-8 w-24 animate-pulse rounded"></div>
    </div>
  )
}

function DirectoryDataSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <DirectoryHeaderSkeleton />
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

type CityStatePair = {
  city: string
  state: string
}

function DirectoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entities, setEntities] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(false)

  // Get states and cities
  const [states, setStates] = useState<string[]>([])
  const [cityStatePairs, setCityStatePairs] = useState<CityStatePair[]>([])

  // URL params
  const sortParam = searchParams.get("sort") || "upvotes"
  const pageParam = parseInt(searchParams.get("page") || "1", 10)
  const searchQuery = searchParams.get("search") || ""
  const stateFilter = searchParams.get("state") || "all"
  const cityFilter = searchParams.get("city") || "all"
  const entityTypeFilter = searchParams.get("type") || "all"
  const statusFilter = searchParams.get("status") || "all"

  const ITEMS_PER_PAGE = 10
  const currentPage = Math.max(1, pageParam)

  const entityTypes = ["person", "department", "organization", "infrastructure"]

  // Filter cities based on selected state
  const filteredCities = useMemo(() => {
    if (stateFilter === "all") {
      // Return all unique cities
      return Array.from(new Set(cityStatePairs.map((pair) => pair.city))).sort()
    }
    // Return cities that belong to the selected state
    return cityStatePairs
      .filter((pair) => pair.state === stateFilter)
      .map((pair) => pair.city)
      .filter((city, index, self) => self.indexOf(city) === index)
      .sort()
  }, [stateFilter, cityStatePairs])

  // Update URL with new filter
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all" || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.set("page", "1") // Reset to page 1 on filter change
    router.push(`/directory?${params.toString()}`)
  }

  // Reset city filter when state changes
  useEffect(() => {
    if (stateFilter !== "all" && cityFilter !== "all") {
      // Check if the current city is in the filtered cities
      if (!filteredCities.includes(cityFilter)) {
        updateFilter("city", "all")
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter, cityFilter, filteredCities])

  // Fetch entities
  useEffect(() => {
    async function fetchEntities() {
      setLoading(true)
      try {
        const data = await getEntitiesForDirectory(
          currentPage,
          ITEMS_PER_PAGE,
          searchQuery,
          stateFilter,
          cityFilter,
          entityTypeFilter,
          statusFilter,
          sortParam,
        )
        setEntities(data.entities)
        setTotalCount(data.totalCount)
        setStates(data.states)
        setCityStatePairs(data.cityStatePairs)

        // Check if user is admin/moderator
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasPending = data.entities.some((e: any) => e.status === "pending")
        if (hasPending || statusFilter !== "all") {
          setIsAdminOrModerator(true)
        }
      } catch (error) {
        console.error("Error fetching entities:", error)
      }
      setLoading(false)
    }
    fetchEntities()
  }, [currentPage, sortParam, searchQuery, stateFilter, cityFilter, entityTypeFilter, statusFilter])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const getSortLabel = () => {
    switch (sortParam) {
      case "upvotes":
        return "Most Upvotes"
      case "alphabetical":
        return "A-Z"
      case "recent":
      default:
        return "Most Recent"
    }
  }

  const isAuthenticated =
    entities.length > 0 ? typeof entities[0].userHasUpvoted === "boolean" : false

  return (
    <main className="bg-secondary/20">
      <div className="container mx-auto min-h-screen max-w-6xl px-4 pt-8 pb-12">
        <div className="mb-6 flex flex-col">
          <h1 className="mb-4 text-2xl font-bold">Gems Directory</h1>

          {/* Filters Section */}
          <div className="bg-card mb-4 rounded-lg border p-4">
            {/* Search */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search gems..."
                value={searchQuery}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="h-10 w-full rounded-md border pr-2 pl-10 text-sm"
              />
              <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2">
              {/* State Filter */}
              <Select value={stateFilter} onValueChange={(v) => updateFilter("state", v)}>
                <SelectTrigger className="h-9 w-auto min-w-[100px] text-sm">
                  <span className="truncate">
                    {stateFilter === "all" ? "All States" : stateFilter}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* City Filter */}
              <Select value={cityFilter} onValueChange={(v) => updateFilter("city", v)}>
                <SelectTrigger className="h-9 w-auto min-w-[100px] text-sm">
                  <span className="truncate">
                    {cityFilter === "all" ? "All Cities" : cityFilter}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {filteredCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Entity Type Filter */}
              <Select value={entityTypeFilter} onValueChange={(v) => updateFilter("type", v)}>
                <SelectTrigger className="h-9 w-auto min-w-[100px] text-sm">
                  <span className="truncate">
                    {entityTypeFilter === "all"
                      ? "All Types"
                      : entityTypeFilter.charAt(0).toUpperCase() + entityTypeFilter.slice(1)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter (Admin/Moderator only) */}
              {isAdminOrModerator && (
                <Select value={statusFilter} onValueChange={(v) => updateFilter("status", v)}>
                  <SelectTrigger className="h-9 w-auto min-w-[100px] text-sm">
                    <span className="truncate">
                      {statusFilter === "all"
                        ? "All Status"
                        : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <RiFilterLine className="h-3.5 w-3.5" />
                    <span className="hidden md:block">{getSortLabel()}</span>
                    <RiArrowDownSLine className="text-muted-foreground ml-1 h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => updateFilter("sort", "recent")}>
                    <span className={sortParam === "recent" || !sortParam ? "font-medium" : ""}>
                      Most Recent
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateFilter("sort", "upvotes")}>
                    <span className={sortParam === "upvotes" ? "font-medium" : ""}>
                      Most Upvotes
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateFilter("sort", "alphabetical")}>
                    <span className={sortParam === "alphabetical" ? "font-medium" : ""}>
                      Alphabetical
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Entities List */}
        <div className="space-y-6 sm:space-y-8">
          {loading ? (
            <DirectoryDataSkeleton />
          ) : totalCount === 0 ? (
            <div className="text-muted-foreground border-border bg-card rounded-lg border border-dashed py-8 text-center text-sm">
              No gems found.
              <p className="mt-2">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {totalCount} {totalCount === 1 ? "Gem" : "Gems"}
                </h2>
              </div>
              <div className="-mx-3 flex flex-col sm:-mx-4">
                {entities.map((entity, index) => (
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
                    avgRating={entity.avgRating ?? 0}
                    reviewCount={entity.reviewCount ?? 0}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center space-x-4 border-t pt-4">
              <Button asChild variant="outline" size="sm" disabled={currentPage <= 1}>
                <Link
                  href={`/directory?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(currentPage - 1) }).toString()}`}
                  aria-disabled={currentPage <= 1}
                  className={`${
                    currentPage <= 1
                      ? "text-muted-foreground hover:text-muted-foreground pointer-events-none cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  Previous
                </Link>
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button asChild variant="outline" size="sm" disabled={currentPage >= totalPages}>
                <Link
                  href={`/directory?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(currentPage + 1) }).toString()}`}
                  aria-disabled={currentPage >= totalPages}
                  className={`${
                    currentPage >= totalPages
                      ? "text-muted-foreground hover:text-muted-foreground pointer-events-none cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  Next
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function DirectoryPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-secondary/20">
          <div className="container mx-auto min-h-screen max-w-6xl px-4 pt-8 pb-12">
            <DirectoryDataSkeleton />
          </div>
        </main>
      }
    >
      <DirectoryContent />
    </Suspense>
  )
}
