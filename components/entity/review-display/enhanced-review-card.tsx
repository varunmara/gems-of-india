/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ReviewWithAttributes } from "@/drizzle/db/schema"
import {
  RiCalendarLine,
  RiEyeOffLine,
  RiMoreLine,
  RiShieldCheckLine,
  RiThumbDownLine,
  RiThumbUpLine,
} from "@remixicon/react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StarRating } from "@/components/ui/star-rating"

interface EnhancedReviewCardProps {
  review: ReviewWithAttributes
  onVote?: (reviewId: string, voteType: "helpful" | "not_helpful") => void
  onEdit?: (review: ReviewWithAttributes) => void
  onDelete?: (reviewId: string) => void
  currentUserId?: string
  className?: string
}

export function EnhancedReviewCard({
  review,
  onVote,
  currentUserId,
  className,
}: EnhancedReviewCardProps) {
  const isOwner = currentUserId === review.userId
  const canVote = !isOwner && onVote

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Group tags by type
  const positiveTags = review.tags.filter((tagSelection) => tagSelection.tag.tagType === "positive")
  const concernTags = review.tags.filter((tagSelection) => tagSelection.tag.tagType === "concern")

  // Group attribute responses by category
  const attributesByCategory = review.attributeResponses.reduce(
    (acc, response) => {
      const category = response.attribute.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(response)
      return acc
    },
    {} as Record<string, typeof review.attributeResponses>,
  )

  const renderAttributeValue = (response: (typeof review.attributeResponses)[0]) => {
    const { attribute, value } = response
    const metadata = (attribute.metadata as any) || {}

    if (attribute.attributeType === "scale") {
      const score = (value as { score: number }).score || 0
      const maxScore = metadata.max || 10
      const percentage = (score / maxScore) * 100

      return (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Progress value={percentage} className="h-1.5" />
          </div>
          <span className="text-muted-foreground min-w-0 font-mono text-xs">
            {score}/{maxScore}
          </span>
        </div>
      )
    } else if (attribute.attributeType === "boolean") {
      const boolValue = (value as { value: boolean }).value
      return (
        <Badge
          variant={boolValue ? "default" : "secondary"}
          className={cn(
            "text-xs",
            boolValue
              ? "border-green-200 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "border-red-200 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
          )}
        >
          {boolValue ? metadata.trueLabel || "Yes" : metadata.falseLabel || "No"}
        </Badge>
      )
    }

    return null
  }

  return (
    <Card className={cn("space-y-4 p-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage
              src={review.isAnonymous ? undefined : review.user.image || undefined}
              alt={review.isAnonymous ? "Anonymous" : review.user.name}
            />
            <AvatarFallback className="text-sm">
              {review.isAnonymous ? "?" : getInitials(review.user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-foreground font-medium">
                {review.isAnonymous ? "Anonymous User" : review.user.name}
              </span>
              {review.verified && <RiShieldCheckLine className="h-4 w-4 text-blue-500" />}
              {review.isAnonymous && <RiEyeOffLine className="text-muted-foreground h-4 w-4" />}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-muted-foreground text-sm">•</span>
              <span className="text-muted-foreground text-sm">
                {formatDate(review.createdAt || new Date())}
              </span>
              {review.experienceDate && (
                <>
                  <span className="text-muted-foreground text-sm">•</span>
                  <div className="flex items-center gap-1">
                    <RiCalendarLine className="h-3 w-3" />
                    <span className="text-muted-foreground text-xs">
                      Experience: {formatDate(review.experienceDate)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {isOwner && (
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <RiMoreLine className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Review Content */}
      <div className="space-y-3">
        <h4 className="text-foreground font-semibold">{review.title}</h4>
        <p className="text-foreground text-sm leading-relaxed">{review.content}</p>
      </div>

      {/* Attributes */}
      {Object.keys(attributesByCategory).length > 0 && (
        <div className="space-y-3">
          <h5 className="text-foreground text-sm font-medium">Detailed Ratings</h5>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(attributesByCategory).map(([category, responses]) => (
              <div key={category} className="space-y-2">
                <h6 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {category.replace("_", " ")}
                </h6>
                <div className="space-y-2">
                  {responses.map((response) => (
                    <div key={response.id} className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                        {response.attribute.label}
                      </span>
                      {renderAttributeValue(response)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {(positiveTags.length > 0 || concernTags.length > 0) && (
        <div className="space-y-3">
          <h5 className="text-foreground text-sm font-medium">What stood out</h5>

          <div className="space-y-2">
            {positiveTags.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  ✨ Positives
                </span>
                <div className="flex flex-wrap gap-1">
                  {positiveTags.map((tagSelection) => (
                    <Badge
                      key={tagSelection.tag.id}
                      variant="secondary"
                      className="border-green-200 bg-green-100 text-xs text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                    >
                      {tagSelection.tag.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {concernTags.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  ⚠️ Areas of Concern
                </span>
                <div className="flex flex-wrap gap-1">
                  {concernTags.map((tagSelection) => (
                    <Badge
                      key={tagSelection.tag.id}
                      variant="secondary"
                      className="border-red-200 bg-red-100 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                    >
                      {tagSelection.tag.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {(review.overallSatisfaction || review.recommendToOthers !== null) && (
        <div className="text-muted-foreground flex items-center gap-4 border-t pt-2 text-xs">
          {review.overallSatisfaction && <span>Satisfaction: {review.overallSatisfaction}/10</span>}
          {review.recommendToOthers !== null && (
            <span>{review.recommendToOthers ? "👍 Recommends" : "👎 Doesn't recommend"}</span>
          )}
          {review.hasEvidence && (
            <span className="text-blue-600 dark:text-blue-400">📋 Evidence provided</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-2">
        <div className="flex items-center gap-1">
          {canVote && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1 text-xs",
                  review.userVote === "helpful" &&
                    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
                )}
                onClick={() => onVote(review.id, "helpful")}
              >
                <RiThumbUpLine className="h-3 w-3" />
                Helpful ({review.helpful})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1 text-xs",
                  review.userVote === "not_helpful" &&
                    "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                )}
                onClick={() => onVote(review.id, "not_helpful")}
              >
                <RiThumbDownLine className="h-3 w-3" />
                Not Helpful ({review.notHelpful})
              </Button>
            </div>
          )}

          {!canVote && (
            <div className="text-muted-foreground flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <RiThumbUpLine className="h-3 w-3" />
                {review.helpful} helpful
              </span>
              <span className="flex items-center gap-1">
                <RiThumbDownLine className="h-3 w-3" />
                {review.notHelpful} not helpful
              </span>
            </div>
          )}
        </div>

        {review.edited && (
          <Badge variant="outline" className="text-xs">
            Edited
          </Badge>
        )}
      </div>
    </Card>
  )
}
