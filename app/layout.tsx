import type { Metadata, Viewport } from "next"
import { Outfit as FontHeading, Inter as FontSans } from "next/font/google"

import { GoogleAnalytics } from "@next/third-parties/google"
import { Toaster } from "sonner"

import { BottomNav } from "@/components/layout/bottom-nav"
import Footer from "@/components/layout/footer"
import Nav from "@/components/layout/nav"
import { PWAInstallPrompt } from "@/components/pwa/install-prompt"
import { ThemeProvider } from "@/components/theme/theme-provider"

import "./globals.css"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontHeading = FontHeading({
  subsets: ["latin"],
  variable: "--font-heading",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"),
  title: {
    default: "Gems of India - Rate & Review Government Officials | Accountability Platform",
    template: "%s | Gems of India",
  },
  description:
    "India's premier platform to rate and review government officials, politicians, judges, and departments. Improve transparency and accountability in Indian governance. Find and review babus, bureaucrats, and public servants.",
  keywords: [
    "India government officials",
    "rate politicians India",
    "government accountability",
    "Indian bureaucracy review",
    "political transparency",
    "babu rating",
    "judge review India",
    "government department feedback",
    "Indian governance",
    "public service rating",
    "RTI follow up",
    "corruption reporting",
    "civic engagement India",
    "government transparency",
    "public accountability",
  ],
  authors: [{ name: "Gems of India Team" }],
  creator: "Gems of India",
  publisher: "Gems of India",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gems of India",
  },
  openGraph: {
    title: "Gems of India - Rate & Review Indian Government Officials",
    description:
      "India's premier platform to rate and review government officials, politicians, judges, and departments. Improve transparency and accountability in Indian governance.",
    url: process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org",
    siteName: "Gems of India",
    images: [
      {
        url: "logo.png",
        width: 1200,
        height: 630,
        alt: "Gems of India - Rate & Review Indian Government Officials",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gems of India - Rate & Review Indian Government Officials",
    description:
      "India's premier platform to rate and review government officials, politicians, judges, and departments. Improve transparency and accountability.",
    images: ["logo.png"],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org",
    languages: {
      "en-IN": process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-locale="en-IN" suppressHydrationWarning>
      <head>
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <meta name="geo.position" content="20.593684;78.96288" />
        <meta name="ICBM" content="20.593684, 78.96288" />
        <link
          rel="alternate"
          hrefLang="en-IN"
          href={process.env.NEXT_PUBLIC_URL || "https://gemsofindia.org"}
        />
        {process.env.NODE_ENV === "production" && process.env.GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.GA_MEASUREMENT_ID} />
        )}
      </head>
      <body
        className={`font-sans antialiased ${fontSans.variable} ${fontHeading.variable} sm:overflow-y-scroll`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-dvh flex-col">
            <Nav />
            <main className="flex-grow pb-17 md:pb-0">{children}</main>
            <Footer />
            <BottomNav />
          </div>
        </ThemeProvider>
        <Toaster />
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
