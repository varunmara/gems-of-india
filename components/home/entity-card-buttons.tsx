"use client"

import Link from "next/link"

import { RiStarFill } from "@remixicon/react"

import { UpvoteButton } from "@/components/entity/upvote-button"

interface EntityCardButtonsProps {
  entityPageUrl: string
  entityId: string
  upvoteCount: number
  isAuthenticated: boolean
  hasUpvoted: boolean
  entityName: string
  ratingCount: number
  averageRating: number
}

export function EntityCardButtons({
  entityPageUrl,
  averageRating,
  entityId,
  upvoteCount,
  isAuthenticated,
  hasUpvoted,
  entityName,
}: EntityCardButtonsProps) {
  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-start">
      <Link
        href={entityPageUrl}
        className="hover:border-primary dark:hover:border-primary group hidden h-12 w-12 flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 sm:flex"
        aria-label={`View reviews for ${entityName}`}
      >
        <RiStarFill className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
        <span className="mt-1 text-sm leading-none font-semibold text-gray-700 dark:text-gray-300">
          {averageRating.toFixed(1)}
        </span>
      </Link>

      <UpvoteButton
        entityId={entityId}
        initialUpvoted={hasUpvoted}
        upvoteCount={upvoteCount}
        isAuthenticated={isAuthenticated}
        variant="compact"
      />
    </div>
  )
}
