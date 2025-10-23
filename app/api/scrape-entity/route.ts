import { generateObject } from "ai"
import { chromium } from "playwright"
import { z } from "zod"

import { models } from "@/lib/ai"
import { EntityDataSchema } from "@/lib/schemas"

// Allowed domains for scraping - focus on government sites
const ALLOWED_DOMAINS = [
  "gov.in",
  "nic.in",
  "parliament.in",
  "pmindia.gov.in",
  "niti.gov.in",
  "india.gov.in",
  "mygov.in",
  "psc.gov.in",
  "upsc.gov.in",
  "ssc.nic.in",
  "ibps.in",
  "rbi.org.in",
  "sebi.gov.in",
  "ac.in",
  "irdai.gov.in",
  "pfrda.org.in",
  "epfindia.gov.in",
  "esic.nic.in",
  "licindia.in",
  "bankofindia.co.in",
  "sbi.co.in",
  "pnbindia.in",
  "hdfcbank.com",
  "icicibank.com",
  "axisbank.com",
  "canarabank.com",
  "unionbankofindia.co.in",
  "bankofbaroda.in",
  "indianbank.in",
  "centralbankofindia.co.in",
]

function formatEmailText(email: string): string {
  if (!email) return email

  // Replace [at] with @ and [dot] with .
  return email
    .replace(/\[at\]/gi, "@")
    .replace(/\[dot\]/gi, ".")
    .replace(/ at /gi, "@")
    .replace(/ dot /gi, ".")
}

function isDomainAllowed(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    return ALLOWED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

async function scrapeWebPage(url: string): Promise<string> {
  let browser = null
  try {
    // Launch Playwright browser
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--no-first-run",
        "--disable-default-apps",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
      ],
    })

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      viewport: { width: 1920, height: 1080 },
      javaScriptEnabled: true,
    })

    const page = await context.newPage()

    // Set navigation timeout
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(30000)

    console.log("Navigating to URL:", url)

    // Navigate to the URL and wait for content to load
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    })

    // Wait a bit more for any dynamic content to load
    await page.waitForTimeout(2000)

    // Try to wait for main content if possible
    try {
      // Wait for common content selectors or at least some text
      await Promise.race([
        page.waitForSelector("main, article, .content, .main-content, #content, #main", {
          timeout: 5000,
        }),
        page.waitForSelector("h1, h2, h3", { timeout: 5000 }),
        page.waitForTimeout(1000), // fallback wait
      ])
    } catch {
      // Continue even if specific elements aren't found
    }

    console.log("Extracting page content...")

    // Extract HTML content with improved parsing
    const content = await page.evaluate(() => {
      // Remove unwanted elements first
      const unwantedSelectors = [
        "nav",
        "header",
        "footer",
        ".navigation",
        ".nav",
        ".menu",
        ".sidebar",
        ".advertisement",
        ".ads",
        ".social-share",
        "script",
        "style",
        "noscript",
        "iframe",
        ".comments",
        ".comment-section",
        ".newsletter",
        ".popup",
        ".modal",
        ".cookie-banner",
      ]

      // Clone body to work with it without modifying the actual page
      const bodyClone = document.body.cloneNode(true) as HTMLElement

      // Remove unwanted elements from the clone
      unwantedSelectors.forEach((sel) => {
        const elements = bodyClone.querySelectorAll(sel)
        elements.forEach((el) => el.remove())
      })

      // Strategy 1: Look for main content areas with HTML structure preserved
      const contentSelectors = [
        "main",
        "article",
        '[role="main"]',
        ".content",
        ".main-content",
        "#content",
        "#main",
        ".container",
        ".wrapper",
        ".post-content",
        ".entry-content",
        ".article-content",
      ]

      let mainContentElement: HTMLElement | null = null
      let maxLength = 0

      for (const selector of contentSelectors) {
        const element = bodyClone.querySelector(selector) as HTMLElement
        if (element) {
          const textLength = element.textContent?.length || 0
          if (textLength > maxLength) {
            maxLength = textLength
            mainContentElement = element
          }
        }
      }

      // If no main content found, use the cleaned body
      const contentElement = mainContentElement || bodyClone

      // Extract structured content for better chunking
      const structuredContent: string[] = []

      // Look for tables with people data
      const tables = contentElement.querySelectorAll("table")
      tables.forEach((table) => {
        const rows = table.querySelectorAll("tr")
        const tableData = Array.from(rows)
          .map((row) =>
            Array.from(row.querySelectorAll("td, th"))
              .map((cell) => cell.textContent?.trim() || "")
              .filter(Boolean)
              .join(" | "),
          )
          .filter((text) => text.length > 20)

        if (tableData.length > 0) {
          structuredContent.push(`TABLE:\n${tableData.join("\n")}`)
        }
      })

      // Look for lists (ul, ol) that might contain people
      const lists = contentElement.querySelectorAll("ul, ol")
      lists.forEach((list) => {
        const items = Array.from(list.querySelectorAll("li"))
          .map((li) => li.textContent?.trim() || "")
          .filter((text) => text.length > 20)

        if (items.length > 2) {
          structuredContent.push(`LIST:\n${items.join("\n")}`)
        }
      })

      // Look for sections with headings
      const headings = contentElement.querySelectorAll("h1, h2, h3, h4, h5, h6")
      headings.forEach((heading) => {
        const headingText = heading.textContent?.trim()
        if (headingText && headingText.length > 10) {
          // Get content after this heading until next heading
          let content = ""
          let nextElement = heading.nextElementSibling

          while (
            nextElement &&
            !["H1", "H2", "H3", "H4", "H5", "H6"].includes(nextElement.tagName)
          ) {
            if (nextElement.textContent && nextElement.textContent.trim().length > 10) {
              content += nextElement.textContent.trim() + "\n"
            }
            nextElement = nextElement.nextElementSibling
          }

          if (content.length > 50) {
            structuredContent.push(`SECTION: ${headingText}\n${content}`)
          }
        }
      })

      // Get HTML content for better structure preservation
      const htmlContent = contentElement.innerHTML

      // Get text content with structure preserved
      const textContent = contentElement.textContent || ""

      // Clean up text content
      const cleanedTextContent = textContent
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .trim()

      return {
        htmlContent: htmlContent,
        textContent: cleanedTextContent,
        structuredContent: structuredContent.join("\n\n---\n\n"),
        fullContent: structuredContent.join("\n\n---\n\n") + "\n\n" + cleanedTextContent,
      }
    })

    // Also get the page title and meta description for context
    const title = await page.title()
    const metaDescription = await page
      .$eval('meta[name="description"]', (el) => el.getAttribute("content") || "")
      .catch(() => "")

    const fullContent = `TITLE: ${title}\nDESCRIPTION: ${metaDescription}\n\nHTML CONTENT:\n${content.htmlContent}\n\nSTRUCTURED CONTENT:\n${content.structuredContent}\n\nTEXT CONTENT:\n${content.textContent}`

    console.log("Extracted content length:", fullContent.length)

    if (!content.textContent || content.textContent.length < 100) {
      throw new Error("Insufficient content extracted from the page")
    }

    return fullContent.slice(0, 50000) // Return the scraped content as a string
  } catch (error) {
    console.error("Error scraping web page:", error)
    throw new Error(
      `Failed to scrape URL: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export async function POST(request: Request) {
  try {
    const { url, parentEntityId, entityType } = await request.json()

    // Validate required fields
    if (!url?.trim()) {
      return new Response("URL is required", { status: 400 })
    }

    if (!entityType) {
      return new Response("Entity type is required", { status: 400 })
    }

    // Validate URL domain
    if (!isDomainAllowed(url)) {
      return new Response(
        "URL domain not allowed. Only government and official websites are supported.",
        { status: 400 },
      )
    }

    // Scrape the web page
    console.log("Scraping URL:", url)
    const scrapedContent = await scrapeWebPage(url)
    console.log("Scraped content length:", scrapedContent.length)

    if (!scrapedContent || scrapedContent.length < 100) {
      return new Response(
        "Could not extract sufficient content from the URL. Please try a different URL or enter information manually.",
        { status: 400 },
      )
    }

    // Create schema for multiple entities
    const MultipleEntitiesSchema = z.object({
      entities: z.array(EntityDataSchema).min(1).max(15),
    })

    // Function to split content into chunks with better overlap handling
    function splitContentIntoChunks(content: string, chunkSize: number = 6000): string[] {
      const chunks: string[] = []

      // First, try to split by the --- delimiter we added
      if (content.includes("---")) {
        const sections = content.split("---")
        let currentChunk = ""

        for (const section of sections) {
          if (currentChunk.length + section.length > chunkSize && currentChunk.length > 1500) {
            if (currentChunk.length > 100) {
              chunks.push(currentChunk.trim())
            }
            currentChunk = section
          } else {
            currentChunk += (currentChunk ? "\n---\n" : "") + section
          }
        }

        if (currentChunk.length > 100) {
          chunks.push(currentChunk.trim())
        }
      }

      // If no sections or chunks too small, split by paragraphs with some overlap
      if (chunks.length === 0) {
        const paragraphs = content.split("\n\n").filter((p) => p.trim().length > 50)
        let currentChunk = ""

        for (const paragraph of paragraphs) {
          if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 1500) {
            if (currentChunk.length > 100) {
              chunks.push(currentChunk.trim())
            }
            // Start new chunk with some overlap for context
            currentChunk = paragraph
          } else {
            currentChunk += (currentChunk ? "\n\n" : "") + paragraph
          }
        }

        if (currentChunk.length > 100) {
          chunks.push(currentChunk.trim())
        }
      }

      // If still no chunks, split by character count with minimal overlap
      if (chunks.length === 0) {
        for (let i = 0; i < content.length; i += chunkSize - 500) {
          const chunk = content.slice(i, i + chunkSize).trim()
          if (chunk.length > 100) {
            chunks.push(chunk)
          }
        }
      }

      console.log(
        `Created ${chunks.length} chunks with sizes:`,
        chunks.map((c) => c.length),
      )
      return chunks.filter((chunk) => chunk.length > 100)
    }

    // Split content into manageable chunks
    const contentChunks = splitContentIntoChunks(scrapedContent, 6000)
    console.log(`Split content into ${contentChunks.length} chunks`)

    // Process each chunk with AI
    const allEntities: unknown[] = []
    const currentYear = new Date().getFullYear()
    const entityTypeContext = `Entity type: ${entityType}. URL: ${url}. `

    for (let i = 0; i < contentChunks.length; i++) {
      const chunk = contentChunks[i]
      console.log(`Processing chunk ${i + 1}/${contentChunks.length} (${chunk.length} chars)`)

      const prompt = `You are extracting structured information from a government website page.

${entityTypeContext}Current year: ${currentYear}
Processing chunk ${i + 1} of ${contentChunks.length}.

SCRAPED CONTENT:
${chunk}

IMPORTANT: Extract ALL unique entities of type "${entityType}" mentioned in this content chunk. Focus on:
- Multiple people/organizations listed in directories, teams, or leadership sections
- Official names and titles
- Contact information
- Responsibilities/duties
- Department/organization information
- Net worth if mentioned (for individuals)

CRITICAL: Each entity should be unique - do not extract the same person/organization multiple times with minor variations in job titles.

For each unique entity found, extract the following information:

BASIC INFO:
- name: Official full name of the person/organization (max 50 chars)
- description: Brief description of their role/position (max 300 chars)
- jobTitle: Current job title/position (max 100 chars)
- jobResponsibilities: Key responsibilities and duties (max 100 chars)

LOCATION:
- streetAddress: Street address if available (max 100 chars)
- city: City in India (max 50 chars)
- state: State in India (max 50 chars)
- zipCode: Postal code (max 10 chars) - include only once if explicitly mentioned, do not repeat
- country: Country (usually "India")

CONTACT INFO:
- phoneNumber: Phone number (max 20 chars)
- email: Email address (max 100 chars)
- websiteUrl: Official website URL (max 200 chars)
- twitterUrl: Twitter/X profile URL (max 200 chars)
- facebookUrl: Facebook profile URL (max 200 chars)

FINANCIAL:
- netWorth: Net worth approximated in crores rupees (string, max 50 chars) - only if explicitly mentioned

SEARCH:
- keywords: Array of 3-5 relevant search keywords

RESEARCH INSTRUCTIONS:
- Extract information ONLY from the provided scraped content
- Look for official titles, contact sections, about sections, directories, team pages
- For politicians: Find their official position and constituency
- For departments: Find the official name and purpose
- For government officials: Find their actual name and department
- Extract UNIQUE matching entities only (maximum 8 per chunk) - do not repeat the same person/organization
- Only include information explicitly mentioned in the content
- Use empty string "" for fields you cannot find
- DO NOT include confidence scores or metadata
- Return valid JSON only, no explanations or notes
- For city and state, use the most relevant Indian location mentioned
- Focus on quality over quantity - only extract entities with sufficient information
- If you find the same name multiple times in different contexts, only extract it once with the most complete information
- AVOID repeating the same information multiple times (like zip codes appearing many times)
- Only include zip codes if they are explicitly and uniquely associated with the entity
- DO NOT extract lengthy descriptions or repetitive data

Return your response as a JSON object with an "entities" array containing all found entities.`

      try {
        // Generate structured data using AI for this chunk
        const result = await generateObject({
          model: models.geminiFlash,
          schema: MultipleEntitiesSchema,
          prompt,
        })

        if (result.object && result.object.entities) {
          console.log(
            `Found ${result.object.entities.length} entities in chunk ${i + 1}:`,
            result.object.entities.map((e: { name?: string }) => e.name),
          )
          allEntities.push(...result.object.entities)
        }
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error)
        // Continue with other chunks even if one fails
      }
    }

    console.log(`Total entities found before deduplication: ${allEntities.length}`)
    console.log(
      "All entities before deduplication:",
      allEntities.map((e: unknown) => {
        const entity = e as { name?: string; jobTitle?: string }
        return { name: entity.name, jobTitle: entity.jobTitle }
      }),
    )

    // Validate that we found some entities
    if (allEntities.length === 0) {
      throw new Error("No valid entities generated")
    }

    // Remove duplicates based on name with smarter matching
    const normalizeName = (name: string): string => {
      return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ") // normalize whitespace
        .replace(/[.,-]/g, "") // remove common punctuation
        .replace(/(hon\.?|dr\.?|mr\.?|mrs\.?|ms\.?)\s+/g, "") // remove titles
    }

    const uniqueEntities = allEntities.filter((entity, index, self) => {
      return (
        index ===
        self.findIndex((e) => {
          const entityA = e as { name?: string }
          const entityB = entity as { name?: string }
          const nameA = entityA.name?.toLowerCase().trim() || ""
          const nameB = entityB.name?.toLowerCase().trim() || ""

          if (nameA.length === 0 || nameB.length === 0) return false

          // First try exact match
          if (nameA === nameB) return true

          // Then try normalized match for minor variations
          return normalizeName(nameA) === normalizeName(nameB)
        })
      )
    })

    console.log(`Total entities after deduplication: ${uniqueEntities.length}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log(
      "Unique entities after deduplication:",
      uniqueEntities.map((e: any) => ({ name: e.name, jobTitle: e.jobTitle })),
    )

    // Process and validate each entity
    const validatedEntities = uniqueEntities.map((entity) => {
      const e = entity as {
        name?: string
        description?: string
        jobTitle?: string
        jobResponsibilities?: string
        keywords?: string[]
        streetAddress?: string
        city?: string
        state?: string
        zipCode?: string
        country?: string
        phoneNumber?: string
        email?: string
        websiteUrl?: string
        twitterUrl?: string
        facebookUrl?: string
        netWorth?: string
      }

      return {
        name: e.name?.slice(0, 50) || "",
        description: e.description?.slice(0, 300) || "",
        jobTitle: e.jobTitle?.slice(0, 100) || "",
        jobResponsibilities: e.jobResponsibilities?.slice(0, 100) || "",
        keywords: Array.isArray(e.keywords) ? e.keywords.slice(0, 5) : [],
        streetAddress: e.streetAddress?.slice(0, 100) || "",
        city: e.city?.slice(0, 50) || "",
        state: e.state?.slice(0, 50) || "",
        zipCode: e.zipCode?.slice(0, 10) || "",
        country: e.country?.slice(0, 50) || "India",
        phoneNumber: e.phoneNumber?.slice(0, 20) || "",
        email: formatEmailText(e.email?.slice(0, 100) || ""),
        websiteUrl: e.websiteUrl?.slice(0, 200) || "",
        twitterUrl: e.twitterUrl?.slice(0, 200) || "",
        facebookUrl: e.facebookUrl?.slice(0, 200) || "",
        netWorth: e.netWorth?.slice(0, 50) || "",
      }
    })

    // Add metadata about the scraping
    const responseData = validatedEntities.map((entity) => ({
      ...entity,
      sourceUrl: url,
      scrapedAt: new Date().toISOString(),
      confidence: "medium", // Could be calculated based on data completeness
      parentEntityId: parentEntityId || null,
      entityType: entityType,
    }))

    // Return the validated JSON response
    return Response.json(responseData)
  } catch (error) {
    console.error("Error in URL scraping:", error)

    // Handle specific AI errors
    if (error && typeof error === "object" && "name" in error) {
      const errorName = (error as { name: string }).name

      if (errorName === "AI_NoObjectGeneratedError" || errorName === "AI_JSONParseError") {
        return new Response(
          JSON.stringify({
            error:
              "Unable to extract structured data from this URL. The page might not contain enough information or might be protected.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (errorName === "AI_ContentFilterError") {
        return new Response(
          JSON.stringify({
            error: "Content filter blocked this request. Please try with a different URL.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }

    // Handle validation errors
    if (error instanceof Error && error.message.includes("validation")) {
      return new Response(
        JSON.stringify({
          error: "Invalid data format received. Please try again.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Handle scraping errors
    if (error instanceof Error && error.message.includes("Failed to scrape URL")) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        error:
          "Failed to process scraping request. Please try again or enter information manually.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
