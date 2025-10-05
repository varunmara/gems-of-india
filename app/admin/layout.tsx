import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // verify if the user is logged in and is admin
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user || session?.user.role !== "admin") {
    // redirect to home page if the user is not an admin
    redirect("/")
  }

  return <div>{children}</div>
}
