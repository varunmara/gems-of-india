import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/settings", "/dashboard", "/payment/*", "/(auth)/*"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
