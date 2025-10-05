/* eslint-disable @next/next/no-img-element */
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

// Added new icons for the ratings UI
import { ArrowLeft, Star } from "lucide-react"

import { Button } from "@/components/ui/button"

// --- MOCK DATABASE LOGIC & TYPES ---
// This section simulates fetching a department and all its user reviews.
// You will need to replace this with your actual Drizzle query.

type UserReview = {
  id: string
  rating: number // 1 to 5
  comment: string
  author: string
  createdAt: Date
}

type EntityDetails = {
  id: string
  slug: string
  name: string
  description: string
  category: string
  image: string | null
}

type PageData = {
  entity: EntityDetails
  reviews: UserReview[]
  stats: {
    averageRating: number
    reviewCount: number
    ratingDistribution: { rating: number; count: number }[]
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getEntityDetails(slug: string): Promise<PageData | null> {
  // 1. Fetch the entity (e.g., department) by slug
  const entity: EntityDetails | undefined = {
    id: "1",
    slug: "ministry-of-finance",
    name: "Ministry of Finance",
    description:
      "The Ministry of Finance is a ministry within the Government of India concerned with the economy of India, serving as the Indian Treasury Department. In particular, it concerns itself with taxation, financial legislation, financial institutions, capital markets, centre and state finances, and the Union Budget.",
    category: "Central Ministry",
    image: "/images/ministry-of-finance.jpg",
  }

  if (!entity) return null

  // 2. Fetch all reviews for this entity
  const reviews: UserReview[] = [
    {
      id: "r1",
      rating: 5,
      comment:
        "Very efficient and transparent process for my tax filings this year. The new portal is a huge improvement!",
      author: "Anjali P.",
      createdAt: new Date("2025-07-22T10:00:00Z"),
    },
    {
      id: "r2",
      rating: 3,
      comment:
        "It's a mixed bag. While some services are better, getting a response from customer support for GST issues is still very slow.",
      author: "Rajiv S.",
      createdAt: new Date("2025-07-15T14:30:00Z"),
    },
    {
      id: "r3",
      rating: 4,
      comment:
        "The faceless assessment scheme is a great initiative towards reducing corruption. Had a good experience with it.",
      author: "Priya K.",
      createdAt: new Date("2025-06-30T09:00:00Z"),
    },
    {
      id: "r4",
      rating: 1,
      comment: "Website was down for two days before the deadline. Unacceptable.",
      author: "Amit V.",
      createdAt: new Date("2025-06-28T18:00:00Z"),
    },
  ]

  // 3. Calculate stats (in a real app, you might do this with a more complex SQL query)
  const reviewCount = reviews.length
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews.filter((rev) => rev.rating === r).length,
  }))

  return {
    entity,
    reviews,
    stats: { reviewCount, averageRating, ratingDistribution },
  }
}

// --- END MOCK DATABASE LOGIC ---

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getEntityDetails(slug)

  if (!data) {
    return {
      title: "Department not found | Gems Of India",
    }
  }

  const { entity } = data
  const title = `${entity.name} Reviews & Ratings | Gems Of India`
  const description = `See user-submitted reviews and ratings for the ${entity.name}. Is it effective? Share your experience on Gems Of India.`

  return {
    title,
    description,
    keywords: `${entity.name}, government review, public service rating, ${entity.category}`,
    authors: [{ name: "Gems of India Community" }],
    openGraph: { title, description, siteName: "Gems Of India" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/departments/${entity.slug}` },
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

const StarRating = ({ rating, className = "" }: { rating: number; className?: string }) => (
  <div className={`flex items-center gap-0.5 ${className}`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-5 w-5 ${rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))}
  </div>
)

export default async function EntityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getEntityDetails(slug)

  if (!data) {
    notFound()
  }

  const { entity, reviews, stats } = data

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-4">
          <Link
            href="/departments"
            className="text-muted-foreground hover:text-foreground inline-flex items-center transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Departments
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Entity Header */}
            <header className="mb-8 flex flex-col gap-4 border-b pb-8">
              {entity.image && (
                <div className="bg-muted aspect-[16/9] w-full overflow-hidden rounded-lg">
                  <img
                    src={entity.image}
                    alt={entity.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <span className="bg-primary/10 text-primary mb-2 inline-block rounded-full px-3 py-1 text-sm font-medium">
                  {entity.category}
                </span>
                <h1 className="text-3xl font-bold md:text-4xl">{entity.name}</h1>
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={stats.averageRating} />
                  <span className="text-muted-foreground">
                    {stats.averageRating.toFixed(1)} out of 5
                  </span>
                  <span className="text-muted-foreground">• {stats.reviewCount} reviews</span>
                </div>
              </div>
            </header>

            {/* About Section */}
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-semibold">About {entity.name}</h2>
              <p className="prose prose-neutral dark:prose-invert text-muted-foreground max-w-none">
                {entity.description}
              </p>
            </section>

            {/* User Reviews Section */}
            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">User Reviews ({reviews.length})</h2>
                <Button asChild>
                  <Link href={`/departments/${entity.slug}/submit-review`}>Write a Review</Link>
                </Button>
              </div>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-card rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <StarRating rating={review.rating} />
                      <span className="text-muted-foreground text-xs">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="text-foreground mb-3 text-sm">{review.comment}</p>
                    <p className="text-muted-foreground text-xs font-medium">- {review.author}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Rating Snapshot Card */}
              <div className="bg-card rounded-2xl border p-4">
                <h3 className="mb-4 text-lg font-semibold">Rating Snapshot</h3>
                <div className="mb-4 flex items-center gap-4">
                  <div className="text-5xl font-bold">{stats.averageRating.toFixed(1)}</div>
                  <div>
                    <StarRating rating={stats.averageRating} />
                    <div className="text-muted-foreground text-sm">
                      Based on {stats.reviewCount} reviews
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {stats.ratingDistribution.map(({ rating, count }) => {
                    const percentage = stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0
                    return (
                      <div key={rating} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground w-12">
                          {rating} star{rating > 1 && "s"}
                        </span>
                        <div className="bg-muted h-2 flex-1 rounded-full">
                          <div
                            className="h-2 rounded-full bg-yellow-400"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-muted-foreground w-8 text-right">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    )
                  })}
                </div>
                <Button className="mt-6 w-full" asChild>
                  <Link href={`/departments/${entity.slug}/submit-review`}>Write a Review</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
