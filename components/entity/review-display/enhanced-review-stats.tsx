"use client"

import { EntityType, ReviewWithUser } from "@/drizzle/db/schema"
import { RiAwardLine, RiCalendarLine, RiThumbUpLine, RiUserLine } from "@remixicon/react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StarRating } from "@/components/ui/star-rating"

interface EnhancedReviewStatsProps {
  reviews: ReviewWithUser[]
  entityType: EntityType
  className?: string
}

export function EnhancedReviewStats({ reviews, entityType, className }: EnhancedReviewStatsProps) {
  if (reviews.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="space-y-3 text-center">
          <div className="bg-muted mx-auto flex h-16 w-16 items-center justify-center rounded-full">
            <RiUserLine className="text-muted-foreground h-8 w-8" />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-semibold">No Reviews Yet</h3>
            <p className="text-muted-foreground text-sm">
              Be the first to review this {entityType}!
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // Calculate basic stats
  const totalReviews = reviews.length
  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
  const avgSatisfaction = reviews
    .filter((r) => r.overallSatisfaction !== null)
    .reduce((sum, review, _, arr) => sum + review.overallSatisfaction! / arr.length, 0)

  const recommendationRate =
    (reviews
      .filter((r) => r.recommendToOthers !== null)
      .reduce((acc, review) => acc + (review.recommendToOthers ? 1 : 0), 0) /
      reviews.filter((r) => r.recommendToOthers !== null).length) *
    100

  const verifiedReviews = reviews.filter((r) => r.verified).length
  const recentReviews = reviews.filter((r) => {
    const reviewDate = new Date(r.createdAt || new Date())
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return reviewDate > thirtyDaysAgo
  }).length

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => review.rating === rating).length
    return {
      rating,
      count,
      percentage: (count / totalReviews) * 100,
    }
  })

  const getEntityTypeLabel = (type: EntityType) => {
    const labels = {
      person: "Government Official",
      department: "Department",
      organization: "Organization",
      infrastructure: "Infrastructure",
    }
    return labels[type] || type
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Stats Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Overall Rating */}
          <div className="text-center lg:text-left">
            <div className="space-y-3">
              <div>
                <span className="text-foreground text-4xl font-bold">{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground ml-1 text-lg">/ 5</span>
              </div>

              <div className="flex justify-center lg:justify-start">
                <StarRating rating={Math.round(avgRating)} size="md" />
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
                  Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                  for this {getEntityTypeLabel(entityType).toLowerCase()}
                </p>

                {verifiedReviews > 0 && (
                  <div className="flex items-center justify-center gap-1 lg:justify-start">
                    <RiAwardLine className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {verifiedReviews} verified review{verifiedReviews !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Rating Distribution</h4>
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex min-w-[60px] items-center gap-2">
                  <span className="w-1 text-sm font-medium">{rating}</span>
                  <div className="flex">
                    <StarRating rating={1} size="sm" />
                  </div>
                </div>

                <div className="flex-1">
                  <Progress value={percentage} className="h-2" />
                </div>

                <span className="text-muted-foreground min-w-[30px] text-right text-sm">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Additional Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {avgSatisfaction > 0 && (
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">Satisfaction</span>
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}</span>
                <span className="text-muted-foreground">/10</span>
                <Progress value={avgSatisfaction * 10} className="h-1.5" />
              </div>
            </div>
          </Card>
        )}

        {!isNaN(recommendationRate) && (
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RiThumbUpLine className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Would Recommend</span>
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-bold">{Math.round(recommendationRate)}</span>
                <span className="text-muted-foreground">%</span>
                <Progress value={recommendationRate} className="h-1.5" />
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RiCalendarLine className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Recent Activity</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-bold">{recentReviews}</span>
              <p className="text-muted-foreground text-xs">reviews in last 30 days</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RiUserLine className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Total Reviews</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-bold">{totalReviews}</span>
              <p className="text-muted-foreground text-xs">{entityType} feedback</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
