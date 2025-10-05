"use client"

import { useState } from "react"

import { EntityData } from "@/lib/schemas"

interface UseAutoFillOptions {
  onAutoFillComplete?: (data: EntityData) => void
  onError?: (error: string) => void
}

export function useAutoFill({ onAutoFillComplete, onError }: UseAutoFillOptions = {}) {
  const [isAutoFilling, setIsAutoFilling] = useState(false)
  const [autoFillError, setAutoFillError] = useState<string | null>(null)

  const triggerAutoFill = async (entityName: string, entityType?: string) => {
    if (!entityName.trim()) {
      setAutoFillError("Please enter an entity name")
      return
    }

    setIsAutoFilling(true)
    setAutoFillError(null)

    try {
      const response = await fetch("/api/ai-autofill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityName: entityName.trim(),
          entityType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Handle JSON response
      const data = (await response.json()) as EntityData
      console.log("Auto-fill response received:", data)
      onAutoFillComplete?.(data)
      setAutoFillError(null)
    } catch (error) {
      console.error("Auto-fill request failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to auto-fill"
      setAutoFillError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsAutoFilling(false)
    }
  }

  return {
    isAutoFilling,
    autoFillError,
    triggerAutoFill,
    clearError: () => setAutoFillError(null),
  }
}
