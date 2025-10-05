import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import { entity as entityTable } from "@/drizzle/db/schema"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: Promise<{ entityId: string }> }) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const entityId = (await params).entityId

    // Get the entity
    const [entityData] = await db
      .select({
        id: entityTable.id,
        slug: entityTable.slug,
        status: entityTable.status,
        createdBy: entityTable.createdBy,
      })
      .from(entityTable)
      .where(eq(entityTable.id, entityId))

    if (!entityData) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 })
    }

    // Verify that the user is the owner of the entity
    if (entityData.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      id: entityData.id,
      slug: entityData.slug,
      status: entityData.status,
    })
  } catch (error) {
    console.error("Error fetching entity status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
