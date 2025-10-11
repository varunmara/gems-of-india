import { headers } from "next/headers"
import Link from "next/link"

import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { EntitySection } from "@/components/home/entity-section"
import { WebsiteStructuredData } from "@/components/seo/structured-data"

import { getCurrentYearPageviews, getCurrentYearVisitors } from "./actions/analytics"
import { getMonthBestEntities, getTodayEntities, getTrendingEntities } from "./actions/home"

export default async function Home() {
  const todayEntities = await getTodayEntities()
  const trendingEntities = await getTrendingEntities()
  const monthEntities = await getMonthBestEntities()

  const currentYearVisitors = await getCurrentYearVisitors()
  const currentYearPageviews = await getCurrentYearPageviews()

  // // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return (
    <>
      <WebsiteStructuredData />
      <main className="bg-muted/30 min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 pt-6 pb-12 md:pt-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:items-start">
            {/* Contenu principal */}
            <div className="space-y-6 sm:space-y-8 lg:col-span-2">
              {/* Welcome Banner */}
              <div className="from-primary/10 via-primary/5 border-primary/20 relative overflow-hidden rounded-lg border bg-gradient-to-br to-transparent">
                <div className="px-6 py-8 text-center">
                  <div className="mx-auto max-w-2xl">
                    <h1 className="text-foreground mb-3 text-2xl font-bold md:text-3xl">
                      Discover Indian Gems
                    </h1>
                    <p className="text-muted-foreground mb-6 text-lg">
                      Find babus, politicians, and departments. Rate, review, and improve
                      accountability.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                      <Button asChild size="lg">
                        <Link href="/trending">Browse Gems</Link>
                      </Button>
                      <Button variant="outline" size="lg" asChild>
                        <Link href="/submit">Submit Gem</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <EntitySection
                title="Today's Top Rated"
                entities={todayEntities}
                sortByUpvotes={true}
                isAuthenticated={!!session?.user}
              />

              <EntitySection
                title="Trending This Week"
                entities={trendingEntities}
                moreHref="/trending"
                sortByUpvotes={true}
                isAuthenticated={!!session?.user}
              />

              <EntitySection
                title="This Month's Best"
                entities={monthEntities}
                moreHref="/trending?filter=month"
                sortByUpvotes={true}
                isAuthenticated={!!session?.user}
              />
            </div>

            {/* Sidebar */}
            <div className="top-24">
              {/* Platform Stats */}
              {/* Statistics */}
              {(currentYearVisitors !== null || currentYearPageviews !== null) && (
                <div className="space-y-3 pt-0 pb-4">
                  <h3 className="flex items-center gap-2 font-semibold">
                    Statistics ({new Date().getFullYear()})
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {currentYearVisitors !== null && (
                      <div className="hover:bg-muted/40 rounded-md border p-2 text-center transition-colors">
                        <div className="text-xl font-bold">{currentYearVisitors}</div>
                        <div className="text-muted-foreground text-xs font-medium">Visitors</div>
                      </div>
                    )}

                    {currentYearPageviews !== null && (
                      <div className="hover:bg-muted/40 rounded-md border p-2 text-center transition-colors">
                        <div className="text-xl font-bold">{currentYearPageviews}</div>
                        <div className="text-muted-foreground text-xs font-medium">Page Views</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Directory */}
              <div className="space-y-3 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold">Browse Directory</h3>
                  <Button variant="ghost" size="sm" className="text-sm" asChild>
                    <Link href="/directory" className="flex items-center gap-1">
                      View all
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-3 py-4">
                <h3 className="flex items-center gap-2 font-semibold">Quick Access</h3>
                <div className="space-y-2">
                  {session?.user && (
                    <Link
                      href="/dashboard"
                      className="-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:underline"
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    href="/trending"
                    className="-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:underline"
                  >
                    Trending Now
                  </Link>
                  <Link
                    href="/trending?filter=month"
                    className="-mx-2 flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:underline"
                  >
                    Best of Month
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
