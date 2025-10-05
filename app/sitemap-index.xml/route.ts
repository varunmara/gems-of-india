import { db } from "@/drizzle/db"
import { entityStatus, entity as entityTable } from "@/drizzle/db/schema"
import { count, eq } from "drizzle-orm"

const ENTITIES_PER_SITEMAP = 45000

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"

  // Get total entity count
  const result = await db
    .select({ count: count(entityTable.id) })
    .from(entityTable)
    .where(eq(entityTable.status, entityStatus.PUBLISHED))

  const totalEntities = result[0]?.count || 0
  const totalPages = Math.ceil(totalEntities / ENTITIES_PER_SITEMAP)

  // Create sitemap index with main sitemap + paginated entity sitemaps
  const sitemaps = [
    `${baseUrl}/sitemap.xml`, // Main sitemap with static pages + priority entities
  ]

  // Add paginated entity sitemaps only if we have entities that aren't in main sitemap
  if (totalEntities > 1000) {
    // Main sitemap includes 1000 entities
    for (let i = 1; i <= totalPages; i++) {
      sitemaps.push(`${baseUrl}/sitemap/${i}`)
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (sitemap) =>
      `  <sitemap>
    <loc>${sitemap}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`,
  )
  .join("\n")}
</sitemapindex>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  })
}
