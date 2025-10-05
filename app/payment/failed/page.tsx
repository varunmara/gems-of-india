"use client"

import { RiCloseLine } from "@remixicon/react"

export default function PaymentFailedPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 p-3">
            <RiCloseLine className="h-full w-full text-red-600" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">Payment System Temporarily Disabled</h1>
        <p className="mb-6 text-gray-600">
          Stripe integration is currently disabled. Please contact support for assistance.
        </p>

        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <p>This page would normally show payment failure details.</p>
        </div>
      </div>
    </div>
  )
}
