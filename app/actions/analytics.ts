/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

interface GoogleAnalyticsResponse {
  metricHeaders: Array<{
    name: string
    type: string
  }>
  rows: Array<{
    metricValues: Array<{ value: string }>
  }>
  totals: Array<{
    metricValues: Array<{ value: string }>
  }>
  rowCount: number
  metadata: {
    currencyCode: string
    timeZone: string
  }
  kind: string
}

export async function getLast24hVisitors(): Promise<number | null> {
  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY

  if (!GA_PROPERTY_ID) {
    console.error("Google Analytics Property ID (GA_PROPERTY_ID) is not configured.")
    return null
  }
  if (!GA_SERVICE_ACCOUNT_KEY) {
    console.error(
      "Google Analytics Service Account Key (GA_SERVICE_ACCOUNT_KEY) is not configured.",
    )
    return null
  }

  // Validate property ID format (should be numeric only)
  if (!/^\d+$/.test(GA_PROPERTY_ID)) {
    console.error(
      `Invalid GA Property ID format: ${GA_PROPERTY_ID}. Should be numeric only (e.g., "123456789")`,
    )
    return null
  }

  try {
    const serviceAccount = JSON.parse(GA_SERVICE_ACCOUNT_KEY)
    console.log("Service account parsed successfully, client_email:", serviceAccount.client_email)

    const accessToken = await getGoogleAnalyticsAccessToken(serviceAccount)

    if (!accessToken) {
      console.error("Failed to get access token")
      return null
    }

    console.log("Access token obtained successfully")

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const startDate = yesterday.toISOString().split("T")[0]
    const endDate = now.toISOString().split("T")[0]

    console.log(`Making GA API call for 24h visitors: ${startDate} to ${endDate}`)

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: "activeUsers" }],
          keepEmptyRows: true,
          metricAggregations: ["TOTAL"],
          limit: 1,
        }),
        next: { revalidate: 600 }, // 10 min cache
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `Error fetching Google Analytics stats: ${response.status} ${response.statusText}`,
        errorText,
      )
      return null
    }

    const data = (await response.json()) as GoogleAnalyticsResponse
    console.log("GA API response for 24h visitors:", JSON.stringify(data, null, 2))

    if (
      data.totals &&
      data.totals.length > 0 &&
      data.totals[0].metricValues &&
      data.totals[0].metricValues.length > 0
    ) {
      return parseInt(data.totals[0].metricValues[0].value)
    }

    if (data.rows && data.rows.length > 0) {
      return parseInt(data.rows[0].metricValues[0].value)
    }

    console.error(
      "No valid data found in Google Analytics API response:",
      JSON.stringify(data, null, 2),
    )
    return null
  } catch (error) {
    console.error("Error connecting to Google Analytics API:", error)
    return null
  }
}

export async function getLast7DaysVisitors(): Promise<number | null> {
  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY

  if (!GA_PROPERTY_ID) {
    console.error("Google Analytics Property ID (GA_PROPERTY_ID) is not configured.")
    return null
  }
  if (!GA_SERVICE_ACCOUNT_KEY) {
    console.error(
      "Google Analytics Service Account Key (GA_SERVICE_ACCOUNT_KEY) is not configured.",
    )
    return null
  }

  // Validate property ID format (should be numeric only)
  if (!/^\d+$/.test(GA_PROPERTY_ID)) {
    console.error(
      `Invalid GA Property ID format: ${GA_PROPERTY_ID}. Should be numeric only (e.g., "123456789")`,
    )
    return null
  }

  try {
    const serviceAccount = JSON.parse(GA_SERVICE_ACCOUNT_KEY)
    const accessToken = await getGoogleAnalyticsAccessToken(serviceAccount)

    if (!accessToken) {
      return null
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startDate = weekAgo.toISOString().split("T")[0]
    const endDate = now.toISOString().split("T")[0]

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: "activeUsers" }],
          keepEmptyRows: true,
          metricAggregations: ["TOTAL"],
          limit: 1,
        }),
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    )

    if (!response.ok) {
      console.error(
        `Error fetching Google Analytics stats (7 days): ${response.status} ${response.statusText}`,
        await response.text(),
      )
      return null
    }

    const data = (await response.json()) as GoogleAnalyticsResponse

    if (
      data.totals &&
      data.totals.length > 0 &&
      data.totals[0].metricValues &&
      data.totals[0].metricValues.length > 0
    ) {
      return parseInt(data.totals[0].metricValues[0].value)
    }

    if (data.rows && data.rows.length > 0) {
      return parseInt(data.rows[0].metricValues[0].value)
    }

    console.error(
      "Unexpected Google Analytics API response structure for 7-day query:",
      JSON.stringify(data, null, 2),
    )
    return null
  } catch (error) {
    console.error("Error connecting to Google Analytics API (7 days):", error)
    return null
  }
}

export async function getLast30DaysVisitors(): Promise<number | null> {
  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY

  if (!GA_PROPERTY_ID) {
    console.error("Google Analytics Property ID (GA_PROPERTY_ID) is not configured.")
    return null
  }
  if (!GA_SERVICE_ACCOUNT_KEY) {
    console.error(
      "Google Analytics Service Account Key (GA_SERVICE_ACCOUNT_KEY) is not configured.",
    )
    return null
  }

  // Validate property ID format (should be numeric only)
  if (!/^\d+$/.test(GA_PROPERTY_ID)) {
    console.error(
      `Invalid GA Property ID format: ${GA_PROPERTY_ID}. Should be numeric only (e.g., "123456789")`,
    )
    return null
  }

  try {
    const serviceAccount = JSON.parse(GA_SERVICE_ACCOUNT_KEY)
    const accessToken = await getGoogleAnalyticsAccessToken(serviceAccount)

    if (!accessToken) {
      return null
    }

    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const startDate = monthAgo.toISOString().split("T")[0]
    const endDate = now.toISOString().split("T")[0]

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: "activeUsers" }],
          metricAggregations: ["TOTAL"],
          keepEmptyRows: true,
          limit: 1,
        }),
        next: { revalidate: 21600 }, // Cache for 6 hours
      },
    )

    if (!response.ok) {
      console.error(
        `Error fetching Google Analytics stats (30 days): ${response.status} ${response.statusText}`,
        await response.text(),
      )
      return null
    }

    const data = (await response.json()) as GoogleAnalyticsResponse

    if (
      data.totals &&
      data.totals.length > 0 &&
      data.totals[0].metricValues &&
      data.totals[0].metricValues.length > 0
    ) {
      return parseInt(data.totals[0].metricValues[0].value)
    }

    if (data.rows && data.rows.length > 0) {
      return parseInt(data.rows[0].metricValues[0].value)
    }

    console.error(
      "Unexpected Google Analytics API response structure for 30-day query:",
      JSON.stringify(data, null, 2),
    )
    return null
  } catch (error) {
    console.error("Error connecting to Google Analytics API (30 days):", error)
    return null
  }
}

export async function getLast30DaysPageviews(): Promise<number | null> {
  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY

  if (!GA_PROPERTY_ID) {
    console.error("Google Analytics Property ID (GA_PROPERTY_ID) is not configured.")
    return null
  }
  if (!GA_SERVICE_ACCOUNT_KEY) {
    console.error(
      "Google Analytics Service Account Key (GA_SERVICE_ACCOUNT_KEY) is not configured.",
    )
    return null
  }

  // Validate property ID format (should be numeric only)
  if (!/^\d+$/.test(GA_PROPERTY_ID)) {
    console.error(
      `Invalid GA Property ID format: ${GA_PROPERTY_ID}. Should be numeric only (e.g., "123456789")`,
    )
    return null
  }

  try {
    const serviceAccount = JSON.parse(GA_SERVICE_ACCOUNT_KEY)
    const accessToken = await getGoogleAnalyticsAccessToken(serviceAccount)

    if (!accessToken) {
      return null
    }

    const now = new Date()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const startDate = monthAgo.toISOString().split("T")[0]
    const endDate = now.toISOString().split("T")[0]

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: "screenPageViews" }],
          keepEmptyRows: true,
          metricAggregations: ["TOTAL"],
          limit: 1,
        }),
        next: { revalidate: 21600 }, // Cache for 6 hours
      },
    )

    if (!response.ok) {
      console.error(
        `Error fetching Google Analytics pageviews stats (30 days): ${response.status} ${response.statusText}`,
        await response.text(),
      )
      return null
    }

    const data = (await response.json()) as GoogleAnalyticsResponse

    if (
      data.totals &&
      data.totals.length > 0 &&
      data.totals[0].metricValues &&
      data.totals[0].metricValues.length > 0
    ) {
      return parseInt(data.totals[0].metricValues[0].value)
    }

    if (data.rows && data.rows.length > 0) {
      return parseInt(data.rows[0].metricValues[0].value)
    }

    console.error(
      "Unexpected Google Analytics API response structure for 30-day pageviews query:",
      JSON.stringify(data, null, 2),
    )
    return null
  } catch (error) {
    console.error("Error connecting to Google Analytics API (30 days pageviews):", error)
    return null
  }
}

export async function getCurrentYearVisitors(): Promise<number | null> {
  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY

  if (!GA_PROPERTY_ID) {
    console.error("Google Analytics Property ID (GA_PROPERTY_ID) is not configured.")
    return null
  }
  if (!GA_SERVICE_ACCOUNT_KEY) {
    console.error(
      "Google Analytics Service Account Key (GA_SERVICE_ACCOUNT_KEY) is not configured.",
    )
    return null
  }

  // Validate property ID format (should be numeric only)
  if (!/^\d+$/.test(GA_PROPERTY_ID)) {
    console.error(
      `Invalid GA Property ID format: ${GA_PROPERTY_ID}. Should be numeric only (e.g., "123456789")`,
    )
    return null
  }

  try {
    const serviceAccount = JSON.parse(GA_SERVICE_ACCOUNT_KEY)
    const accessToken = await getGoogleAnalyticsAccessToken(serviceAccount)

    if (!accessToken) {
      return null
    }

    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1) // January 1st of current year
    const startDate = yearStart.toISOString().split("T")[0]
    const endDate = now.toISOString().split("T")[0]

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: "activeUsers" }],
          keepEmptyRows: true,
          metricAggregations: ["TOTAL"],
          limit: 1,
        }),
        next: { revalidate: 86400 }, // Cache for 24 hours
      },
    )

    if (!response.ok) {
      console.error(
        `Error fetching Google Analytics stats (current year): ${response.status} ${response.statusText}`,
        await response.text(),
      )
      return null
    }

    const data = (await response.json()) as GoogleAnalyticsResponse

    if (
      data.totals &&
      data.totals.length > 0 &&
      data.totals[0].metricValues &&
      data.totals[0].metricValues.length > 0
    ) {
      return parseInt(data.totals[0].metricValues[0].value)
    }

    if (data.rows && data.rows.length > 0) {
      return parseInt(data.rows[0].metricValues[0].value)
    }

    console.error(
      "No valid data found in Google Analytics API response for current year query:",
      JSON.stringify(data, null, 2),
    )
    return null
  } catch (error) {
    console.error("Error connecting to Google Analytics API (current year):", error)
    return null
  }
}

export async function getCurrentYearPageviews(): Promise<number | null> {
  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY

  if (!GA_PROPERTY_ID) {
    console.error("Google Analytics Property ID (GA_PROPERTY_ID) is not configured.")
    return null
  }
  if (!GA_SERVICE_ACCOUNT_KEY) {
    console.error(
      "Google Analytics Service Account Key (GA_SERVICE_ACCOUNT_KEY) is not configured.",
    )
    return null
  }

  // Validate property ID format (should be numeric only)
  if (!/^\d+$/.test(GA_PROPERTY_ID)) {
    console.error(
      `Invalid GA Property ID format: ${GA_PROPERTY_ID}. Should be numeric only (e.g., "123456789")`,
    )
    return null
  }

  try {
    const serviceAccount = JSON.parse(GA_SERVICE_ACCOUNT_KEY)
    const accessToken = await getGoogleAnalyticsAccessToken(serviceAccount)

    if (!accessToken) {
      return null
    }

    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1) // January 1st of current year
    const startDate = yearStart.toISOString().split("T")[0]
    const endDate = now.toISOString().split("T")[0]

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [{ name: "screenPageViews" }],
          keepEmptyRows: true,
          metricAggregations: ["TOTAL"],
          limit: 1,
        }),
        next: { revalidate: 86400 }, // Cache for 24 hours
      },
    )

    if (!response.ok) {
      console.error(
        `Error fetching Google Analytics pageviews stats (current year): ${response.status} ${response.statusText}`,
        await response.text(),
      )
      return null
    }

    const data = (await response.json()) as GoogleAnalyticsResponse

    if (
      data.totals &&
      data.totals.length > 0 &&
      data.totals[0].metricValues &&
      data.totals[0].metricValues.length > 0
    ) {
      return parseInt(data.totals[0].metricValues[0].value)
    }

    if (data.rows && data.rows.length > 0) {
      return parseInt(data.rows[0].metricValues[0].value)
    }

    console.error(
      "No valid data found in Google Analytics API response for current year pageviews query:",
      JSON.stringify(data, null, 2),
    )
    return null
  } catch (error) {
    console.error("Error connecting to Google Analytics API (current year pageviews):", error)
    return null
  }
}

async function getGoogleAnalyticsAccessToken(serviceAccount: any): Promise<string | null> {
  try {
    const jwtHeader = {
      alg: "RS256",
      typ: "JWT",
    }

    const now = Math.floor(Date.now() / 1000)
    const expiry = now + 3600

    const jwtPayload = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: expiry,
      iat: now,
    }

    const encodedHeader = Buffer.from(JSON.stringify(jwtHeader)).toString("base64url")
    const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString("base64url")

    const crypto = await import("crypto")
    const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n")

    const signature = crypto
      .sign("RSA-SHA256", Buffer.from(`${encodedHeader}.${encodedPayload}`), privateKey)
      .toString("base64url")

    const jwt = `${encodedHeader}.${encodedPayload}.${signature}`

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error(
        `Error getting Google Analytics access token: ${tokenResponse.status} ${tokenResponse.statusText}`,
        errorText,
      )
      return null
    }

    const tokenData = await tokenResponse.json()
    console.log("Access token response received successfully")
    return tokenData.access_token
  } catch (error) {
    console.error("Error getting Google Analytics access token:", error)
    return null
  }
}
