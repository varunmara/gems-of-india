"use client"

import React, { useEffect, useOptimistic, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { RiThumbUpFill, RiThumbUpLine } from "@remixicon/react"
import { toast } from "sonner"

import { UPVOTE_LIMITS } from "@/lib/constants"
import { cn, formatNumber } from "@/lib/utils"
import { toggleUpvote } from "@/app/actions/entities"

interface UpvoteButtonProps {
  entityId: string
  initialUpvoted: boolean
  upvoteCount: number
  isAuthenticated: boolean
  variant?: "default" | "compact"
  className?: string
}

export function UpvoteButton({
  entityId,
  initialUpvoted,
  upvoteCount,
  isAuthenticated,
  variant = "default",
  className,
}: UpvoteButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDebouncing, setIsDebouncing] = useState(false)
  const [optimisticState, updateOptimisticState] = useOptimistic(
    { upvoted: initialUpvoted, count: upvoteCount },
    (state, newUpvoted: boolean) => ({
      upvoted: newUpvoted,
      count: state.count + (newUpvoted ? 1 : -1),
    }),
  )

  // Reset debounce state after the time defined in the constants
  useEffect(() => {
    if (isDebouncing) {
      const timer = setTimeout(() => {
        setIsDebouncing(false)
      }, UPVOTE_LIMITS.DEBOUNCE_TIME_MS)
      return () => clearTimeout(timer)
    }
  }, [isDebouncing])

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isAuthenticated) {
      router.push("/sign-in")
      return
    }

    // If already processing or in debounce, ignore the click
    if (isPending || isDebouncing) {
      return
    }

    // Enable debounce
    setIsDebouncing(true)

    startTransition(async () => {
      updateOptimisticState(!optimisticState.upvoted)

      const response = await toggleUpvote(entityId)

      if (!response.success) {
        // Cancel optimistic update in case of error
        updateOptimisticState(optimisticState.upvoted)
        toast.error(response.message)
      }
    })
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleUpvote}
        disabled={isPending}
        className={cn(
          "hover:border-primary dark:hover:border-primary flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-xl border-2 transition-all duration-300",
          optimisticState.upvoted && "border-primary",
          className,
        )}
      >
        {optimisticState.upvoted ? (
          <RiThumbUpFill className="text-primary h-3.5 w-3.5" />
        ) : (
          <RiThumbUpLine className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
        )}
        <span
          className={cn(
            "mt-1 text-sm leading-none font-semibold",
            optimisticState.upvoted ? "text-primary" : "text-gray-700 dark:text-gray-300",
          )}
        >
          {formatNumber(optimisticState.count)}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={isPending}
      className={cn(
        "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 transition-colors",
        optimisticState.upvoted
          ? "border-blue-500 bg-blue-500 text-white hover:border-blue-600 hover:bg-blue-600"
          : "border-gray-200 bg-gray-100 text-gray-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400",
        !isAuthenticated && "cursor-not-allowed opacity-75",
        className,
      )}
    >
      {optimisticState.upvoted ? (
        <RiThumbUpFill className="h-4 w-4" />
      ) : (
        <RiThumbUpLine className="h-4 w-4" />
      )}
      <span className="text-sm">
        {formatNumber(optimisticState.count)} {optimisticState.count === 1 ? "upvote" : "upvotes"}
      </span>
    </button>
  )
}
