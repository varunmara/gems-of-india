/* eslint-disable @next/next/no-img-element */
import { Metadata } from "next"
import Link from "next/link"

import { Building, Star } from "lucide-react"

// I've added Building and Star icons, which are more appropriate for a directory.
import { RandomLogo } from "@/components/shared/random-logo"

// --- MOCK DATABASE LOGIC ---
// This section simulates fetching rated entities from your database.
// You will need to replace this with your actual Drizzle query.
// Your query should join your 'departments' table with your 'reviews' table
// to calculate the average rating and review count for each department.

// This is the data structure you should aim for from your database query
type RatedEntity = {
  id: string
  slug: string
  name: string
  description: string
  category: string
  image: string | null
  averageRating: number
  reviewCount: number
}

async function getRatedEntities(): Promise<RatedEntity[]> {
  // In a real app, this would be your `db.query...`
  // For now, here is some mock data to build the UI.
  const mockData: RatedEntity[] = [
    {
      id: "1",
      slug: "ministry-of-finance",
      name: "Ministry of Finance",
      description:
        "Oversees taxation, financial legislation, financial institutions, capital markets, central and state finances, and the Union Budget.",
      category: "Central Ministry",
      image: null, // Example image path
      averageRating: 4.2,
      reviewCount: 184,
    },
    {
      id: "2",
      slug: "indian-railways",
      name: "Indian Railways",
      description:
        "The national railway system of India, operating one of the largest and busiest rail networks in the world.",
      category: "Public Infrastructure",
      image: null,
      averageRating: 3.8,
      reviewCount: 2056,
    },
    {
      id: "3",
      slug: "delhi-police",
      name: "Delhi Police",
      description:
        "The law enforcement agency for the National Capital Territory of Delhi (NCT). It does not have jurisdiction over the adjoining areas of the NCR.",
      category: "State Department",
      image: null,
      averageRating: 2.9,
      reviewCount: 542,
    },
  ]

  // Return an empty array to test the "empty state" UI
  // return [];

  return mockData
}
// --- END MOCK DATABASE LOGIC ---

export const metadata: Metadata = {
  title: "Explore Government Departments & Officials | Gems Of India",
  description:
    "Browse and discover user-submitted ratings and reviews for government departments, public officials, and infrastructure across India.",
  keywords:
    "government ratings, public official reviews, ministry ratings, government transparency, public services India",
  authors: [{ name: "Gems of India Community" }],
  openGraph: {
    title: "Explore Government Departments & Officials | Gems Of India",
    description:
      "Browse and discover user-submitted ratings and reviews for government departments, public officials, and infrastructure across India.",
    type: "website",
    url: "/departments", // Changed URL to be more descriptive
    siteName: "Gems of India",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Government Departments & Officials | Gems Of India",
    description:
      "Browse and discover user-submitted ratings and reviews for government departments, public officials, and infrastructure across India.",
  },
}

export default async function ExplorePage() {
  const entities = await getRatedEntities()

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-foreground mb-4 text-2xl font-bold md:text-3xl">
            Explore Public Services
          </h1>
          <p className="text-muted-foreground text-md mx-auto max-w-4xl md:text-lg">
            Discover and contribute to ratings of government departments, officials, and public
            infrastructure. Help build a more transparent and accountable India.
          </p>
        </div>

        {/* Categories Section */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/departments" // Assuming this is the main page
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              All
            </Link>
            <Link
              href="/departments?category=central-ministry"
              className="bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              Central Ministries
            </Link>
            <Link
              href="/departments?category=state-department"
              className="bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              State Departments
            </Link>
          </div>
        </div>

        {/* Entities Grid */}
        {entities.length === 0 ? (
          <div className="py-16 text-center">
            <div className="bg-card mx-auto max-w-md rounded-2xl border p-12">
              <div className="text-muted-foreground mb-4">
                <Building className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-card-foreground mb-2 text-lg font-semibold">
                No Departments Found
              </h3>
              <p className="text-muted-foreground">
                Be the first to rate a government department or official and contribute to public
                transparency.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {entities.map((entity) => (
              <article key={entity.id} className="group">
                <Link
                  href={`/${entity.slug}`} // Link to the entity's detail page
                  className="bg-card hover:border-muted-foreground/20 flex h-full flex-col overflow-hidden rounded-2xl border"
                >
                  {/* Entity Image */}
                  <div className="bg-muted relative aspect-[16/9] overflow-hidden">
                    {entity.image ? (
                      <img
                        src={entity.image}
                        alt={entity.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="text-muted-foreground/30 text-5xl font-bold">
                          <RandomLogo name={entity.name} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Entity Content */}
                  <div className="flex flex-1 flex-col px-6 py-4">
                    {/* Category Badge */}
                    <div className="mb-3">
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                        {entity.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-card-foreground group-hover:text-primary mb-2 line-clamp-2 text-xl font-bold transition-colors">
                      {entity.name}
                    </h2>

                    {/* Description */}
                    <p className="text-muted-foreground line-clamp-3 flex-1 text-sm">
                      {entity.description}
                    </p>

                    {/* Rating Information */}
                    <div className="text-muted-foreground mt-4 flex items-center gap-1.5 text-sm">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-foreground font-bold">
                        {entity.averageRating.toFixed(1)}
                      </span>
                      <span>({entity.reviewCount} reviews)</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
