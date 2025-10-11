"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { RiAddCircleLine, RiAppsLine, RiFireLine, RiHomeLine, RiSearchLine } from "@remixicon/react"

import { SearchCommand } from "./search-command"

export function BottomNav() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  const navItems = [
    {
      href: "/",
      icon: RiHomeLine,
      label: "Home",
      isActive: pathname === "/",
      type: "link" as const,
    },
    {
      icon: RiSearchLine,
      label: "Search",
      isActive: false,
      type: "action" as const,
      action: () => setSearchOpen(true),
    },
    {
      href: "/trending",
      icon: RiFireLine,
      label: "Trending",
      isActive: pathname === "/trending",
      type: "link" as const,
    },
    {
      href: "/directory",
      icon: RiAppsLine,
      label: "Directory",
      isActive: pathname === "/directory",
      type: "link" as const,
    },
    {
      href: "/submit",
      icon: RiAddCircleLine,
      label: "Submit",
      isActive: pathname === "/submit",
      type: "link" as const,
    },
  ]

  return (
    <>
      <nav className="bg-background/95 border-border/40 sticky bottom-0 z-50 border-t backdrop-blur-sm md:hidden">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex h-17 items-center justify-around">
            {navItems.map((item, index) => {
              const Icon = item.icon

              if (item.type === "action") {
                return (
                  <button
                    key={index}
                    onClick={item.action}
                    className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs transition-colors ${
                      item.isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        item.isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs transition-colors ${
                    item.isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      item.isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Search Command Dialog controlled by bottom nav */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} hideButton={true} />
    </>
  )
}
