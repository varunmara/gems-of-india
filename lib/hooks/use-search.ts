"use client"

import { useEffect, useRef, useState } from "react"

import { SearchResult } from "@/app/api/search/route"

interface UseSearchOptions {
  debounceMs?: number
  minLength?: number
}

interface UseSearchResult {
  query: string
  setQuery: (query: string) => void
  results: SearchResult[]
  isLoading: boolean
  error: string | null
}

// Interface for the validation of results
interface ResultValidation {
  id: string
  name: string
  type: string
  [key: string]: unknown
}

// Interface for API errors
interface ApiError {
  error: string
  message: string
  reset?: number
}

export function useSearch({
  debounceMs = 300,
  minLength = 2,
}: UseSearchOptions = {}): UseSearchResult {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reference for the debounce timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cancel the previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Reset the results if the query is too short
    if (!query || query.length < minLength) {
      setResults([])
      setIsLoading(false)
      return
    }

    // Set a new timeout for the debounce
    setIsLoading(true)
    timeoutRef.current = setTimeout(async () => {
      try {
        // Call the search API
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)

        const data = await response.json()

        if (!response.ok) {
          // Handle API errors in a structured way
          const apiError = data as ApiError

          if (response.status === 429) {
            // Rate limit - this is not a critical error, just a limitation
            setError(apiError.message || `Too many requests. Please wait before trying again.`)
          } else {
            // Other errors
            throw new Error(apiError.message || `Search request failed (${response.status})`)
          }

          setResults([])
          return
        }

        if (data && data.results && Array.isArray(data.results)) {
          // Check that each result has the required properties
          const validResults = data.results.filter(
            (result: ResultValidation) =>
              result &&
              typeof result === "object" &&
              "id" in result &&
              "name" in result &&
              "type" in result,
          )

          setResults(validResults as SearchResult[])
          setError(null)
        } else {
          console.warn("[useSearch] Results are not an array:", data)
          setResults([])
        }
      } catch (err) {
        console.error("[useSearch] Search error:", err)
        // Display the specific error message or a generic message
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while searching. Please try again later.",
        )
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    // Clean up the timeout when the component unmounts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, debounceMs, minLength])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
  }
}
