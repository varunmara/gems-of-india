"use client"

import { useState } from "react"

import { ReviewWithUser } from "@/drizzle/db/schema"
import {
  RiCalendarLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFlagLine,
  RiMoreLine,
  RiThumbDownLine,
  RiThumbUpLine,
} from "@remixicon/react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StarRating } from "@/components/ui/star-rating"

interface ReviewCardProps {
  review: ReviewWithUser
  currentUserId?: string | null
  onEdit?: (review: ReviewWithUser) => void
  onDelete?: (reviewId: string) => void
  onVote?: (reviewId: string, voteType: "helpful" | "not_helpful") => void
  className?: string
}

export function ReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete,
  onVote,
  className,
}: ReviewCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const isOwner = currentUserId === review.userId
  const userVoted = review.userVote

  const handleVote = (voteType: "helpful" | "not_helpful") => {
    if (onVote) {
      onVote(review.id, voteType)
    }
  }

  return (
    <div
      className={cn(
        "border-border bg-card text-card-foreground rounded-lg border p-6 transition-shadow hover:shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.user.avatar || undefined} alt={review.user.name} />
            <AvatarFallback>{review.user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-foreground font-semibold">{review.user.name}</h4>
              {review.user.verified && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
              {review.verified && (
                <Badge variant="outline" className="text-xs text-green-600">
                  Verified Purchase
                </Badge>
              )}
              {review.edited && <span className="text-muted-foreground text-xs">(edited)</span>}
            </div>

            <div className="mt-1 flex items-center gap-3">
              <StarRating rating={review.rating} size="sm" />
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <RiCalendarLine className="h-3 w-3" />
                {review.createdAt
                  ? format(new Date(review.createdAt), "MMM d, yyyy")
                  : "Unknown date"}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <RiMoreLine className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner ? (
              <>
                <DropdownMenuItem onClick={() => onEdit?.(review)}>
                  <RiEditLine className="mr-2 h-4 w-4" />
                  Edit Review
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(review.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <RiDeleteBinLine className="mr-2 h-4 w-4" />
                  Delete Review
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <RiFlagLine className="mr-2 h-4 w-4" />
                Report Review
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Review Content */}
      <div className="mb-4">
        <h3 className="text-foreground mb-2 font-semibold">{review.title}</h3>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {review.content}
        </p>
      </div>

      {/* Helpful Actions */}
      <div className="border-border flex items-center gap-3 border-t pt-4">
        <Button
          variant={userVoted === "helpful" ? "default" : "outline"}
          size="sm"
          onClick={() => handleVote("helpful")}
          className="h-8"
        >
          <RiThumbUpLine className="mr-2 h-4 w-4" />
          Helpful ({review.helpful})
        </Button>

        <Button
          variant={userVoted === "not_helpful" ? "destructive" : "outline"}
          size="sm"
          onClick={() => handleVote("not_helpful")}
          className="h-8"
        >
          <RiThumbDownLine className="mr-2 h-4 w-4" />
          Not Helpful ({review.notHelpful})
        </Button>
      </div>
    </div>
  )
}
