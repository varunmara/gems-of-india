"use client"

import { useState } from "react"
import Image from "next/image"

interface EntityImageWithLoaderProps {
  src: string
  alt: string
}

export function EntityImageWithLoader({ src, alt }: EntityImageWithLoaderProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="relative overflow-hidden rounded-xl">
      {isLoading && <div className="bg-muted absolute inset-0 z-10 animate-pulse"></div>}
      <Image
        src={src}
        alt={alt}
        width={800}
        height={400}
        className="h-auto w-full object-cover"
        priority
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />
    </div>
  )
}
