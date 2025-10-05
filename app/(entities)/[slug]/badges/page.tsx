import { Metadata } from "next"
import { headers } from "next/headers"
import Link from "next/link"
import { notFound } from "next/navigation"

import { RiArrowLeftLine } from "@remixicon/react"

import { auth } from "@/lib/auth"
import { getEntityBySlug } from "@/app/actions/entity-details"

import { BadgesDisplay } from "../../../../components/badges/BadgesDisplay"

interface BadgesPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BadgesPageProps): Promise<Metadata> {
  const { slug } = await params
  const entityData = await getEntityBySlug(slug)

  if (!entityData) {
    return {
      title: "Entity Not Found",
    }
  }

  return {
    title: `${entityData.name} - Badges | Gems of India`,
    description: "Get your Gems of India achievement badges",
  }
}

export default async function BadgesPage({ params }: BadgesPageProps) {
  const { slug } = await params
  const entityData = await getEntityBySlug(slug)

  if (!entityData) {
    notFound()
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const isOwner = session?.user?.id === entityData.createdBy

  if (!isOwner || !entityData.dailyRanking || entityData.dailyRanking > 3) {
    notFound()
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center">
      <div className="w-full max-w-4xl px-2 py-6 sm:px-4 sm:py-10">
        <div className="mb-6">
          <Link
            href={`/${entityData.slug}`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <RiArrowLeftLine className="h-4 w-4" />
            Back to gem
          </Link>
        </div>

        <div className="bg-card flex flex-col gap-6 rounded-lg border p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg font-bold sm:text-2xl">Your Achievement Badges</h1>
          </div>

          <p className="text-muted-foreground text-sm sm:text-base">
            Congratulations on making it to the top {entityData.dailyRanking}! Display this badge on
            your website to showcase your achievement.
          </p>

          <BadgesDisplay dailyRanking={entityData.dailyRanking} slug={entityData.slug} />
        </div>
      </div>
    </div>
  )
}
