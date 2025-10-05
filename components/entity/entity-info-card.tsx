"use client"

import Link from "next/link"

import {
  RiGlobalLine,
  RiMapPinLine,
  RiPhoneLine,
  RiTwitterFill,
  RiVerifiedBadgeFill,
} from "@remixicon/react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StarRating } from "@/components/ui/star-rating"

interface EntityInfoCardProps {
  entity: {
    id: string
    name: string
    description?: string | null
    entityType: string
    logoUrl?: string | null
    websiteUrl?: string | null
    facebookUrl?: string | null
    twitterUrl?: string | null
    phoneNumber?: string | null
    email?: string | null
    streetAddress?: string | null
    city?: string | null
    state?: string | null
    zipCode?: string | null
    keywords?: string[] | null
    netWorth?: string | null
    verifiedAt?: Date | null
    createdAt?: Date | null
    upvoteCount: number
    categories: Array<{ id: string; name: string }>
    parentEntities?: Array<{
      id: string
      slug: string
      name: string
      logoUrl?: string | null
      entityType: string
      relationshipType: string
    }>
  }
  reviewStats?: {
    totalReviews: number
    avgRating: number
  }
  className?: string
}

export function EntityInfoCard({ entity, reviewStats, className }: EntityInfoCardProps) {
  // Extract metadata information
  const netWorth = entity.netWorth

  // Create location string
  const location = [entity.city, entity.state].filter(Boolean).join(", ")

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("")
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Main Content */}
        <div className="p-6">
          {/* Entity Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="border-muted h-20 w-20 border-2 sm:h-24 sm:w-24">
                <AvatarImage src={entity.logoUrl || undefined} alt={entity.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white sm:text-xl">
                  {getInitials(entity.name)}
                </AvatarFallback>
              </Avatar>
              {entity.verifiedAt && (
                <div className="absolute -right-1 -bottom-1 rounded-full bg-blue-500 p-1">
                  <RiVerifiedBadgeFill className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            {/* Entity Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-foreground text-xl font-bold sm:text-2xl">{entity.name}</h1>
                </div>

                {/* Rating, Reviews, Upvotes & Net Worth */}
                <div className="flex flex-col gap-1">
                  {/* Rating & Reviews */}
                  {reviewStats && reviewStats.totalReviews > 0 && (
                    <div className="flex items-center gap-2">
                      <StarRating rating={reviewStats.avgRating} size="sm" />
                      <span className="text-sm font-medium">{reviewStats.avgRating}</span>
                      <span className="text-muted-foreground text-sm">
                        ({reviewStats.totalReviews} review
                        {reviewStats.totalReviews !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}

                  {/* Net Worth */}
                  {netWorth && (
                    <div className="text-muted-foreground text-sm">
                      Net Worth:{" "}
                      <span className="font-semibold text-emerald-600">{netWorth} crores</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Entity Type & Party Affiliation */}
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "px-1.5 py-0.5 text-xs",
                    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                  )}
                >
                  {entity.entityType}
                </Badge>
                {entity.verifiedAt && (
                  <Badge variant="default" className="gap-1">
                    <RiVerifiedBadgeFill className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>

              <Separator className="mb-3" />

              {/* Description */}
              {entity.description && (
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {entity.description}
                </p>
              )}

              {/* Parent Entities - Member Of */}
              {entity.parentEntities && entity.parentEntities.length > 0 && (
                <div className="mb-4 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Member of:</span>
                  <div className="flex items-center gap-3">
                    {entity.parentEntities.map((parent, index) => (
                      <div key={parent.id} className="flex items-center gap-1">
                        <Link
                          href={`/${parent.slug}`}
                          className="transition-opacity hover:opacity-80"
                        >
                          <Badge
                            variant="secondary"
                            className={cn(
                              "px-1.5 py-0.5 text-xs",
                              "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                            )}
                          >
                            {parent.name}
                          </Badge>
                        </Link>

                        {index < (entity.parentEntities?.length || 0) - 1 && (
                          <span className="text-muted-foreground mx-1">•</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="mb-3" />

          {/* Contact & Location Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-foreground text-sm font-semibold">Contact Information</h3>

              {entity.phoneNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <RiPhoneLine className="text-muted-foreground h-4 w-4" />
                  <span>{entity.phoneNumber}</span>
                </div>
              )}

              {entity.email && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">@</span>
                  <span>{entity.email}</span>
                </div>
              )}

              {location && (
                <div className="flex items-center gap-2 text-sm">
                  <RiMapPinLine className="text-muted-foreground h-4 w-4" />
                  <span>{location}</span>
                  {entity.zipCode && (
                    <span className="text-muted-foreground">({entity.zipCode})</span>
                  )}
                </div>
              )}

              {entity.streetAddress && (
                <div className="text-muted-foreground text-sm">{entity.streetAddress}</div>
              )}
            </div>

            {/* Additional Information */}
            <div className="space-y-3">
              <h3 className="text-foreground text-sm font-semibold">Additional Information</h3>

              {entity.keywords && entity.keywords.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">Specialties</p>
                  <div className="flex flex-wrap gap-1">
                    {entity.keywords.slice(0, 6).map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Links & Actions */}
          <Separator className="my-6" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Social Links */}
            <div className="flex items-center gap-2">
              {entity.websiteUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={entity.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <RiGlobalLine className="h-4 w-4" />
                    Website
                  </a>
                </Button>
              )}

              {entity.twitterUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={entity.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <RiTwitterFill className="h-4 w-4" />
                    Twitter
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
