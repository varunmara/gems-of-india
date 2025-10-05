import { NextResponse } from "next/server"

export async function POST() {
  // Stripe integration temporarily disabled
  return NextResponse.json(
    {
      message: "Stripe integration temporarily disabled",
      status: "disabled",
    },
    { status: 200 },
  )
}
