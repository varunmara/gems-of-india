"use client"

import Link from "next/link"

import { RiCalendarLine, RiCheckLine, RiMessage2Line } from "@remixicon/react"
import { formatDistance } from "date-fns"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Function to strip HTML tags from text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim()
}

interface DashboardEntityCardProps {
  name: string
  slug: string
  logoUrl: string
  description: string
  status: string
  createdAt: string | Date
  commentCount?: number | string | null
  actionButton?: React.ReactNode
}

// Function to generate initials for avatar fallback
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("")
}

export function DashboardEntityCard({
  name,
  slug,
  logoUrl,
  description,
  status,
  createdAt,
  commentCount,
  actionButton,
}: DashboardEntityCardProps) {
  const entityPageUrl = `/${slug}`

  const renderStatusBadge = () => {
    if (status === "pending") {
      return (
        <span className="flex items-center gap-1 text-blue-600">
          <RiCalendarLine className="h-3.5 w-3.5" />
          Pending: {new Date(createdAt).toLocaleDateString()}
        </span>
      )
    } else if (status === "in_review") {
      // For ongoing, we'll display upvotes/comments separately
      return <span className="flex items-center gap-1 text-green-600">In Review</span>
    } else if (status === "published") {
      return (
        <span className="text-muted-foreground flex items-center gap-1">
          <RiCheckLine className="h-3.5 w-3.5" />
          Published: {formatDistance(new Date(createdAt), new Date(), { addSuffix: true })}
        </span>
      )
    }
    return null
  }

  const cardContent = (
    <>
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage src={logoUrl || undefined} alt={`${name} logo`} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-grow">
        <h4 className="truncate text-sm font-medium sm:text-base">{name}</h4>
        <p className="text-muted-foreground mb-1 truncate text-xs sm:text-sm">
          {stripHtml(description)}
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {/* Display the main status/date badge */}
          {renderStatusBadge()}

          {/* Display Comments for in_review and published */}
          {(status === "in_review" || status === "published") && commentCount != null && (
            <span className="flex items-center gap-1">
              <RiMessage2Line className="h-3.5 w-3.5" />
              {commentCount ?? 0}
            </span>
          )}
        </div>
      </div>
    </>
  )

  if (actionButton) {
    return (
      <div className="flex flex-col justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center dark:border-zinc-800/50">
        <Link href={entityPageUrl} className="flex min-w-0 flex-grow items-center gap-3">
          {cardContent}
        </Link>
        <div className="w-full flex-shrink-0 sm:w-auto">{actionButton}</div>
      </div>
    )
  }

  return (
    <Link
      href={entityPageUrl}
      className="hover:bg-secondary/40 flex items-center gap-3 rounded-lg border p-3 transition-colors dark:border-zinc-800/50"
    >
      {cardContent}
    </Link>
  )
}
