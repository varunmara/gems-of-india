"use client"

import { ReviewTag } from "@/drizzle/db/schema"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TagSelectorProps {
  tags: ReviewTag[]
  selectedTagIds: string[]
  onTagToggle: (tagId: string) => void
  title: string
  className?: string
}

export function TagSelector({
  tags,
  selectedTagIds,
  onTagToggle,
  title,
  className,
}: TagSelectorProps) {
  if (tags.length === 0) return null

  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="text-foreground text-sm font-medium">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id)
          return (
            <Button
              key={tag.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onTagToggle(tag.id)}
              className={cn(
                "h-8 text-xs transition-all duration-200",
                isSelected ? "shadow-sm" : "hover:border-primary/50 hover:bg-primary/5",
              )}
              style={
                isSelected && tag.color
                  ? {
                      backgroundColor: tag.color,
                      borderColor: tag.color,
                      color: "white",
                    }
                  : undefined
              }
            >
              {tag.label}
            </Button>
          )
        })}
      </div>
      <p className="text-muted-foreground text-xs">
        Select all that apply • {selectedTagIds.length} selected
      </p>
    </div>
  )
}
