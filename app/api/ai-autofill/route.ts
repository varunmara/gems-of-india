import { generateObject } from "ai"

import { models } from "@/lib/ai"
import { EntityDataSchema } from "@/lib/schemas"

export async function POST(request: Request) {
  try {
    const { entityName, entityType } = await request.json()

    if (!entityName?.trim()) {
      return new Response("Entity name is required", { status: 400 })
    }

    // Create the AI prompt for structured data extraction
    const currentYear = new Date().getFullYear()
    const entityTypeContext = entityType ? `Entity type: ${entityType}. ` : ""

    const prompt = `You are researching a specific person or organization. The search term is: "${entityName}"

${entityTypeContext}Current year: ${currentYear}

IMPORTANT: Do NOT use the search term as the name. Research and find the ACTUAL person or organization.

For example:
- If searching "madakasira mla" → Find the actual MLA from Madakasira constituency (like whoever is the current MLA of that constituency)
- If searching "prime minister of india" → Find the actual Prime Minister of India
- If searching "tata motors" → Find the actual company Tata Motors
- If searching "delhi cm" → Find the actual Chief Minister of Delhi (like whoever is the current Chief Minister of Delhi)

Research and provide the following information in valid JSON format:

BASIC INFO:
- name: ACTUAL full official name of the person/organization (max 50 chars)
- description: Brief description of their role/position (max 300 chars)
- jobTitle: Current job title/position (max 100 chars)
- jobResponsibilities: Key responsibilities and duties (max 100 chars)

LOCATION:
- streetAddress: Street address if available (max 100 chars)
- city: City in India (REQUIRED)
- state: State in India (max 50 chars)
- zipCode: Postal code (max 10 chars)
- country: Country (usually "India")

CONTACT INFO:
- phoneNumber: Phone number (max 20 chars) (REQUIRED)
- email: Email address (max 100 chars) (REQUIRED)
- websiteUrl: Official website URL (max 200 chars)
- twitterUrl: Twitter/X profile URL (max 200 chars)
- facebookUrl: Facebook profile URL (max 200 chars)

FINANCIAL:
- netWorth: Net worth approximated in crores rupees (number)

SEARCH:
- keywords: Array of 3-5 relevant search keywords

RESEARCH INSTRUCTIONS:
- Search for the ACTUAL person/organization, not the search term
- Look up official records, news articles, government websites
- For politicians: Find their real name, constituency, current position
- For companies: Find official company name, headquarters, CEO details
- For government officials: Find their actual name and department
- Research thoroughly for contact information (phone, email, social media)
- Look for official websites, press releases, and public records
- Only include verified, publicly available information
- Use empty string "" for fields you cannot find
- Return valid JSON only, no explanations or notes`

    // Generate structured data using Gemini Flash
    const result = await generateObject({
      model: models.geminiFlash,
      schema: EntityDataSchema,
      prompt,
    })

    // Validate the response
    if (!result.object) {
      throw new Error("No valid object generated")
    }

    // Ensure all required fields are present and within limits
    const validatedData = {
      name: result.object.name?.slice(0, 50) || "",
      description: result.object.description?.slice(0, 300) || "",
      jobTitle: result.object.jobTitle?.slice(0, 100) || "",
      jobResponsibilities: result.object.jobResponsibilities?.slice(0, 100) || "",
      keywords: Array.isArray(result.object.keywords) ? result.object.keywords.slice(0, 5) : [],
      streetAddress: result.object.streetAddress?.slice(0, 100) || "",
      city: result.object.city?.slice(0, 50) || "",
      state: result.object.state?.slice(0, 50) || "",
      zipCode: result.object.zipCode?.slice(0, 10) || "",
      country: result.object.country?.slice(0, 50) || "",
      phoneNumber: result.object.phoneNumber?.slice(0, 20) || "",
      email: result.object.email?.slice(0, 100) || "",
      websiteUrl: result.object.websiteUrl?.slice(0, 200) || "",
      twitterUrl: result.object.twitterUrl?.slice(0, 200) || "",
      facebookUrl: result.object.facebookUrl?.slice(0, 200) || "",
      netWorth: result.object.netWorth?.slice(0, 50) || "",
    }

    // Return the validated JSON response
    return Response.json(validatedData)
  } catch (error) {
    console.error("Error in AI auto-fill:", error)

    // Handle specific AI errors
    if (error && typeof error === "object" && "name" in error) {
      const errorName = (error as { name: string }).name

      if (errorName === "AI_NoObjectGeneratedError" || errorName === "AI_JSONParseError") {
        return new Response(
          JSON.stringify({
            error:
              "Unable to generate valid data for this entity. Please try with a more specific name or provide information manually.",
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
            error: "Content filter blocked this request. Please try with a different entity name.",
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

    return new Response(
      JSON.stringify({
        error:
          "Failed to process auto-fill request. Please try again or provide information manually.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
