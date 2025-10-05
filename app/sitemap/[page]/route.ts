import { MetadataRoute } from "next"

import { db } from "@/drizzle/db"
import { entityStatus, entity as entityTable } from "@/drizzle/db/schema"
import { eq } from "drizzle-orm"

const ENTITIES_PER_SITEMAP = 45000 // Leave room for other URLs

export async function GET(
  request: Request,
  { params }: { params: Promise<{ page: string }> },
): Promise<Response> {
  const { page } = await params
  const pageNumber = parseInt(page)

  if (isNaN(pageNumber) || pageNumber < 1) {
    return new Response("Invalid page number", { status: 404 })
  }

  const offset = (pageNumber - 1) * ENTITIES_PER_SITEMAP

  const entities = await db
    .select({
      slug: entityTable.slug,
      updatedAt: entityTable.updatedAt,
    })
    .from(entityTable)
    .where(eq(entityTable.status, entityStatus.PUBLISHED))
    .orderBy(entityTable.createdAt) // Use createdAt for consistent pagination
    .limit(ENTITIES_PER_SITEMAP)
    .offset(offset)

  if (entities.length === 0) {
    return new Response("No entities found", { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"

  const sitemap: MetadataRoute.Sitemap = entities.map((entity) => ({
    url: `${baseUrl}/${entity.slug}`,
    lastModified: entity.updatedAt?.toISOString() || new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap
  .map(
    ({ url, lastModified, changeFrequency, priority }) =>
      `  <url>
    <loc>${url}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}
