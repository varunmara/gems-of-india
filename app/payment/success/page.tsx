"use client"

import { Suspense } from "react"

function PaymentSuccessContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-100 p-3">
            <svg
              className="h-full w-full text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold">Payment System Temporarily Disabled</h1>
        <p className="mb-6 text-gray-600">
          Stripe integration is currently disabled. Please contact support for assistance.
        </p>

        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <p>This page would normally show payment confirmation details.</p>
        </div>
      </div>
    </div>
  )
}

function PaymentSuccessLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        </div>
        <h1 className="mb-3 text-2xl font-bold">Loading...</h1>
        <p className="text-gray-600">Please wait while we prepare your payment information...</p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
