"use server"

import { db } from "@/drizzle/db"
import { roleAssignment } from "@/drizzle/db/schema"
import { z } from "zod"

const addRoleAssignmentSchema = z.object({
  personId: z.string(),
  orgId: z.string(),
  title: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  responsibilities: z.string().optional(),
  metadata: z.any().optional(),
})

export async function addRoleAssignment(data: z.infer<typeof addRoleAssignmentSchema>) {
  const validatedData = addRoleAssignmentSchema.parse(data)

  await db.insert(roleAssignment).values({
    id: crypto.randomUUID(),
    ...validatedData,
  })
}
