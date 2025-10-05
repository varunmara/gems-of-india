/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"

import { NextComment } from "@fuma-comment/next"

import { checkCommentRateLimit } from "@/lib/comment-rate-limit"
import { commentAuth, commentStorage } from "@/lib/comment.config"
import { extractTextFromContent } from "@/lib/content-utils"
import { sendDiscordCommentNotification } from "@/lib/discord-notification"

/**
 * Remove all links from the content by transforming the "link" nodes into simple text
 * @param content The JSON content of the comment
 * @returns The modified content without links
 */
function removeLinksFromContent(content: any): any {
  if (!content) return content

  const processNode = (node: any): any => {
    if (!node || typeof node !== "object") return node

    // If it's a link node, transform it into simple text
    if (node.type === "link") {
      // Get the text of the link from its content
      const linkText =
        node.content?.map((child: any) => child.text || "").join("") || node.attrs?.href || ""
      return {
        type: "text",
        text: linkText,
      }
    }

    // Process the marks (links stored as marks)
    if (node.marks && Array.isArray(node.marks)) {
      node.marks = node.marks.filter((mark: any) => mark.type !== "link")
    }

    // Recursive content processing
    if (node.content && Array.isArray(node.content)) {
      node.content = node.content.map(processNode)
    }

    return node
  }

  return processNode(content)
}

/**
 * Process a request by removing links from the content
 * @param req The original request
 * @returns A new request with the cleaned content
 */
async function processRequestWithLinkRemoval(req: NextRequest) {
  try {
    const body = await req.json()

    // Remove the links from the content if present
    if (body && body.content) {
      body.content = removeLinksFromContent(body.content)
    }

    // Create a new request with the modified content
    return new NextRequest(req.url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(body),
    })
  } catch (error) {
    console.error("Error processing request:", error)
    // In case of error, return the original request
    return req
  }
}

// Create standard Fuma Comment handler
const commentHandler = NextComment({
  mention: { enabled: true },
  auth: commentAuth,
  storage: commentStorage,
})

// Intercept POST requests to add Discord notification and rate limiting
export async function POST(req: NextRequest, context: any) {
  try {
    // Get parameters and user session
    const params = await context.params
    const commentParams = params.comment || []
    const session = await commentAuth.getSession(req as any)

    // Check if it's a new comment (only 1 segment = entityId)
    const isNewComment = commentParams.length === 1

    // Only for new comments with authenticated users
    if (isNewComment && session) {
      // Apply rate limiting for comments
      const rateLimit = await checkCommentRateLimit(session.id)

      if (!rateLimit.success) {
        return NextResponse.json(
          {
            message:
              "You've posted too many comments. Please wait a few minutes before adding another one.",
            details: `Rate limit exceeded. You can comment again in ${rateLimit.reset} seconds. You have ${rateLimit.remaining} comments left for this period.`,
            type: "rate_limit_exceeded",
            resetInSeconds: rateLimit.reset,
          },
          { status: 429 },
        )
      }

      // The entity ID is the first segment in commentParams
      const entityId = commentParams[0]

      try {
        // Read the body of the request
        const body = await req.json()

        // Remove the links from the content
        if (body && body.content) {
          body.content = removeLinksFromContent(body.content)

          // Extract comment text and send notification
          const commentText = extractTextFromContent(body.content)

          // Send Discord notification asynchronously
          void sendDiscordCommentNotification(entityId, session.id || "", commentText)
        }

        // Create a new request with the modified content
        const modifiedReq = new NextRequest(req.url, {
          method: req.method,
          headers: req.headers,
          body: JSON.stringify(body),
        })

        // Pass the new request to the handler
        return commentHandler.POST(modifiedReq, context)
      } catch (error) {
        console.error("Error processing comment:", error)
      }
    }

    // For all other cases (no rate limiting), still process the links
    const processedReq = await processRequestWithLinkRemoval(req)
    return commentHandler.POST(processedReq, context)
  } catch (error) {
    console.error("Error intercepting request:", error)
    // In case of error, pass the original request
    return commentHandler.POST(req, context)
  }
}

// Intercept PATCH requests (editing of comments) to also remove links
export async function PATCH(req: NextRequest, context: any) {
  try {
    // Process the request to remove the links
    const processedReq = await processRequestWithLinkRemoval(req)
    return commentHandler.PATCH(processedReq, context)
  } catch (error) {
    console.error("Error intercepting PATCH request:", error)
    // In case of error, pass the original request
    return commentHandler.PATCH(req, context)
  }
}

// Wrap GET method to match Next.js expected types
export async function GET(req: NextRequest, context: { params: Promise<{ comment?: string[] }> }) {
  const params = await context.params
  const transformedContext = {
    params: Promise.resolve({ comment: params.comment || [] }),
  }
  return commentHandler.GET(req, transformedContext)
}

// Wrap DELETE method to match Next.js expected types
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ comment?: string[] }> },
) {
  const params = await context.params
  const transformedContext = {
    params: Promise.resolve({ comment: params.comment || [] }),
  }
  return commentHandler.DELETE(req, transformedContext)
}
