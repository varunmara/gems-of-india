"use client"

import { ReviewTag } from "@/drizzle/db/schema"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface TagWithCount extends ReviewTag {
  count: number
  percentage: number
}

interface ProsConsTagsProps {
  tags: TagWithCount[]
  totalReviews: number
  className?: string
}

export function ProsConsTags({ tags, totalReviews, className }: ProsConsTagsProps) {
  const positiveTags = tags
    .filter((tag) => tag.tagType === "positive")
    .sort((a, b) => b.count - a.count)
  const concernTags = tags
    .filter((tag) => tag.tagType === "concern")
    .sort((a, b) => b.count - a.count)

  if (tags.length === 0) {
    return null
  }

  const renderTagSection = (sectionTags: TagWithCount[], title: string, icon: string) => {
    if (sectionTags.length === 0) return null

    return (
      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h4 className="text-foreground font-medium">{title}</h4>
          <Badge variant="outline" className="text-xs">
            {sectionTags.reduce((sum, tag) => sum + tag.count, 0)} mentions
          </Badge>
        </div>

        <div className="space-y-2">
          {sectionTags.slice(0, 8).map((tag) => (
            <div
              key={tag.id}
              className="bg-background border-border/50 hover:border-border flex items-center justify-between rounded-md border p-2 transition-colors"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs whitespace-nowrap",
                    tag.tagType === "positive"
                      ? "border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                      : "border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
                  )}
                >
                  {tag.label}
                </Badge>
                <span className="text-muted-foreground text-sm font-medium">
                  {Math.round(tag.percentage)}%
                </span>
              </div>

              <div className="ml-2 flex items-center gap-2">
                <div
                  className={cn(
                    "h-1.5 rounded-full",
                    tag.tagType === "positive" ? "bg-green-400" : "bg-red-400",
                  )}
                  style={{
                    width: `${Math.max(tag.percentage * 0.8, 8)}px`,
                    minWidth: "8px",
                    maxWidth: "60px",
                  }}
                />
                <span className="text-muted-foreground w-6 min-w-0 text-right font-mono text-xs">
                  {tag.count}
                </span>
              </div>
            </div>
          ))}

          {sectionTags.length > 8 && (
            <p className="text-muted-foreground border-t pt-2 text-center text-xs">
              +{sectionTags.length - 8} more mentioned
            </p>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">What People Are Saying</h3>
        <p className="text-muted-foreground text-sm">
          Most mentioned aspects from {totalReviews} review{totalReviews !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {renderTagSection(positiveTags, "Positives & Strengths", "✨")}
        {renderTagSection(concernTags, "Areas of Concern", "⚠️")}
      </div>

      {positiveTags.length === 0 && concernTags.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No specific feedback tags available yet. Be the first to share detailed feedback!
          </p>
        </Card>
      )}
    </div>
  )
}
