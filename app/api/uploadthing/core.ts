import { headers } from "next/headers" // Import headers for auth

import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

import { auth } from "@/lib/auth" // Import authentication

const f = createUploadthing()

const authenticateUser = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user

  if (!user?.id) throw new UploadThingError("Unauthorized")

  return { userId: user.id }
}

export const ourFileRouter = {
  entityLogo: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
    .middleware(authenticateUser)
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl }
    }),

  entityImage: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
    .middleware(authenticateUser)
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
