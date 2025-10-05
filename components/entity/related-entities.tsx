"use client"

import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

import { RandomLogo } from "../shared/random-logo"

interface RelatedEntity {
  id: string
  name: string
  logoUrl?: string | null
  entityType: string
  slug: string
  city?: string | null
  state?: string | null
  relationType: string
}

interface RelatedEntitiesProps {
  entities: RelatedEntity[]
  className?: string
}

function getRelationTypeLabel(relationType: string): { label: string; color: string } {
  switch (relationType) {
    case "child":
      return { label: "Member", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" }
    case "sibling":
      return { label: "Related", color: "bg-green-500/10 text-green-600 dark:text-green-400" }
    case "location":
      return { label: "Nearby", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" }
    default:
      return { label: "Related", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" }
  }
}

export function RelatedEntities({ entities, className }: RelatedEntitiesProps) {
  if (!entities || entities.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-3", className)}>
      {entities.map((entity) => {
        const relationTypeInfo = getRelationTypeLabel(entity.relationType)

        return (
          <Link
            key={entity.id}
            href={`/${entity.slug}`}
            className="group hover:bg-muted/50 -mx-1 block rounded-lg p-3 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="border-border h-8 w-8 flex-shrink-0 overflow-hidden rounded border">
                {entity.logoUrl ? (
                  <Image
                    src={entity.logoUrl}
                    alt={`${entity.name} Logo`}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <RandomLogo name={entity.name} size={32} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h4 className="group-hover:text-primary text-foreground truncate text-sm font-medium transition-colors">
                    {entity.name}
                  </h4>
                  <span
                    className={cn(
                      "inline-flex flex-shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
                      relationTypeInfo.color,
                    )}
                  >
                    {relationTypeInfo.label}
                  </span>
                </div>

                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <span className="capitalize">{entity.entityType.replace("_", " ")}</span>
                  {(entity.city || entity.state) && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="truncate">
                        {entity.city && entity.state
                          ? `${entity.city}, ${entity.state}`
                          : entity.city || entity.state}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
