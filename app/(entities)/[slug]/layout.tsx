/* eslint-disable @next/next/no-img-element */
import { Metadata, ResolvingMetadata } from "next"
import { headers } from "next/headers"
import Image from "next/image"
import { notFound } from "next/navigation"

import {
  RiExternalLinkLine,
  RiFacebookFill,
  RiGlobalLine,
  RiMailFill,
  RiMapPinLine,
  RiTwitterFill,
} from "@remixicon/react"

import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { RelatedEntities } from "@/components/entity/related-entities"
import { ShareButton } from "@/components/entity/share-button"
import { TabNav } from "@/components/entity/tab-nav"
import { UpvoteButton } from "@/components/entity/upvote-button"
import { IndianOfficialStructuredData, StructuredData } from "@/components/seo/structured-data"
import { RandomLogo } from "@/components/shared/random-logo"
import { getEntityBySlug, getRelatedEntities, hasUserUpvoted } from "@/app/actions/entity-details"

import { EntityProvider } from "./entity-context"

// Types
interface EntityPageProps {
  children: React.ReactNode
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata(
  { params }: EntityPageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params
  const entityData = await getEntityBySlug(slug)

  if (!entityData) {
    return {
      title: "Entity Not Found",
    }
  }

  // Function to strip HTML tags from text
  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim()
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${entityData.name} | Gems Of India`,
    description: stripHtml(entityData.description || ""),
    openGraph: {
      title: `${entityData.name} on Gems Of India`,
      description: stripHtml(entityData.description || ""),
      images: [entityData.logoUrl || "", ...previousImages],
    },
    twitter: {
      card: "summary_large_image",
      title: `${entityData.name} on Gems Of India`,
      description: stripHtml(entityData.description || ""),
      images: [entityData.logoUrl || ""],
    },
  }
}

export default async function EntityPage({ params, children }: EntityPageProps) {
  const { slug } = await params
  const entityData = await getEntityBySlug(slug)

  if (!entityData) {
    notFound()
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const hasUpvoted = session?.user ? await hasUserUpvoted(entityData.id) : false

  // Get related entities
  const relatedEntities = await getRelatedEntities(entityData.id, {
    city: entityData.city,
    state: entityData.state,
  })

  const tabs = [
    { name: "Overview", href: `/${entityData.slug}` },
    ...(entityData.entityType !== "person"
      ? [
          { name: "Members", href: `/${entityData.slug}/members` },
          { name: "Infrastructure", href: `/${entityData.slug}/infrastructure` },
        ]
      : []),
    ...(entityData.entityType === "person"
      ? [{ name: "Assets", href: `/${entityData.slug}/assets` }]
      : []),
  ]

  // Prepare structured data based on entity type
  const structuredDataProps = {
    name: entityData.name,
    position:
      entityData.entityType === "person" &&
      entityData.roleAssignmentData &&
      entityData.roleAssignmentData.length > 0
        ? entityData.roleAssignmentData[0]?.title
        : undefined,
    department: entityData.entityType !== "person" ? entityData.name : undefined,
    location: {
      city: entityData.city || undefined,
      state: entityData.state || undefined,
    },
    rating: entityData.reviewStats
      ? {
          ratingValue: entityData.reviewStats.avgRating,
          reviewCount: entityData.reviewStats.totalReviews,
        }
      : undefined,
    url: `${process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"}/${entityData.slug}`,
    email: entityData.email || undefined,
    socialProfiles: [entityData.twitterUrl, entityData.facebookUrl, entityData.websiteUrl].filter(
      Boolean,
    ) as string[],
  }

  return (
    <>
      {entityData.entityType === "person" ? (
        <IndianOfficialStructuredData {...structuredDataProps} />
      ) : (
        <StructuredData
          type="GovernmentOrganization"
          data={{
            name: entityData.name,
            description: entityData.description || undefined,
            url: `${process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"}/${entityData.slug}`,
            location: {
              city: entityData.city || "",
              state: entityData.state || "",
              country: "India",
            },
            rating: entityData.reviewStats
              ? {
                  ratingValue: entityData.reviewStats.avgRating,
                  reviewCount: entityData.reviewStats.totalReviews,
                }
              : undefined,
            email: entityData.email || undefined,
            telephone: entityData.phoneNumber || undefined,
            sameAs: [entityData.twitterUrl, entityData.facebookUrl, entityData.websiteUrl].filter(
              Boolean,
            ) as string[],
            keywords: entityData.keywords || [],
          }}
        />
      )}
      <div className="bg-background min-h-screen">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content - 2 colonnes */}
            <div className="lg:col-span-2">
              {/* Modern Clean Header */}
              <div className="py-6">
                {/* Version Desktop */}
                <div className="hidden items-center justify-between md:flex">
                  {/* Left side: Logo + Title + Categories */}
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    {/* Logo */}
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-transparent">
                      {entityData.logoUrl ? (
                        <Image
                          src={entityData.logoUrl}
                          alt={`${entityData.name} Logo`}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                          priority
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <RandomLogo name={entityData.name} />
                        </div>
                      )}
                    </div>

                    {/* Title and info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h2 className="text-foreground truncate text-lg font-bold">
                          {entityData.name}
                        </h2>
                      </div>

                      {/* Job Title */}
                      {entityData.entityType === "person" &&
                        entityData.roleAssignmentData &&
                        entityData.roleAssignmentData.length > 0 && (
                          <div className="text-muted-foreground text-sm">
                            {entityData.roleAssignmentData[0]?.title}
                          </div>
                        )}

                      {/* Rating and Reviews */}
                      {entityData.reviewStats && (
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.round(entityData.reviewStats.avgRating)
                                    ? "fill-current text-yellow-500"
                                    : "fill-current text-gray-300"
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-foreground text-sm font-medium">
                            {entityData.reviewStats.avgRating.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {entityData.reviewStats.totalReviews} review
                            {entityData.reviewStats.totalReviews !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {/* Contact Info */}
                      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-sm">
                        {entityData.city && (
                          <div className="flex items-center gap-1">
                            <RiMapPinLine className="h-4 w-4" />
                            <span>
                              {[entityData.city, entityData.state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                        {entityData.email && (
                          <div className="flex items-center gap-1">
                            <RiMailFill className="h-4 w-4" />
                            <span>{entityData.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Actions */}
                  <div className="ml-6 flex items-center gap-3">
                    {entityData.websiteUrl && (
                      <Button variant="outline" size="sm" asChild className="h-9 px-3">
                        <a
                          href={entityData.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <RiGlobalLine className="h-4 w-4" />
                          Visit
                        </a>
                      </Button>
                    )}

                    <UpvoteButton
                      entityId={entityData.id}
                      upvoteCount={entityData.upvoteCount}
                      initialUpvoted={hasUpvoted}
                      isAuthenticated={Boolean(session?.user)}
                    />
                  </div>
                </div>

                {/* Version Mobile */}
                <div className="space-y-3 md:hidden">
                  {/* Logo + Titre */}
                  <div className="flex flex-col items-start gap-2">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-transparent">
                      {entityData.logoUrl ? (
                        <Image
                          src={entityData.logoUrl}
                          alt={`${entityData.name} Logo`}
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                          priority
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <RandomLogo name={entityData.name} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <h1 className="text-foreground text-xl font-bold">{entityData.name}</h1>
                      {entityData.entityType === "person" &&
                        entityData.roleAssignmentData &&
                        entityData.roleAssignmentData.length > 0 && (
                          <div className="text-muted-foreground text-sm">
                            {entityData.roleAssignmentData[0]?.title}
                          </div>
                        )}

                      {/* Rating and Reviews - Mobile */}
                      {entityData.reviewStats && (
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.round(entityData.reviewStats.avgRating)
                                    ? "fill-current text-yellow-500"
                                    : "fill-current text-gray-300"
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-foreground text-sm font-medium">
                            {entityData.reviewStats.avgRating.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {entityData.reviewStats.totalReviews} review
                            {entityData.reviewStats.totalReviews !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {/* Contact Info & Location - Twitter style horizontal layout */}
                      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                        {entityData.city && (
                          <div className="flex items-center gap-1">
                            <RiMapPinLine className="h-4 w-4" />
                            <span>
                              {[entityData.city, entityData.state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                        {entityData.email && (
                          <div className="flex items-center gap-1">
                            <RiMailFill className="h-4 w-4" />
                            <span>{entityData.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Twitter-style Actions */}
                  <div className="flex items-center gap-6 py-2">
                    {/* Upvote Button - Twitter style */}
                    <div className="flex items-center gap-2">
                      <UpvoteButton
                        entityId={entityData.id}
                        upvoteCount={entityData.upvoteCount}
                        initialUpvoted={hasUpvoted}
                        isAuthenticated={Boolean(session?.user)}
                      />
                    </div>

                    {/* Visit Website - Twitter style */}
                    {entityData.websiteUrl && (
                      <a
                        href={entityData.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
                      >
                        <RiExternalLinkLine className="h-5 w-5" />
                        <span className="text-sm font-medium">Visit</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <TabNav tabs={tabs} />

              {/* Tab Content */}
              <div className="pb-12">
                <EntityProvider
                  value={{
                    entity: { ...entityData, keywords: entityData.keywords || [] },
                    session: session?.user
                      ? { user: { id: session.user.id, role: session.user.role || "user" } }
                      : null,
                  }}
                >
                  {children}
                </EntityProvider>
              </div>
            </div>

            {/* Sidebar - 1 column on the entire height */}
            <div className="lg:sticky lg:top-14 lg:h-fit">
              <div className="space-y-6 py-6">
                {/* Achievement Badge */}
                {entityData.status === "published" &&
                  entityData.dailyRanking &&
                  entityData.dailyRanking <= 3 && (
                    <div className="space-y-3">
                      <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                        Achievement
                      </h3>
                      <div className="flex">
                        <img
                          src={`/images/badges/top${entityData.dailyRanking}-light.svg`}
                          alt={`Gems Of India Top ${entityData.dailyRanking} Daily Winner`}
                          className="h-12 w-auto dark:hidden"
                        />
                        <img
                          src={`/images/badges/top${entityData.dailyRanking}-dark.svg`}
                          alt={`Gems Of India Top ${entityData.dailyRanking} Daily Winner`}
                          className="hidden h-12 w-auto dark:block"
                        />
                      </div>
                    </div>
                  )}

                {/* Publisher */}
                <div className="space-y-3">
                  <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Publisher
                  </h3>
                  <div className="flex items-center gap-3">
                    {entityData.creator ? (
                      <>
                        {entityData.creator.image ? (
                          <img
                            src={entityData.creator.image}
                            alt={entityData.creator.name || "Creator avatar"}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                            {entityData.creator.name?.charAt(0) || "U"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground text-sm font-medium">
                            {entityData.creator.name}
                          </p>
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unknown creator</span>
                    )}
                  </div>
                </div>

                {/* City/State */}
                {(entityData.city || entityData.state) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                        Location
                      </span>
                      <div className="border-muted-foreground/30 mx-3 flex-1 border-b border-dotted"></div>
                      <span className="text-foreground text-sm font-medium">
                        {[entityData.city, entityData.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Net Worth */}
                {entityData.entityType === "person" && entityData.netWorth && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                        Net Worth
                      </span>
                      <div className="border-muted-foreground/30 mx-3 flex-1 border-b border-dotted"></div>
                      <span className="text-foreground text-sm font-medium">
                        {entityData.netWorth} crores
                      </span>
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(entityData.facebookUrl || entityData.twitterUrl) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                        Socials
                      </span>
                      <div className="border-muted-foreground/30 mx-3 flex-1 border-b border-dotted"></div>
                      <div className="flex items-center gap-2">
                        {entityData.facebookUrl && (
                          <a
                            href={entityData.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Facebook"
                          >
                            <RiFacebookFill className="h-4 w-4" />
                          </a>
                        )}
                        {entityData.twitterUrl && (
                          <a
                            href={entityData.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Twitter"
                          >
                            <RiTwitterFill className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Keywords */}
                {entityData.keywords && entityData.keywords.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {entityData.keywords.slice(0, 6).map((keyword) => (
                        <span
                          key={keyword}
                          className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-2 py-1 text-xs"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share */}
                <div className="border-border border-t pt-4">
                  <ShareButton name={entityData.name} slug={entityData.slug} variant="fullWidth" />
                </div>

                {/* Related Entities */}
                <div className="space-y-3">
                  <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Related
                  </h3>
                  <RelatedEntities entities={relatedEntities} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
