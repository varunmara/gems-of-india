"use client"

import Link from "next/link"

import { RiPencilLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

interface EditButtonProps {
  entitySlug: string
  canEdit: boolean
}

export function EditButton({ entitySlug, canEdit }: EditButtonProps) {
  if (!canEdit) {
    return null
  }

  return (
    <Button variant="outline" size="sm" className="h-9" asChild>
      <Link href={`/${entitySlug}/edit`}>
        <RiPencilLine className="mr-1 h-4 w-4" />
        Edit Entity
      </Link>
    </Button>
  )
}
