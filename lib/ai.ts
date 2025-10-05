import { google } from "@ai-sdk/google"

// Initialize Google AI provider
const googleAI = google("gemini-2.5-flash-lite")

// Export available models
export const models = {
  geminiFlash: googleAI,
  geminiPro: googleAI,
} as const
