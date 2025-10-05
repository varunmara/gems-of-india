"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { RandomLogo } from "../shared/random-logo"
import { EntityCardButtons } from "./entity-card-buttons"

// Function to strip HTML tags from text
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim()
}

interface EntityCardProps {
  id: string
  slug: string
  name: string
  description: string
  logoUrl: string
  upvoteCount: number
  avgRating: number
  reviewCount: number
  index?: number
  userHasUpvoted: boolean
  isAuthenticated: boolean
}

export function EntityCard({
  id,
  slug,
  name,
  description,
  logoUrl,
  upvoteCount,
  avgRating,
  reviewCount,
  index,
  userHasUpvoted,
  isAuthenticated,
}: EntityCardProps) {
  const router = useRouter()
  const entityPageUrl = `/${slug}`

  return (
    <div
      className="group cursor-pointer rounded-xl p-3 transition-colors hover:bg-zinc-50 sm:p-4 dark:hover:bg-zinc-900/50"
      onClick={(e) => {
        e.stopPropagation()
        router.push(entityPageUrl)
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          {/* Logo */}
          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-transparent">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${name} Logo`}
                width={64}
                height={64}
                className="h-full w-full object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <RandomLogo name={name} />
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-grow">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Link href={entityPageUrl}>
                <h3 className="group-hover:text-primary line-clamp-1 text-sm font-medium transition-colors sm:text-base">
                  {typeof index === "number" ? `${index + 1}. ` : ""}
                  {name}
                </h3>
              </Link>
            </div>

            <p className="text-muted-foreground mb-1 line-clamp-2 text-xs sm:line-clamp-1 sm:text-sm">
              {stripHtml(description)}
            </p>
            <div className="mb-2 flex items-center gap-2 md:hidden">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      star <= Math.round(avgRating)
                        ? "fill-current text-yellow-500"
                        : "fill-current text-gray-300"
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-foreground text-xs font-medium sm:text-sm">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground xs:block hidden text-xs sm:text-sm">
                {reviewCount} review
                {reviewCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <EntityCardButtons
          entityPageUrl={entityPageUrl}
          entityId={id}
          upvoteCount={upvoteCount ?? 0}
          isAuthenticated={isAuthenticated}
          hasUpvoted={userHasUpvoted}
          entityName={name}
          ratingCount={reviewCount ?? 0}
          averageRating={avgRating ?? 0}
        />
      </div>
    </div>
  )
}
