"use client"

import { useState } from "react"

import { ReviewWithUser } from "@/drizzle/db/schema"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StarRating } from "@/components/ui/star-rating"
import { Textarea } from "@/components/ui/textarea"

interface ReviewFormProps {
  entityId: string
  editingReview?: ReviewWithUser | null
  onSubmit: (data: { rating: number; title: string; content: string }) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  className?: string
}

export function ReviewForm({
  editingReview,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState(editingReview?.rating || 0)
  const [title, setTitle] = useState(editingReview?.title || "")
  const [content, setContent] = useState(editingReview?.content || "")

  const isEdit = Boolean(editingReview)
  const isValid = rating > 0 && title.trim().length > 0 && content.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) return

    await onSubmit({
      rating,
      title: title.trim(),
      content: content.trim(),
    })
  }

  return (
    <div className={cn("w-full max-w-none", className)}>
      <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-foreground text-lg font-semibold">
            {isEdit ? "Edit Your Review" : "Write a Review"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-3">
            <Label htmlFor="rating" className="text-foreground text-sm font-medium">
              Rating <span className="text-red-500">*</span>
            </Label>
            <div className="flex justify-start">
              <StarRating rating={rating} size="lg" interactive onRatingChange={setRating} />
            </div>
            {rating === 0 && (
              <p className="text-muted-foreground text-sm">Please select a rating</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-foreground text-sm font-medium">
              Review Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience..."
              maxLength={100}
              className="w-full"
            />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Brief, descriptive title for your review</span>
              <span>{title.length}/100</span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-foreground text-sm font-medium">
              Your Review <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell others about your experience with this entity. What did you like or dislike? Was it helpful for your use case?"
              maxLength={1000}
              rows={5}
              className="w-full resize-none"
            />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Share detailed feedback to help others</span>
              <span>{content.length}/1000</span>
            </div>
          </div>

          {/* Actions */}
          <div className="border-border flex gap-3 border-t pt-4">
            <Button type="submit" disabled={!isValid || isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isEdit ? "Updating..." : "Submitting..."}
                </>
              ) : isEdit ? (
                "Update Review"
              ) : (
                "Submit Review"
              )}
            </Button>

            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
