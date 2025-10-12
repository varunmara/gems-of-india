"use server"

import { db } from "@/drizzle/db"
import { entityRelationship, entity as entityTable, moderatorScope } from "@/drizzle/db/schema"
import { and, eq } from "drizzle-orm"

export type ModeratorScopeData = {
  scopeType: "all" | "state" | "city" | "entity"
  entityId?: string
  state?: string
  city?: string
}

/**
 * Get moderator's scope from database
 */
export async function getModeratorScope(userId: string) {
  const scopes = await db
    .select()
    .from(moderatorScope)
    .where(eq(moderatorScope.moderatorId, userId))
    .limit(1)

  return scopes[0] || null
}

/**
 * Check if a moderator can edit a specific entity
 * Returns true if moderator has permission, false otherwise
 */
export async function canModerateEntity(userId: string, entityId: string): Promise<boolean> {
  // Get moderator's scope
  const scope = await getModeratorScope(userId)

  // If no scope defined, moderator cannot edit anything
  if (!scope) {
    return false
  }

  // If scope is 'all', moderator can edit any entity
  if (scope.scopeType === "all") {
    return true
  }

  // Get the entity to check against scope
  const [targetEntity] = await db
    .select({
      id: entityTable.id,
      state: entityTable.state,
      city: entityTable.city,
    })
    .from(entityTable)
    .where(eq(entityTable.id, entityId))
    .limit(1)

  if (!targetEntity) {
    return false
  }

  // Check based on scope type
  switch (scope.scopeType) {
    case "entity": {
      const scopedEntityId = scope.entityId
      if (!scopedEntityId) {
        return false
      }

      // Can edit the specific entity OR any of its children
      if (scopedEntityId === entityId) {
        return true
      }

      // Check if this entity is a child of the scoped entity
      const [childRelation] = await db
        .select()
        .from(entityRelationship)
        .where(
          and(
            eq(entityRelationship.parentEntityId, scopedEntityId),
            eq(entityRelationship.childEntityId, entityId),
          ),
        )
        .limit(1)

      return !!childRelation
    }

    case "state":
      // Can edit any entity in the specified state
      return scope.state === targetEntity.state

    case "city":
      // Can edit any entity in the specified city
      return scope.city === targetEntity.city && scope.state === targetEntity.state

    default:
      return false
  }
}

/**
 * Get a human-readable description of the moderator's scope
 */
export async function getModeratorScopeDescription(userId: string): Promise<string | null> {
  const scope = await getModeratorScope(userId)

  if (!scope) {
    return null
  }

  switch (scope.scopeType) {
    case "all":
      return "All entities"

    case "state":
      return `State: ${scope.state}`

    case "city":
      return `City: ${scope.city}, ${scope.state}`

    case "entity":
      if (scope.entityId) {
        // Fetch entity name for display
        const [entity] = await db
          .select({ name: entityTable.name })
          .from(entityTable)
          .where(eq(entityTable.id, scope.entityId))
          .limit(1)

        return entity ? `Entity: ${entity.name} (+ children)` : "Entity: Unknown"
      }
      return "Entity: Not set"

    default:
      return null
  }
}
