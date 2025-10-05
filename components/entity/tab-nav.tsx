"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface Tab {
  name: string
  href: string
}

interface TabNavProps {
  tabs: Tab[]
}

export function TabNav({ tabs }: TabNavProps) {
  const pathname = usePathname()

  return (
    <nav className="mb-6 flex space-x-8 border-b border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`relative border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-orange-500 text-gray-900 dark:text-gray-100"
                : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200"
            }`}
          >
            {tab.name}
          </Link>
        )
      })}
    </nav>
  )
}
