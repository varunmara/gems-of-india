import { db } from "@/drizzle/db"
import { category } from "@/drizzle/db/schema"

const ENTITY_CATEGORIES = [
  // Government & Public Sector
  { id: "political-party", name: "Political Party" },
  { id: "government-agency", name: "Government Agency" },
  { id: "court", name: "Court" },
  { id: "municipality", name: "Municipality" },
  { id: "school", name: "School" },
  { id: "non-profit", name: "Non-Profit" },
  { id: "government-official", name: "Government Official" },
  { id: "politician", name: "Politician" },
  { id: "police-department", name: "Police Department" },
  { id: "fire-department", name: "Fire Department" },
  // central level
  { id: "central-government", name: "Central Government" },

  // state level
  { id: "state-government", name: "State Government" },

  // local level
  { id: "local-government", name: "Local Government" },
  { id: "gram-panchayat", name: "Gram Panchayat" },
  { id: "municipal-corporation", name: "Municipal Corporation" },
  { id: "tourism", name: "Tourism" },
  { id: "technology", name: "Technology" },
  { id: "community", name: "Community" },
  { id: "healthcare", name: "Healthcare" },
  { id: "education", name: "Education" },
  { id: "infrastructure", name: "Infrastructure" },
  { id: "finance", name: "Finance" },
  { id: "transport", name: "Transport" },
  { id: "energy", name: "Energy" },
  { id: "environment", name: "Environment" },
  { id: "agriculture", name: "Agriculture" },
  { id: "industry", name: "Industry" },
]

const initializeCategories = async () => {
  const data = await db
  const categories = await data.query.category.findMany()
  if (categories.length === 0) {
    await data.insert(category).values(ENTITY_CATEGORIES)
  }
}

try {
  initializeCategories().then(() => {
    console.log("✅ Categories initialized successfully!")
  })
} catch (error) {
  console.error("❌ Error initializing categories:", error)
}
