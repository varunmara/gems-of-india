"use client"

import { useEffect, useState } from "react"

import { Download, Monitor, Smartphone, X } from "lucide-react"

import { usePWA } from "@/hooks/use-pwa"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function PWAInstallPrompt() {
  const { canInstall, installApp, isInstalled, isStandalone } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Don't show prompt if already installed
    if (isInstalled || isStandalone) {
      setShowPrompt(false)
      return
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(userAgent))
    setIsAndroid(/android/.test(userAgent))
    setIsDesktop(!/mobile|android|iphone|ipad|ipod/.test(userAgent))

    // Show prompt after 10 seconds if can install or on mobile platforms
    const timer = setTimeout(() => {
      // Double-check that app is not installed before showing prompt
      if (!isInstalled && !isStandalone && (canInstall || isIOS || isAndroid || isDesktop)) {
        setShowPrompt(true)
      } else {
      }
    }, 10000)

    return () => {
      clearTimeout(timer)
    }
  }, [canInstall, isIOS, isAndroid, isDesktop, isInstalled, isStandalone])

  const handleInstallClick = async () => {
    await installApp()
    setShowPrompt(false)
  }

  // Hide prompt if app gets installed
  useEffect(() => {
    if (isInstalled || isStandalone) {
      setShowPrompt(false)
    }
  }, [isInstalled, isStandalone])

  const getInstallInstructions = () => {
    if (isIOS) {
      return "Tap the Share button and then 'Add to Home Screen'"
    } else if (isAndroid) {
      return "Tap the menu button and select 'Add to Home Screen'"
    } else if (isDesktop) {
      return "Click the install button below to add to your desktop"
    }
    return "Use the install button below to add to your device"
  }

  const getInstallIcon = () => {
    if (isIOS) return <Smartphone className="h-5 w-5" />
    if (isAndroid) return <Smartphone className="h-5 w-5" />
    if (isDesktop) return <Monitor className="h-5 w-5" />
    return <Download className="h-5 w-5" />
  }

  if (!showPrompt) return null

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 md:right-4 md:left-auto md:w-80">
      <Card className="border-primary/20 border-2 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getInstallIcon()}
              Install Gems of India
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrompt(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Review and rate government officials</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">{getInstallInstructions()}</p>
            {canInstall && (
              <Button onClick={handleInstallClick} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
            )}
            {!canInstall && (isIOS || isAndroid) && (
              <div className="text-muted-foreground bg-muted rounded p-2 text-xs">
                <strong>Manual Installation:</strong> {getInstallInstructions()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
