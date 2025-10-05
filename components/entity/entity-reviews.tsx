/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useOptimistic, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { EntityType, Review, ReviewWithUser } from "@/drizzle/db/schema"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { RiFlagLine, RiSearchLine, RiStarFill, RiThumbUpLine } from "@remixicon/react"
import { toast } from "sonner"

import { useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReviewFormWizard } from "@/components/entity/enhanced-review-form/review-form-wizard"
import { ReviewForm } from "@/components/entity/review-form"
import {
  createEnhancedReview,
  createReview,
  deleteReview,
  getEnhancedReviewData,
  SortOption,
  updateReview,
  voteOnReview,
} from "@/app/actions/reviews"

export type OptimisticReview = Review & {
  user: {
    id: string
    name: string
    avatar: string | null
    verified: boolean
  }
  userVote?: "helpful" | "not_helpful" | null
  optimistic?: boolean
}

interface EntityReviewsProps {
  entityId: string
  entityType: EntityType
  initialReviews: ReviewWithUser[]
  className?: string
  entityName?: string
  canUserWriteReview?: boolean
}

// ProductHunt-style Review Card Component
function ProductHuntReviewCard({
  review,
  currentUserId,
  onEdit,
  onDelete,
  onVote,
  className,
  isAdmin,
}: {
  review: OptimisticReview
  currentUserId?: string
  onEdit: (review: OptimisticReview) => void
  onDelete: (reviewId: string) => void
  onVote: (reviewId: string, voteType: "helpful" | "not_helpful") => void
  className?: string
  isAdmin?: boolean
}) {
  const isOwner = currentUserId === review.userId

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMonths = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30))
    if (diffInMonths < 1) return "Recently"
    return `${diffInMonths}mo ago`
  }

  return (
    <div className={cn("py-6 first:pt-0", className)}>
      <div className="flex items-start gap-4">
        {/* User Avatar */}
        {review.user.avatar ? (
          <Avatar className="h-10 w-10 rounded-full">
            <AvatarImage src={review.user.avatar} alt={review.user.name} />
            <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-medium text-white">
            {review.user.name.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* User Info and Rating */}
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h4 className="text-foreground font-medium">{review.user.name}</h4>
                {review.user.verified && (
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <RiStarFill
                    key={star}
                    className={`h-3.5 w-3.5 ${
                      star <= review.rating ? "text-yellow-500" : "text-muted-foreground/40"
                    }`}
                  />
                ))}
                <span className="text-muted-foreground ml-2 text-xs">
                  {formatTimeAgo(new Date(review.createdAt || new Date()))}
                </span>
              </div>
            </div>
          </div>

          {/* Review Title */}
          {review.title && (
            <h5 className="text-foreground mb-2 leading-snug font-medium">{review.title}</h5>
          )}

          {/* Review Content */}
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{review.content}</p>

          {/* Actions */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-6 text-sm">
            <button
              onClick={() => onVote(review.id, "helpful")}
              className="flex items-center gap-1.5 transition-colors hover:text-yellow-500"
            >
              <RiThumbUpLine className="h-4 w-4" />
              <span>Helpful ({review.helpful || 0})</span>
            </button>
            <button className="flex items-center gap-1.5 transition-colors hover:text-red-500">
              <RiFlagLine className="h-4 w-4" />
              <span>Report</span>
            </button>

            {/* Owner actions */}
            {isOwner ||
              (isAdmin && (
                <>
                  <button
                    onClick={() => onEdit(review)}
                    className="text-sm transition-colors hover:text-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(review.id)}
                    className="text-sm transition-colors hover:text-red-500"
                  >
                    Delete
                  </button>
                </>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ProductHunt-style Review Stats Component (Top section only)
function ProductHuntReviewStats({
  reviews,
  onWriteReview,
  session,
  router,
  canUserWriteReview,
}: {
  reviews: OptimisticReview[]
  onWriteReview: () => void
  session: any
  router: any
  canUserWriteReview?: boolean
}) {
  if (reviews.length === 0) {
    // Empty state - simple centered layout
    return null
  }

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (rating) => reviews.filter((review) => review.rating === rating).length,
  )

  return (
    <div className="border-border border-b pb-8">
      {/* Horizontal layout for rating stats */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Overall Rating */}
        <div className="text-center md:text-left">
          <div className="text-foreground mb-2 text-4xl font-bold">{averageRating.toFixed(1)}</div>
          <div className="mb-2 flex justify-center gap-1 md:justify-start">
            {[1, 2, 3, 4, 5].map((star) => (
              <RiStarFill
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(averageRating) ? "text-yellow-500" : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="max-w-md flex-1">
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating, index) => (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex w-10 items-center gap-1">
                  <RiStarFill className="h-3 w-3 text-yellow-500" />
                  <span className="text-muted-foreground text-sm">{rating}</span>
                </div>
                <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-300"
                    style={{
                      width:
                        reviews.length > 0
                          ? `${(ratingCounts[index] / reviews.length) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className="text-muted-foreground w-4 text-right text-sm">
                  {ratingCounts[index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Review Action */}
        {canUserWriteReview && (
          <div className="text-center">
            <Button
              onClick={() => {
                if (session?.user) {
                  onWriteReview()
                } else {
                  router.push("/sign-in")
                }
              }}
            >
              Leave a review
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EntityReviews({
  entityId,
  entityType,
  initialReviews,
  className,
  canUserWriteReview,
}: EntityReviewsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState("")

  // Enhanced review system state
  const [useEnhancedForm, setUseEnhancedForm] = useState(true)
  const [attributes, setAttributes] = useState<any[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [attributeStats, setAttributeStats] = useState<any[]>([])
  const [tagStats, setTagStats] = useState<any[]>([])
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(true)

  // Local state
  const [showWriteForm, setShowWriteForm] = useState(false)
  const [editingReview, setEditingReview] = useState<ReviewWithUser | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("newest")

  // Optimistic updates
  const [optimisticReviews, addOptimisticReview] = useOptimistic<
    OptimisticReview[],
    OptimisticReview
  >(
    initialReviews as OptimisticReview[],
    (currentReviews: OptimisticReview[], optimisticValue: OptimisticReview) => {
      if (optimisticValue.optimistic) {
        return [optimisticValue, ...currentReviews]
      }
      return currentReviews.map((review) =>
        review.id === optimisticValue.id ? optimisticValue : review,
      )
    },
  )
  const loadEnhancedData = async () => {
    setIsLoadingEnhanced(true)
    try {
      const result = await getEnhancedReviewData(entityType, entityId)

      if (result.success) {
        setAttributes(result.data.attributes)
        setTags(result.data.tags)
        setAttributeStats(result.data.attributeStats)
        setTagStats(result.data.tagStats)
      } else {
        console.error("Error loading enhanced review data:", result.error)
        // Set empty arrays as fallback
        setAttributes([])
        setTags([])
        setAttributeStats([])
        setTagStats([])
      }
    } catch (error) {
      console.error("Error loading enhanced review data:", error)
      // Set empty arrays as fallback
      setAttributes([])
      setTags([])
      setAttributeStats([])
      setTagStats([])
    } finally {
      setIsLoadingEnhanced(false)
    }
  }

  // Load enhanced review data
  useEffect(() => {
    loadEnhancedData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityType])

  // Sort and filter reviews
  const filteredAndSortedReviews = [...optimisticReviews]
    .filter(
      (review) =>
        searchTerm === "" ||
        review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case "highest":
          return b.rating - a.rating
        case "lowest":
          return a.rating - b.rating
        case "helpful":
          return (b.helpful || 0) - (a.helpful || 0)
        default:
          return 0
      }
    })

  // Enhanced review submission handler
  const handleEnhancedReviewSubmit = async (formData: any) => {
    if (!session?.user) {
      toast.error("Please sign in to write a review")
      return
    }

    startTransition(async () => {
      const result = await createEnhancedReview({
        entityId,
        rating: formData.rating,
        title: formData.title,
        content: formData.content,
        overallSatisfaction: formData.overallSatisfaction,
        recommendToOthers: formData.recommendToOthers,
        hasEvidence: formData.hasEvidence,
        isAnonymous: formData.isAnonymous,
        experienceDate: formData.experienceDate,
        attributeResponses: formData.attributeResponses,
        selectedTagIds: formData.selectedTagIds,
      })

      if (result.success) {
        setShowWriteForm(false)
        await loadEnhancedData() // Reload enhanced data
        toast.success("Review submitted successfully!")
      } else {
        toast.error(result.error || "Failed to submit review. Please try again.")
      }
    })
  }

  // Handlers (keeping the same logic as original)
  const handleSubmitReview = async (data: { rating: number; title: string; content: string }) => {
    if (!session?.user) {
      toast.error("Please sign in to write a review")
      return
    }

    if (editingReview) {
      const optimisticUpdatedReview: OptimisticReview = {
        ...editingReview,
        ...data,
        edited: true,
        updatedAt: new Date(),
      }

      startTransition(async () => {
        addOptimisticReview(optimisticUpdatedReview)
        setEditingReview(null)
        setShowWriteForm(false)

        const result = await updateReview(editingReview.id, data)
        if (!result.success) {
          toast.error(result.error || "Failed to update review")
        } else {
          toast.success("Review updated successfully!")
        }
      })
    } else {
      const optimisticNewReview: OptimisticReview = {
        id: `temp-${Date.now()}`,
        ...data,
        entityId,
        userId: session.user.id,
        helpful: 0,
        notHelpful: 0,
        verified: false,
        edited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Provide defaults for missing properties
        overallSatisfaction: null,
        recommendToOthers: null,
        hasEvidence: false,
        isAnonymous: false,
        experienceDate: null,
        user: {
          id: session.user.id,
          name: session.user.name || "Anonymous",
          avatar: session.user.image || null,
          verified: Boolean(session.user.emailVerified),
        },
        userVote: null,
        optimistic: true,
      }

      startTransition(async () => {
        addOptimisticReview(optimisticNewReview)
        setShowWriteForm(false)

        const result = await createReview({ entityId, ...data })
        if (!result.success) {
          toast.error(result.error || "Failed to create review")
        } else {
          toast.success("Review submitted successfully!")
        }
      })
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return

    startTransition(async () => {
      const result = await deleteReview(reviewId)
      if (!result.success) {
        toast.error(result.error || "Failed to delete review")
      } else {
        toast.success("Review deleted successfully!")
      }
    })
  }

  const handleVoteOnReview = async (reviewId: string, voteType: "helpful" | "not_helpful") => {
    if (!session?.user) {
      toast.error("Please sign in to vote on reviews")
      return
    }

    startTransition(async () => {
      const result = await voteOnReview(reviewId, voteType)
      if (!result.success) {
        toast.error(result.error || "Failed to vote on review")
      }
    })
  }

  const handleEditReview = (review: OptimisticReview) => {
    setEditingReview(review)
    setShowWriteForm(true)
  }

  const handleCancelForm = () => {
    setShowWriteForm(false)
    setEditingReview(null)
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* ProductHunt-style Review Header Stats */}
      <ProductHuntReviewStats
        reviews={optimisticReviews}
        onWriteReview={() => setShowWriteForm(true)}
        session={session}
        router={router}
        canUserWriteReview={canUserWriteReview}
      />

      {/* Enhanced Stats - Always Visible */}
      {!isLoadingEnhanced && (attributeStats.length > 0 || tagStats.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {attributeStats.map((attribute) => {
            const isScale = attribute.attributeType === "scale"
            const averageValue = attribute.averageScore?.toFixed(1) || "0.0"

            // Pick color (green/orange/red) based on value
            let colorClass =
              "text-xs bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"

            if (isScale) {
              if (attribute.averageScore >= 7) {
                colorClass =
                  "text-xs bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
              } else if (attribute.averageScore >= 5) {
                colorClass =
                  "text-xs bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800"
              } else {
                colorClass =
                  "text-xs bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
              }
            }

            return (
              <div
                key={attribute.id}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium ${colorClass}`}
              >
                <span>{attribute.label}</span>
                <span className="text-xs font-normal">
                  (
                  {attribute.attributeType === "scale"
                    ? averageValue
                    : (attribute.positivePercentage || 0).toFixed(1) > 0
                      ? attribute.positivePercentage.toFixed(1) + "%"
                      : "No"}
                  )
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Write Review Form */}
      {showWriteForm && (
        <div className="border-border border-b pb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Write a Review</h3>
            {!isLoadingEnhanced && attributes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseEnhancedForm(!useEnhancedForm)}
              >
                {useEnhancedForm ? "Simple Form" : "Enhanced Form"}
              </Button>
            )}
          </div>

          {/* Enhanced Review Form */}
          {useEnhancedForm && !isLoadingEnhanced && attributes.length > 0 ? (
            <ReviewFormWizard
              entityId={entityId}
              entityType={entityType}
              attributes={attributes}
              tags={tags}
              editingReview={editingReview}
              onSubmit={handleEnhancedReviewSubmit}
              onCancel={handleCancelForm}
              isSubmitting={isPending}
            />
          ) : (
            <ReviewForm
              entityId={entityId}
              editingReview={editingReview}
              onSubmit={handleSubmitReview}
              onCancel={handleCancelForm}
              isSubmitting={isPending}
            />
          )}
        </div>
      )}

      {/* Reviews Section */}
      <div className="space-y-6">
        {/* Reviews Header with Search and Sort */}
        {optimisticReviews.length > 0 && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">Reviews ({optimisticReviews.length})</h3>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <RiSearchLine className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-input bg-background placeholder:text-muted-foreground focus:border-ring focus:ring-ring w-full rounded-md border py-2 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none sm:w-64"
                />
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-auto sm:min-w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="highest">Highest Rating</SelectItem>
                  <SelectItem value="lowest">Lowest Rating</SelectItem>
                  <SelectItem value="helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {optimisticReviews.length > 0 ? (
          <div className="divide-border space-y-0 divide-y">
            {filteredAndSortedReviews.map((review) => (
              <ProductHuntReviewCard
                key={review.id}
                review={review}
                currentUserId={session?.user?.id}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
                onVote={handleVoteOnReview}
                className={review.optimistic ? "opacity-70" : undefined}
                isAdmin={session?.user?.role === "admin" || session?.user?.role === "maintainer"}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="py-12 text-center">
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <RiStarFill className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No Reviews Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share your experience with this {entityType}.
            </p>
            {!showWriteForm && (
              <Button
                onClick={() => {
                  if (session?.user) {
                    setShowWriteForm(true)
                  } else {
                    router.push("/sign-in")
                  }
                }}
              >
                Write the First Review
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
