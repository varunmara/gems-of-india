import { unstable_cache } from "next/cache"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import { entity } from "@/drizzle/db/schema"
import { and, eq, ilike, sql } from "drizzle-orm"

import { API_RATE_LIMITS } from "@/lib/constants"
import { checkRateLimit } from "@/lib/rate-limit"

// define the return type for the search
export interface SearchResult {
  id: string
  name: string
  slug: string | null
  description: string | null
  logoUrl: string | null
  type: "entity" | "category"
}

// function to search with cache
const getSearchResults = unstable_cache(
  async (query: string, limit: number = 10): Promise<SearchResult[]> => {
    // check if the query is valid
    if (!query || query.length < 2) {
      return []
    }

    try {
      // search in entities
      const entities = await db
        .select({
          id: entity.id,
          name: entity.name,
          slug: entity.slug,
          description: entity.description,
          logoUrl: entity.logoUrl,
          type: sql<"entity">`'entity'`.as("type"),
        })
        .from(entity)
        .where(and(ilike(entity.name, `%${query}%`), eq(entity.status, "published")))
        .limit(limit)

      // format the results
      const formattedEntities: SearchResult[] = entities.map((entity) => ({
        id: entity.id,
        name: entity.name,
        slug: entity.slug,
        description: entity.description,
        logoUrl: entity.logoUrl,
        type: "entity" as const,
      }))

      return formattedEntities
    } catch (error) {
      console.error("[Search API] Error searching:", error)
      return []
    }
  },
  ["search-results"],
  { revalidate: 60 }, // revalidate the cache every 60 seconds
)

export async function GET(request: NextRequest) {
  try {
    // get the client's IP
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1"

    // check the rate limit with the specific constants for the search
    const rateLimitResult = await checkRateLimit(
      `search:${ip}`,
      API_RATE_LIMITS.SEARCH.REQUESTS,
      API_RATE_LIMITS.SEARCH.WINDOW,
    )
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: `Too many requests. Please wait ${rateLimitResult.reset} seconds before trying again.`,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": API_RATE_LIMITS.SEARCH.REQUESTS.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      )
    }

    // get the search parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    // get the search results
    const results = await getSearchResults(query, limit)

    // return the results with the rate limit headers
    return NextResponse.json(
      { results },
      {
        headers: {
          "X-RateLimit-Limit": API_RATE_LIMITS.SEARCH.REQUESTS.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      },
    )
  } catch (error) {
    console.error("[Search API] Error processing request:", error)
    return NextResponse.json(
      {
        error: "search_failed",
        message: "An error occurred while processing your search request. Please try again later.",
      },
      { status: 500 },
    )
  }
}
