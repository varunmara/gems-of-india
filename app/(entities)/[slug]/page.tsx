/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { EntityType } from "@/drizzle/db/schema"
import { RiVipCrownLine } from "react-icons/ri"

import { Button } from "@/components/ui/button"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { RichTextDisplay } from "@/components/ui/rich-text-editor"
import { EditButton } from "@/components/entity/edit-button"
import EntityReviews from "@/components/entity/entity-reviews"
import { EntityStatusDropdown } from "@/components/entity/entity-status-dropdown"
import { canUserReview, getEntityReviews } from "@/app/actions/reviews"

import { useEntity } from "./entity-context"

interface ReviewsData {
  initialReviews: any
  canUserWriteReview: boolean
}

export default function OverviewPage() {
  const { entity, session } = useEntity()
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)

  useEffect(() => {
    async function loadReviews() {
      const [initialReviews, canUserWriteReview] = await Promise.all([
        getEntityReviews(entity.id, { limit: 10 }),
        session?.user ? canUserReview(entity.id) : Promise.resolve(false),
      ])

      setReviewsData({ initialReviews, canUserWriteReview })
    }

    loadReviews()
  }, [entity.id, session?.user])

  if (!reviewsData) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
      </div>
    )
  }
  const isOwner = session?.user?.id === entity.createdBy
  const isAdminOrModerator = session?.user?.role === "admin" || session?.user?.role === "moderator"

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="w-full">
        <RichTextDisplay content={entity.description || ""} />
      </div>

      {/* Separator */}
      <div className="border-border/50 border-t"></div>

      {/* Badge SVG for top 3 winners only */}
      {session?.user?.id === entity.createdBy &&
        entity.status === "published" &&
        entity.dailyRanking &&
        entity.dailyRanking <= 3 && (
          <div className="border-primary/30 bg-primary/10 text-primary flex flex-col items-center justify-between gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-center text-sm font-medium">
              Congratulations! You earned a badge for your ranking.
            </span>
            <Button asChild variant="default" size="sm" className="flex items-center gap-2">
              <Link href={`/${entity.slug}/badges`}>
                <RiVipCrownLine className="h-4 w-4" />
                View Badges
              </Link>
            </Button>
          </div>
        )}

      {/* Edit button for owners */}
      {(isOwner || isAdminOrModerator) && (
        <div className="mt-4 mb-4 flex flex-wrap items-center gap-4">
          <EditButton
            entitySlug={entity.slug}
            canEdit={isAdminOrModerator || (isOwner && entity.status === "pending")}
          />

          {/* Status dropdown for admins/maintainers */}
          {isAdminOrModerator && (
            <EntityStatusDropdown
              entityId={entity.id}
              currentStatus={entity.status}
              isAdmin={isAdminOrModerator}
            />
          )}
        </div>
      )}

      {/* Reviews */}
      <div>
        <EntityReviews
          entityId={entity.id}
          entityType={entity.entityType as EntityType}
          initialReviews={reviewsData.initialReviews}
          canUserWriteReview={reviewsData.canUserWriteReview}
        />
      </div>
    </div>
  )
}
