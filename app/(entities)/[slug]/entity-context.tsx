"use client"

import { createContext, useContext } from "react"

import { Entity, User } from "@/drizzle/db/schema"

interface EntityContextType {
  entity: Entity & {
    creator: User | null
    categories: Array<{ id: string; name: string }>
    reviewStats: {
      avgRating: number
      totalReviews: number
    } | null
    keywords: string[]
  }
  session: {
    user?: {
      id: string
      role: string
    }
  } | null
}

const EntityContext = createContext<EntityContextType | null>(null)

export function EntityProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: EntityContextType
}) {
  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>
}

export function useEntity() {
  const context = useContext(EntityContext)
  if (!context) {
    throw new Error("useEntity must be used within EntityProvider")
  }
  return context
}
