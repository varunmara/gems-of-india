/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"

import { EntityType, ReviewAttribute, ReviewTag, ReviewWithUser } from "@/drizzle/db/schema"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiFileTextLine,
  RiHashtag,
  RiInformationLine,
  RiLoader4Line,
  RiStarLine,
} from "@remixicon/react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { StarRating } from "@/components/ui/star-rating"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

import { AttributeInput } from "./attribute-input"
import { TagSelector } from "./tag-selector"

interface ReviewFormData {
  rating: number
  title: string
  content: string
  overallSatisfaction: number
  recommendToOthers: boolean
  hasEvidence: boolean
  isAnonymous: boolean
  experienceDate: string
  attributeResponses: Record<string, any>
  selectedTagIds: string[]
}

interface ReviewFormWizardProps {
  entityId: string
  entityType: EntityType
  attributes: ReviewAttribute[]
  tags: ReviewTag[]
  editingReview?: ReviewWithUser | null
  onSubmit: (data: ReviewFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  className?: string
}

export function ReviewFormWizard({
  attributes,
  tags,
  editingReview,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}: ReviewFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: editingReview?.rating || 0,
    title: editingReview?.title || "",
    content: editingReview?.content || "",
    overallSatisfaction: editingReview?.overallSatisfaction || 5,
    recommendToOthers: editingReview?.recommendToOthers ?? true,
    hasEvidence: editingReview?.hasEvidence || false,
    isAnonymous: editingReview?.isAnonymous || false,
    experienceDate: editingReview?.experienceDate
      ? new Date(editingReview.experienceDate).toISOString().split("T")[0]
      : "",
    attributeResponses: {},
    selectedTagIds: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEdit = Boolean(editingReview)
  const totalSteps = 3

  // Group attributes by category for better organization
  const attributesByCategory = attributes.reduce(
    (acc, attr) => {
      if (!acc[attr.category]) {
        acc[attr.category] = []
      }
      acc[attr.category].push(attr)
      return acc
    },
    {} as Record<string, ReviewAttribute[]>,
  )

  // Group tags by type
  const positiveTag = tags.filter((tag) => tag.tagType === "positive")
  const concernTags = tags.filter((tag) => tag.tagType === "concern")

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (formData.rating === 0) {
        newErrors.rating = "Please select a rating"
      }
      if (!formData.title.trim()) {
        newErrors.title = "Please enter a review title"
      }
      if (!formData.content.trim()) {
        newErrors.content = "Please enter your review"
      }
    }

    if (step === 2) {
      // Validate required attributes
      attributes.forEach((attr) => {
        if (attr.isRequired && !formData.attributeResponses[attr.id]) {
          newErrors[`attr_${attr.id}`] = `${attr.label} is required`
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleAttributeChange = (attributeId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      attributeResponses: {
        ...prev.attributeResponses,
        [attributeId]: value,
      },
    }))

    // Clear error if exists
    if (errors[`attr_${attributeId}`]) {
      setErrors((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [`attr_${attributeId}`]: removed, ...rest } = prev
        return rest
      })
    }
  }

  const handleTagToggle = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTagIds: prev.selectedTagIds.includes(tagId)
        ? prev.selectedTagIds.filter((id) => id !== tagId)
        : [...prev.selectedTagIds, tagId],
    }))
  }

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      await onSubmit(formData)
    }
  }

  const renderStepper = () => (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between px-2">
        {[
          { step: 1, label: "Basic Review", icon: RiStarLine },
          { step: 2, label: "Detailed Feedback", icon: RiHashtag },
          { step: 3, label: "Tags & Submit", icon: RiFileTextLine },
        ].map(({ step, label, icon: Icon }) => (
          <div key={step} className="relative flex w-full flex-col items-center">
            {step < totalSteps && (
              <div className="absolute top-5 left-[calc(50%+1.5rem)] -z-10 hidden h-[2px] w-[calc(100%-3rem)] sm:block">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentStep > step ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            )}

            <div
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                currentStep > step
                  ? "bg-primary ring-primary/10 text-white ring-4"
                  : currentStep === step
                    ? "bg-primary ring-primary/20 text-white ring-4"
                    : "bg-muted/50 text-muted-foreground"
              }`}
            >
              {currentStep > step ? (
                <RiCheckLine className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>

            <div className="mt-2 text-center">
              <span
                className={`block text-xs font-medium ${
                  currentStep >= step ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 px-2">
        <div className="bg-muted/50 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Overall Rating <span className="text-red-500">*</span>
              </Label>
              <div className="flex justify-center">
                <StarRating
                  rating={formData.rating}
                  size="lg"
                  interactive
                  onRatingChange={(rating) => setFormData((prev) => ({ ...prev, rating }))}
                />
              </div>
              {errors.rating && <p className="text-center text-xs text-red-500">{errors.rating}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="title">
                Review Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience..."
                maxLength={100}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>Brief, descriptive title</span>
                <span>{formData.title.length}/100</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="content">
                Your Review <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Share your detailed experience with this entity..."
                maxLength={1000}
                rows={5}
                className={cn("resize-none", errors.content ? "border-red-500" : "")}
              />
              {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>Help others with detailed feedback</span>
                <span>{formData.content.length}/1000</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Additional Information</h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm">Overall Satisfaction (1-10)</Label>
                    <p className="text-muted-foreground text-xs">Rate your overall satisfaction</p>
                  </div>
                  <Badge variant="outline" className="text-sm font-medium">
                    {formData.overallSatisfaction}/10
                  </Badge>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.overallSatisfaction}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      overallSatisfaction: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <Label className="text-sm">Post anonymously (coming soon)</Label>
                    <p className="text-muted-foreground text-xs">Your identity will not be shown</p>
                  </div>
                  <Switch
                    checked={false}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isAnonymous: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">Detailed Feedback</h3>
              <p className="text-muted-foreground text-sm">
                Help others understand specific aspects of your experience
              </p>
            </div>

            {Object.entries(attributesByCategory).map(([category, categoryAttrs]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm font-medium capitalize">
                    {category.replace("_", " ")}
                  </Badge>
                  <Separator className="flex-1" />
                </div>

                <div className="space-y-6">
                  {categoryAttrs.map((attr) => (
                    <AttributeInput
                      key={attr.id}
                      attribute={attr}
                      value={formData.attributeResponses[attr.id]}
                      onChange={handleAttributeChange}
                      error={errors[`attr_${attr.id}`]}
                    />
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(attributesByCategory).length === 0 && (
              <div className="py-8 text-center">
                <RiInformationLine className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                <p className="text-muted-foreground">
                  No specific attributes configured for this entity type yet.
                </p>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-8">
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">What stood out?</h3>
              <p className="text-muted-foreground text-sm">
                Tag your experience to help others quickly understand the key aspects
              </p>
            </div>

            <div className="space-y-6">
              {positiveTag.length > 0 && (
                <TagSelector
                  tags={positiveTag}
                  selectedTagIds={formData.selectedTagIds}
                  onTagToggle={handleTagToggle}
                  title="✨ Positives & Strengths"
                />
              )}

              {concernTags.length > 0 && (
                <TagSelector
                  tags={concernTags}
                  selectedTagIds={formData.selectedTagIds}
                  onTagToggle={handleTagToggle}
                  title="⚠️ Areas of Concern"
                />
              )}

              {tags.length === 0 && (
                <div className="py-8 text-center">
                  <RiHashtag className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                  <p className="text-muted-foreground">
                    No tags configured for this entity type yet.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <RiInformationLine className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Ready to submit?</p>
                  <p className="text-muted-foreground text-xs">
                    Your review will help others make informed decisions about this entity. All
                    reviews are moderated to ensure quality and accuracy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("mx-auto w-full max-w-2xl", className)}>
      <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-foreground text-lg font-semibold">
            {isEdit ? "Edit Your Review" : "Write a Review"}
          </h3>
          <Badge variant="secondary" className="text-xs">
            Step {currentStep} of {totalSteps}
          </Badge>
        </div>

        {renderStepper()}
        {renderStepContent()}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? onCancel : prevStep}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            <RiArrowLeftLine className="mr-2 h-4 w-4" />
            {currentStep === 1 ? "Cancel" : "Previous"}
          </Button>

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Next
              <RiArrowRightLine className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Submitting..."}
                </>
              ) : (
                <>
                  <RiCheckLine className="mr-2 h-4 w-4" />
                  {isEdit ? "Update Review" : "Submit Review"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
