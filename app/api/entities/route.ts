import { NextRequest, NextResponse } from "next/server"

import { searchEntities } from "@/app/actions/entities"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const types = searchParams.getAll("type") || []

    if (!query.trim()) {
      return NextResponse.json([])
    }

    const entities = await searchEntities(query, types)
    return NextResponse.json(entities)
  } catch (error) {
    console.error("Error searching entities:", error)
    return NextResponse.json({ error: "Failed to search entities" }, { status: 500 })
  }
}
