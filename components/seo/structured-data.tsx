interface StructuredDataProps {
  type: "Organization" | "Person" | "GovernmentOrganization" | "WebSite"
  data: {
    name: string
    description?: string
    url?: string
    location?: {
      city?: string
      state?: string
      country: string
    }
    rating?: {
      ratingValue: number
      reviewCount: number
    }
    // Additional fields for different schema types
    email?: string
    telephone?: string
    sameAs?: string[] // Social media URLs
    foundingDate?: string
    keywords?: string[]
  }
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const schemaType =
    type === "Person" && data.rating && data.rating.reviewCount > 0 ? "Organization" : type

  // Handle WebSite schema separately as it's not a profile page
  if (type === "WebSite") {
    const webSiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: data.name,
      description: data.description,
      url: data.url,
      inLanguage: ["en-IN", "hi"],
      audience: {
        "@type": "Audience",
        geographicArea: {
          "@type": "Country",
          name: "India",
        },
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${data.url}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    }
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
    )
  }

  const mainEntity: Record<string, unknown> = {
    "@type": schemaType,
    name: data.name,
    description: data.description,
    url: data.url,
  }

  // Add location information
  if (data.location) {
    mainEntity.address = {
      "@type": "PostalAddress",
      addressLocality: data.location.city,
      addressRegion: data.location.state,
      addressCountry: data.location.country,
    }
  }

  // Add rating information
  if (data.rating && data.rating.reviewCount > 0) {
    mainEntity.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: data.rating.ratingValue,
      reviewCount: data.rating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  // Add contact information
  if (data.email) {
    mainEntity.email = data.email
  }

  if (data.telephone) {
    mainEntity.telephone = data.telephone
  }

  // Add social media profiles
  if (data.sameAs && data.sameAs.length > 0) {
    mainEntity.sameAs = data.sameAs
  }

  // Add keywords for India-specific SEO
  if (data.keywords && data.keywords.length > 0) {
    mainEntity.keywords = data.keywords.join(", ")
  }

  // Type-specific enhancements
  if (schemaType === "GovernmentOrganization") {
    mainEntity["@type"] = ["Organization", "GovernmentOrganization"]
    // Add India-specific government context
    mainEntity.parentOrganization = {
      "@type": "GovernmentOrganization",
      name: "Government of India",
      url: "https://www.india.gov.in/",
    }
  }

  if (schemaType === "Person") {
    // Add professional context for Indian officials
    mainEntity.jobTitle = data.description
    mainEntity.worksFor = {
      "@type": "GovernmentOrganization",
      name: "Indian Government",
    }
  }

  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: mainEntity,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageSchema) }}
    />
  )
}

// Specific component for Indian Government Officials
export function IndianOfficialStructuredData({
  name,
  position,
  department,
  location,
  rating,
  url,
  email,
  socialProfiles = [],
}: {
  name: string
  position?: string
  department?: string
  location?: { city?: string; state?: string }
  rating?: { ratingValue: number; reviewCount: number }
  url?: string
  email?: string
  socialProfiles?: string[]
}) {
  return (
    <StructuredData
      type="Person"
      data={{
        name,
        description: position || "Government Official",
        url,
        email,
        location: location ? { ...location, country: "India" } : { country: "India" },
        rating,
        sameAs: socialProfiles,
        keywords: [
          "Indian government",
          "public service",
          "bureaucracy",
          "accountability",
          position || "official",
          department || "government",
          location?.state || "India",
        ].filter(Boolean),
      }}
    />
  )
}

// Website-level structured data for the homepage
export function WebsiteStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"

  return (
    <StructuredData
      type="WebSite"
      data={{
        name: "Gems of India",
        description:
          "India's premier platform to rate and review government officials, politicians, judges, and departments. Improve transparency and accountability in Indian governance.",
        url: baseUrl,
        keywords: [
          "India government officials",
          "rate politicians India",
          "government accountability",
          "Indian bureaucracy review",
          "political transparency",
          "babu rating",
          "judge review India",
          "government department feedback",
        ],
      }}
    />
  )
}
