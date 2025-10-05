"use client"

import { ReviewWithUser } from "@/drizzle/db/schema"

import { cn } from "@/lib/utils"
import { StarRating } from "@/components/ui/star-rating"

interface ReviewStatsProps {
  reviews: ReviewWithUser[]
  className?: string
}

export function ReviewStats({ reviews, className }: ReviewStatsProps) {
  if (reviews.length === 0) {
    return (
      <div className={cn("border-border bg-card rounded-lg border p-6", className)}>
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold">No Reviews Yet</h3>
          <p className="text-muted-foreground">Be the first to review this entity!</p>
        </div>
      </div>
    )
  }

  const totalReviews = reviews.length
  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews

  // Calculate rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
    percentage: (reviews.filter((review) => review.rating === rating).length / totalReviews) * 100,
  }))

  return (
    <div className={cn("border-border bg-card rounded-lg border p-6", className)}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Overall Rating */}
        <div className="text-center">
          <div className="mb-2">
            <span className="text-foreground text-4xl font-bold">{avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground ml-1 text-lg">/ 5</span>
          </div>

          <div className="mb-3 flex justify-center">
            <StarRating rating={Math.round(avgRating)} size="md" />
          </div>

          <p className="text-muted-foreground text-sm">
            Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {ratingCounts.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-4">
              <div className="flex w-24 items-center gap-3">
                <span className="text-sm font-medium">{rating}</span>
                <div className="h-4 w-4 flex-shrink-0">
                  <StarRating rating={1} size="sm" />
                </div>
              </div>

              <div className="bg-muted mr-2 h-2 min-w-0 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <span className="text-muted-foreground w-8 flex-shrink-0 text-right text-sm">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
