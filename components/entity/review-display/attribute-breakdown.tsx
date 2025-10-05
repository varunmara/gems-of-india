"use client"

import { EntityType, ReviewAttribute, ReviewAttributeResponse } from "@/drizzle/db/schema"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface AttributeBreakdownProps {
  entityType: EntityType
  attributes: (ReviewAttribute & {
    responses: ReviewAttributeResponse[]
    averageScore?: number
    positivePercentage?: number
  })[]
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AttributeBreakdown({ entityType, attributes, className }: AttributeBreakdownProps) {
  if (attributes.length === 0) {
    return null
  }

  // Group attributes by category
  const attributesByCategory = attributes.reduce(
    (acc, attr) => {
      if (!acc[attr.category]) {
        acc[attr.category] = []
      }
      acc[attr.category].push(attr)
      return acc
    },
    {} as Record<string, typeof attributes>,
  )

  const renderAttributeStats = (attribute: (typeof attributes)[0]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata = (attribute.metadata as any) || {}

    if (attribute.attributeType === "scale") {
      const avgScore = attribute.averageScore || 0
      const maxScore = metadata.max || 10
      const percentage = (avgScore / maxScore) * 100

      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{avgScore.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">/{maxScore}</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-muted-foreground text-xs">
            Based on {attribute.responses.length} review
            {attribute.responses.length !== 1 ? "s" : ""}
          </p>
        </div>
      )
    } else if (attribute.attributeType === "boolean") {
      const positivePercentage = attribute.positivePercentage || 0
      const totalResponses = attribute.responses.length

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{Math.round(positivePercentage)}%</span>
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                positivePercentage >= 70
                  ? "bg-green-500"
                  : positivePercentage >= 40
                    ? "bg-yellow-500"
                    : "bg-red-500",
              )}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {Math.round(positivePercentage)}% positive responses
          </p>
          <p className="text-muted-foreground text-xs">
            {totalResponses} review{totalResponses !== 1 ? "s" : ""}
          </p>
        </div>
      )
    }

    return null
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      transparency: "🔍",
      integrity: "🛡️",
      accessibility: "🚪",
      service_delivery: "⚡",
      competence: "🎯",
      maintenance: "🔧",
      safety: "🛡️",
      performance: "📊",
      engagement: "🤝",
    }
    return icons[category] || "📋"
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      transparency:
        "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
      integrity:
        "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300",
      accessibility:
        "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300",
      service_delivery:
        "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300",
      competence:
        "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300",
      maintenance:
        "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300",
      safety:
        "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300",
      performance:
        "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-300",
      engagement:
        "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-300",
    }
    return (
      colors[category] ||
      "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-300"
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Performance Breakdown</h3>
        <p className="text-muted-foreground text-sm">Detailed feedback across different aspects</p>
      </div>

      <div className="space-y-6">
        {Object.entries(attributesByCategory).map(([category, categoryAttrs]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCategoryIcon(category)}</span>
              <h4 className="text-foreground font-medium capitalize">
                {category.replace("_", " ")}
              </h4>
              <Badge variant="outline" className="text-xs">
                {categoryAttrs.length} metric{categoryAttrs.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryAttrs.map((attr) => (
                <Card
                  key={attr.id}
                  className={cn(
                    "p-4 transition-all duration-200 hover:shadow-md",
                    getCategoryColor(attr.category),
                  )}
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h5 className="text-sm leading-tight font-medium">{attr.label}</h5>
                      {attr.description && (
                        <p className="text-xs leading-tight opacity-75">{attr.description}</p>
                      )}
                    </div>

                    {renderAttributeStats(attr)}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
