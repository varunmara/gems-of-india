import { z } from "zod"

// Define the structured schema for entity data extraction
export const EntityDataSchema = z.object({
  name: z.string().optional(),
  description: z.string().max(300).optional(),
  jobTitle: z.string().max(100).optional(),
  jobResponsibilities: z.string().max(100).optional(),
  keywords: z.array(z.string()).optional(),
  streetAddress: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  phoneNumber: z.string(),
  email: z.string(),
  websiteUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  netWorth: z.string().optional(),
})

export type EntityData = z.infer<typeof EntityDataSchema>
