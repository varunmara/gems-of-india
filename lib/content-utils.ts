/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Utils for handling content in comments
 */

/**
 * Extracts text from the rich content of Fuma Comment
 * @param content Rich content in JSON format
 * @returns Text extracted from the content
 */
export function extractTextFromContent(content: any): string {
  if (!content) return ""

  // Recursive function to extract text
  const extractText = (node: any): string => {
    if (typeof node === "string") return node
    if (!node) return ""

    // If it's a text node
    if (node.text) return node.text

    // If it's an image node
    if (node.type === "image") {
      return "[Image]"
    }

    // If it's a mention
    if (node.type === "mention") {
      return `@${node.attrs?.label || node.attrs?.id || "unknown"}`
    }

    // Recursion for nested contents
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join("")
    }

    return ""
  }

  return extractText(content)
}
