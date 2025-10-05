"use client"

import Image from "next/image"
import Link from "next/link"

interface EntityPodiumItem {
  id: string
  name: string
  slug: string
  logoUrl: string
  dailyRanking: number | null
}

interface TopEntitiesPodiumProps {
  topEntities: EntityPodiumItem[]
}

export default function TopEntitiesPodium({ topEntities }: TopEntitiesPodiumProps) {
  if (!topEntities || topEntities.length === 0) {
    return <div className="text-muted-foreground py-4 text-center text-sm">No gems yesterday</div>
  }

  const sortedEntities = [...topEntities]
    .filter((entity) => entity.dailyRanking !== null)
    .sort((a, b) => (a.dailyRanking || 0) - (b.dailyRanking || 0))

  return (
    <div className="w-full">
      <div className="flex justify-evenly">
        {sortedEntities.map((entity) => (
          <Link
            key={entity.id}
            href={`/${entity.slug}`}
            className="group relative block"
            title={entity.name}
          >
            <div className="relative aspect-square h-12 w-12 sm:h-14 sm:w-14">
              <Image
                src={entity.logoUrl || "/placeholder.svg"}
                alt={entity.name}
                fill
                className="rounded-md object-cover transition-opacity group-hover:opacity-90"
              />
              <div
                className={`bg-primary text-primary-foreground absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#FDFDFD] dark:border-[#1D1D1D]`}
              >
                <span className="text-[10px] font-semibold">{entity.dailyRanking}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
