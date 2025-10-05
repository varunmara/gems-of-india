"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import {
  RiAddCircleLine,
  RiAppsLine,
  RiDashboardLine,
  RiErrorWarningLine,
  RiFireLine,
  RiLoader4Line,
  RiRocketLine,
  RiSearchLine,
} from "@remixicon/react"

import { useSearch } from "@/lib/hooks/use-search"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CommandDialog, CommandInput } from "@/components/ui/command"
import { DialogTitle } from "@/components/ui/dialog"

import { RandomLogo } from "../shared/random-logo"

interface SearchCommandProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideButton?: boolean
}

export function SearchCommand({
  open: externalOpen,
  onOpenChange,
  hideButton = false,
}: SearchCommandProps = {}) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const resultsRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(false)

  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  // Keep ref in sync with open state
  openRef.current = open

  // use our search hook
  const { query, setQuery, results, isLoading, error } = useSearch({
    debounceMs: 300,
    minLength: 2,
  })

  // keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (onOpenChange) {
          // External control - just toggle the boolean
          onOpenChange(!openRef.current)
        } else {
          // Internal control - use functional update
          setInternalOpen((prev) => !prev)
        }
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // handle the keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // ignore if we are loading
      if (isLoading) return

      // determine the total number of selectable items
      let totalItems = 0

      // count the search results
      if (results && results.length > 0) {
        totalItems = results.length
      }
      // count the suggestions if no search
      else if (query.length === 0) {
        totalItems = 5 // 3 suggestions + 2 navigation
      }

      if (totalItems === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setActiveIndex((prev) => (prev + 1) % totalItems)
          break
        case "ArrowUp":
          e.preventDefault()
          setActiveIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1))
          break
        case "Enter":
          e.preventDefault()
          if (activeIndex >= 0) {
            const activeElement = resultsRef.current?.querySelector(
              `[data-index="${activeIndex}"]`,
            ) as HTMLDivElement
            if (activeElement) {
              activeElement.click()
            }
          }
          break
        case "Escape":
          setOpen(false)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLoading, results, query, activeIndex])

  // reset the active index when the results change
  useEffect(() => {
    setActiveIndex(-1)
  }, [results, query])

  // function to navigate to a result
  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false)
    command()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // reset the state when opening/closing
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen)
      if (!isOpen) {
        // reset the state when closing
        setQuery("")
        setActiveIndex(-1)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setQuery],
  )

  // Render the search results
  const renderSearchResults = () => {
    if (!results || results.length === 0) return null

    return (
      <div>
        <div className="text-muted-foreground mb-2 px-1 text-xs">
          {results.length} results found
        </div>
        <div className="space-y-1">
          {results.map((result, index) => (
            <div
              key={`${result.type || "unknown"}-${result.id || index}`}
              data-index={index}
              className={`flex cursor-pointer items-center rounded-md p-2 transition-colors ${
                activeIndex === index ? "bg-muted text-foreground" : "hover:bg-muted/50"
              }`}
              onClick={() => {
                runCommand(() => {
                  const url =
                    result.type === "entity"
                      ? `/${result.slug || result.id}`
                      : `/categories?category=${result.id}`
                  router.push(url)
                })
              }}
            >
              {result.type === "entity" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={result.logoUrl || undefined} alt={`${result.name} logo`} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                    <RandomLogo name={result.name} size={32} variant="rounded" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex min-w-0 flex-col pl-2">
                <span className="truncate font-medium">{result.name}</span>
                {result.description && (
                  <span className="text-muted-foreground truncate text-xs">
                    {result.description}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Calculate the minimum height to avoid the scrollbar at opening
  const getMinHeight = () => {
    if (query.length === 0) {
      // Height for suggestions (5 items + titles + spacing)
      return "100%"
    } else if (isLoading) {
      // Height for loading indicator
      return "100%"
    } else if (error || (query.length >= 2 && (!results || results.length === 0))) {
      // Height for error messages or "No results found"
      return "100%"
    } else if (results && results.length > 0) {
      // Dynamic height based on the number of results (about 60px per result)
      const resultsHeight = Math.min(results.length * 60, 350)
      return `${resultsHeight}px`
    }
    return "auto"
  }

  return (
    <>
      {!hideButton && (
        <button
          type="button"
          className="text-muted-foreground bg-muted/60 hover:bg-muted flex h-8 w-64 cursor-pointer items-center justify-start rounded-md border-none px-2 text-sm transition-colors focus:outline-none"
          onClick={() => setOpen(true)}
        >
          <RiSearchLine className="mr-2 h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="bg-muted pointer-events-none ml-auto hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <DialogTitle className="sr-only">Search</DialogTitle>
        <CommandInput
          placeholder="Search gems, categories..."
          value={query}
          onValueChange={setQuery}
          className="border-none focus:ring-0"
        />
        <div
          className="scrollbar-hide overflow-y-auto p-2"
          style={{
            minHeight: getMinHeight(),
            maxHeight: "350px",
          }}
          ref={resultsRef}
        >
          {/* Display the search results */}
          {isLoading && (
            <div className="flex items-center justify-center py-4 text-center">
              <RiLoader4Line className="text-primary mr-2 h-5 w-5 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {/* Display the error */}
          {error && (
            <div className="flex flex-col items-center justify-center py-4 text-center text-sm text-red-500">
              <RiErrorWarningLine className="mb-2 h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Display "No results" */}
          {!isLoading && !error && query.length >= 2 && (!results || results.length === 0) && (
            <div className="text-muted-foreground py-4 text-center text-sm">No results found.</div>
          )}

          {/* Display the results */}
          {!isLoading && !error && renderSearchResults()}

          {/* Display the suggestions */}
          {query.length === 0 && (
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 px-1 text-sm font-medium">Suggestions</h4>
                <div className="space-y-1">
                  <div
                    data-index="0"
                    className={`flex cursor-pointer items-center rounded-md p-2 transition-colors ${
                      activeIndex === 0 ? "bg-muted text-foreground" : "hover:bg-muted/50"
                    }`}
                    onClick={() => runCommand(() => router.push("/trending"))}
                  >
                    <RiFireLine className="mr-2 h-4 w-4 text-yellow-500" />
                    <span>Trending Gems</span>
                  </div>
                  <div
                    data-index="1"
                    className={`flex cursor-pointer items-center rounded-md p-2 transition-colors ${
                      activeIndex === 1 ? "bg-muted text-foreground" : "hover:bg-muted/50"
                    }`}
                    onClick={() => runCommand(() => router.push("/categories"))}
                  >
                    <RiAppsLine className="mr-2 h-4 w-4 text-purple-500" />
                    <span>Categories</span>
                  </div>
                </div>
              </div>

              <div className="border-border border-t pt-4">
                <h4 className="mb-2 px-1 text-sm font-medium">Navigation</h4>

                <div className="space-y-1">
                  {/* explore gems */}

                  <div
                    data-index="2"
                    className={`flex cursor-pointer items-center rounded-md p-2 transition-colors ${
                      activeIndex === 2 ? "bg-muted text-foreground" : "hover:bg-muted/50"
                    }`}
                    onClick={() => runCommand(() => router.push("/"))}
                  >
                    <RiRocketLine className="text-primary mr-2 h-4 w-4" />
                    <span>Explore Gems</span>
                  </div>

                  {/* for dashboard */}
                  <div
                    data-index="3"
                    className={`flex cursor-pointer items-center rounded-md p-2 transition-colors ${
                      activeIndex === 3 ? "bg-muted text-foreground" : "hover:bg-muted/50"
                    }`}
                    onClick={() => runCommand(() => router.push("/dashboard"))}
                  >
                    <RiDashboardLine className="mr-2 h-4 w-4 text-green-500" />
                    <span>Dashboard</span>
                  </div>
                  <div
                    data-index="4"
                    className={`flex cursor-pointer items-center rounded-md p-2 transition-colors ${
                      activeIndex === 4 ? "bg-muted text-foreground" : "hover:bg-muted/50"
                    }`}
                    onClick={() => runCommand(() => router.push("/submit"))}
                  >
                    <RiAddCircleLine className="mr-2 h-4 w-4 text-sky-500" />
                    <span>Submit Gem</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CommandDialog>
    </>
  )
}
