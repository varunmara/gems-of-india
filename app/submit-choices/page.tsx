"use client"

import { useState } from "react"
import Link from "next/link"

import { RiAddLine, RiArrowLeftLine, RiRobotLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

export default function SubmitChoicesPage() {
  const [isHovered, setIsHovered] = useState<{ [key: string]: boolean }>({})

  const cards = [
    {
      href: "/(entities)/submit",
      icon: RiAddLine,
      title: "Manual Entry",
      description: "Submit entity information manually with full control over all fields",
      color: "from-blue-500 to-blue-600",
      hoverColor: "from-blue-600 to-blue-700",
    },
    {
      href: "/scrape-entity",
      icon: RiRobotLine,
      title: "Scrape from Website",
      description: "Auto-extract entity information from government websites using AI",
      color: "from-purple-500 to-purple-600",
      hoverColor: "from-purple-600 to-purple-700",
    },
  ]

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center text-sm transition-colors"
        >
          <RiArrowLeftLine className="mr-1 h-4 w-4" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold">Submit New Entity</h1>
        <p className="text-muted-foreground mt-2">
          Choose how you&apos;d like to add a new entity to Gems of India
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon
          const isCardHovered = isHovered[card.href] || false

          return (
            <Link
              key={card.href}
              href={card.href}
              className="group"
              onMouseEnter={() => setIsHovered((prev) => ({ ...prev, [card.href]: true }))}
              onMouseLeave={() => setIsHovered((prev) => ({ ...prev, [card.href]: false }))}
            >
              <div
                className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-lg ${
                  isCardHovered
                    ? `bg-gradient-to-br ${card.hoverColor} text-white`
                    : `bg-gradient-to-br ${card.color} text-white`
                }`}
              >
                <div className="relative z-10">
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`rounded-lg bg-white/20 p-3 backdrop-blur-sm transition-all duration-300 ${
                        isCardHovered ? "bg-white/30" : ""
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-semibold">{card.title}</h2>
                  </div>

                  <p className="text-sm leading-relaxed opacity-90">{card.description}</p>

                  <Button
                    variant={isCardHovered ? "secondary" : "outline"}
                    className="mt-6 bg-white/20 text-white hover:bg-white/30"
                    size="sm"
                  >
                    Get Started
                    <RiArrowLeftLine className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </div>

                {/* Background decoration */}
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-5 -left-5 h-20 w-20 rounded-full bg-white/5 blur-xl" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="bg-muted/50 mt-12 rounded-lg p-6">
        <h3 className="mb-2 font-semibold">Which one should I choose?</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-1 text-sm font-medium">📝 Manual Entry</h4>
            <p className="text-muted-foreground text-sm">
              Perfect when you have all the information ready or want complete control over what
              gets submitted.
            </p>
          </div>
          <div>
            <h4 className="mb-1 text-sm font-medium">🤖 Auto-Scraping</h4>
            <p className="text-muted-foreground text-sm">
              Ideal when you have a government website URL and want to extract information
              automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
