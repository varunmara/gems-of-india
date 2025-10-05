/* eslint-disable @next/next/no-img-element */
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/drizzle/db"
import { blogArticle } from "@/drizzle/db/schema"
import { eq } from "drizzle-orm"
// Added new icons for the new CTA card
import { ArrowLeft, Calendar, Clock, PenLine, ShieldCheck, Users } from "lucide-react"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import { TableOfContents } from "@/components/blog/table-of-contents"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await db.select().from(blogArticle).where(eq(blogArticle.slug, slug)).limit(1)

  if (!article[0]) {
    return {
      title: "Article not found | Gems Of India",
      description: "The article you're looking for doesn't exist or has been removed.",
    }
  }

  const { title, description, metaTitle, metaDescription } = article[0]

  return {
    title: metaTitle || `${title} | Gems Of India`,
    description: metaDescription || description,
    keywords:
      "government transparency, public accountability, Gems of India blog, civic tech, governance, data insights, news",
    authors: [{ name: article[0].author || "Gems Of India Team" }],
    category: "Governance",
    openGraph: {
      title: metaTitle || `${title} | Gems Of India`,
      description: metaDescription || description,
      type: "article",
      publishedTime: article[0].publishedAt.toISOString(),
      siteName: "Gems Of India",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle || `${title} | Gems Of India`,
      description: metaDescription || description,
      creator: "@GemsOfIndia_Org", // Placeholder for your Twitter handle
      site: "@GemsOfIndia_Org", // Placeholder for your Twitter handle
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return `${minutes} min read`
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await db.select().from(blogArticle).where(eq(blogArticle.slug, slug)).limit(1)

  if (!article[0]) {
    notFound()
  }

  const { title, description, content, publishedAt, tags } = article[0]
  const readingTime = calculateReadingTime(content)

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground inline-flex items-center transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News & Insights
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-10">
          {/* Main Content */}
          <div className="lg:col-span-7">
            <article>
              {/* Article Header */}
              <header className="mb-8">
                {/* Meta Information */}
                <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={publishedAt.toISOString()}>{formatDate(publishedAt)}</time>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{readingTime}</span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="mb-4 text-2xl font-bold md:text-4xl">{title}</h1>

                {/* Description */}
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">{description}</p>

                {/* Tags */}
                {tags && tags.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Hero Image */}
                {article[0].image && (
                  <div className="bg-muted mb-8 aspect-[16/9] overflow-hidden rounded-lg">
                    <img
                      src={article[0].image}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </header>

              {/* Article Content */}
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <MDXRemote
                  source={content}
                  options={{
                    mdxOptions: {
                      remarkPlugins: [remarkGfm],
                    },
                  }}
                />
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="sticky top-20 space-y-4">
              {/* Table of Contents */}
              <TableOfContents />

              {/* --- NEW COMMUNITY CTA CARD --- */}
              <div className="bg-card rounded-2xl border p-4">
                <div className="mb-4 text-center">
                  <h2 className="text-card-foreground text-base font-semibold">
                    Your Voice Matters
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    Help build a more transparent India by sharing your experience.
                  </p>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <PenLine className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span className="text-foreground text-xs font-medium">
                      Share your experience
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span className="text-foreground text-xs font-medium">
                      Promote accountability
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span className="text-foreground text-xs font-medium">
                      Inform your community
                    </span>
                  </div>
                </div>

                <Button size="sm" className="w-full" asChild>
                  <Link href="/departments">Rate a Department</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
