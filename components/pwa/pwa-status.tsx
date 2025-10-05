"use client"

import { CheckCircle, Download, Smartphone } from "lucide-react"

import { usePWA } from "@/hooks/use-pwa"
import { Badge } from "@/components/ui/badge"

export function PWAStatus() {
  const { isInstalled, isStandalone, canInstall } = usePWA()

  if (isInstalled || isStandalone) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Installed
      </Badge>
    )
  }

  if (canInstall) {
    return (
      <Badge variant="default" className="gap-1">
        <Download className="h-3 w-3" />
        Install Available
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1">
      <Smartphone className="h-3 w-3" />
      Web App
    </Badge>
  )
}
