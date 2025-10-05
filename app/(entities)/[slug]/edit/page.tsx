import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { EntityType } from "@/drizzle/db/schema"

import { auth } from "@/lib/auth"
import { EditEntityForm, ParentEntity } from "@/components/entity/edit-entity-form"
import { getEntityById } from "@/app/actions/entities"
import { getEntityBySlug } from "@/app/actions/entity-details"

interface EditEntityPageProps {
  params: Promise<{ slug: string }>
}

export default async function EditEntityPage({ params }: EditEntityPageProps) {
  // Await params first
  const { slug } = await params

  // Get current user session
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  // Get entity by slug first to get the ID
  const entityData = await getEntityBySlug(slug)

  if (!entityData) {
    notFound()
  }

  // Get full entity data for editing with permission checks
  const entityResult = await getEntityById(entityData.id)

  if (!entityResult.success) {
    if (entityResult.error === "You don't have permission to edit this entity") {
      // You could create a custom 403 page here
      return (
        <div className="mx-auto max-w-4xl p-6">
          <div className="text-center">
            <h1 className="text-destructive mb-4 text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to edit this entity. Only the entity owner can edit
              pending entities, and administrators can edit any entity.
            </p>
            <p className="text-muted-foreground text-sm">
              Entity status: <span className="font-medium">{entityData.status}</span>
            </p>
          </div>
        </div>
      )
    }
    notFound()
  }

  const entity = entityResult.entity

  if (!entity) {
    notFound()
  }

  // Transform entity data to match form interface
  const formData = {
    name: entityResult.entity.name,
    description: entityResult.entity.description || "",
    entityType: entityResult.entity.entityType as EntityType,
    parentEntities: (entityResult.entity.parentEntities as ParentEntity[]) || [],
    jobTitle: entityResult.entity.jobTitle || "",
    jobResponsibilities: entityResult.entity.jobResponsibilities || "",
    categories: entityResult.entity.categories || [],
    keywords: entityResult.entity.keywords || [],
    streetAddress: entityResult.entity.streetAddress || "",
    city: entityResult.entity.city || "",
    state: entityResult.entity.state || "",
    zipCode: entityResult.entity.zipCode || "",
    phoneNumber: entityResult.entity.phoneNumber || "",
    email: entityResult.entity.email || "",
    websiteUrl: entityResult.entity.websiteUrl || "",
    twitterUrl: entityResult.entity.twitterUrl || "",
    facebookUrl: entityResult.entity.facebookUrl || "",
    logoUrl: entityResult.entity.logoUrl || "",
    imageUrl: entityResult.entity.imageUrl || "",
    netWorth: entityResult.entity.netWorth || "",
    featuredOnHomepage: entityResult.entity.featuredOnHomepage || false,
    dailyRanking: entityResult.entity.dailyRanking || 0,
  }

  return (
    <div className="container mx-auto py-8">
      <EditEntityForm entityId={entityData.id} initialData={formData} />
    </div>
  )
}

export async function generateMetadata({ params }: EditEntityPageProps) {
  // Await params first
  const { slug } = await params

  const entityData = await getEntityBySlug(slug)

  if (!entityData) {
    return {
      title: "Entity Not Found",
    }
  }

  return {
    title: `Edit ${entityData.name}`,
    description: `Edit information for ${entityData.name}`,
  }
}
