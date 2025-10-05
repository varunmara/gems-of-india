"use client"

import { useState } from "react"

import { RiStarFill, RiStarLine } from "@remixicon/react"

import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
}

export function StarRating({
  rating,
  size = "md",
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const handleClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1)
    }
  }

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[...Array(5)].map((_, i) => {
        const filled = i < displayRating

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default",
            )}
            onMouseEnter={() => interactive && setHoverRating(i + 1)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => handleClick(i)}
          >
            {filled ? (
              <RiStarFill className={cn(sizeMap[size], "text-yellow-400")} />
            ) : (
              <RiStarLine className={cn(sizeMap[size], "text-muted-foreground")} />
            )}
          </button>
        )
      })}
    </div>
  )
}
