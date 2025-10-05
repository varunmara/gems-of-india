declare module "next-pwa" {
  import { NextConfig } from "next"

  interface PWAConfig {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    runtimeCaching?: Array<{
      urlPattern: RegExp | string
      handler: string
      options?: {
        cacheName?: string
        expiration?: {
          maxEntries?: number
        }
      }
    }>
  }

  function withPWA(config?: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export default withPWA
}
