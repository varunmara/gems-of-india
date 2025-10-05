import { db } from "@/drizzle/db"
import { entityStatus, entity as entityTable } from "@/drizzle/db/schema"
import { eq } from "drizzle-orm"

// Get recent/priority entities for main sitemap (limited)
async function getPriorityEntities() {
  try {
    const entities = await db
      .select({
        slug: entityTable.slug,
        updatedAt: entityTable.updatedAt,
      })
      .from(entityTable)
      .where(eq(entityTable.status, entityStatus.PUBLISHED))
      .orderBy(entityTable.updatedAt)
      .limit(1000) // Limit to most recent/important entities

    return entities
  } catch {
    console.warn("Database not available, returning empty entities for sitemap")
    return []
  }
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"

  // Static pages (high priority)
  const staticRoutes = [
    "",
    "/trending",
    "/categories",
    "/submit",
    "/reviews",
    "/blog",
    "/legal",
    "/legal/terms",
    "/legal/privacy",
  ]

  // Get entities
  const entities = await getPriorityEntities()

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes
  .map((route) => {
    const changeFreq = route === "" ? "daily" : "weekly"
    const priority = route === "" ? 1.0 : 0.8
    return `  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  })
  .join("\n")}
${entities
  .map(
    (entity) =>
      `  <url>
    <loc>${baseUrl}/${entity.slug}</loc>
    <lastmod>${entity.updatedAt?.toISOString() || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}
