import fs from "fs"
import path from "path"

// Function to calculate the reading time of an article
export function calculateReadingTime(content: string): string {
  // Remove MDX/HTML tags and frontmatter
  const cleanContent = content
    .replace(/^---[\s\S]*?---/, "") // Remove frontmatter
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\{[^}]*\}/g, "") // Remove JSX components
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove markdown links but keep the text
    .replace(/[#*`_~]/g, "") // Remove markdown syntax
    .replace(/\s+/g, " ") // Normalize spaces
    .trim()

  // Count the words
  const words = cleanContent.split(/\s+/).filter((word) => word.length > 0)
  const wordCount = words.length

  // Calculate the reading time (average: 200 words per minute)
  const wordsPerMinute = 200
  const minutes = Math.ceil(wordCount / wordsPerMinute)

  return `${minutes} min`
}

// Function to read the content of an MDX file and calculate the reading time
export async function getReadingTimeForArticle(slug: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "content", "blog", `${slug}.mdx`)
    const content = fs.readFileSync(filePath, "utf8")
    return calculateReadingTime(content)
  } catch (error) {
    console.warn(`Failed to calculate reading time for ${slug}:`, error)
    return "5 min" // Fallback default
  }
}
