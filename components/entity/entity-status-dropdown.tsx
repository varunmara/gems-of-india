"use client"

import { useState } from "react"

import { ChevronDown, Shield } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateEntityStatus } from "@/app/actions/entity-details"

interface EntityStatusDropdownProps {
  entityId: string
  currentStatus: string
  isAdmin: boolean
  onStatusUpdate?: () => void
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    color: "text-yellow-600",
  },
  in_review: {
    label: "In Review",
    variant: "default" as const,
    color: "text-blue-600",
  },
  published: {
    label: "Published",
    variant: "default" as const,
    color: "text-green-600",
  },
}

export function EntityStatusDropdown({
  entityId,
  currentStatus,
  isAdmin,
  onStatusUpdate,
}: EntityStatusDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [status, setStatus] = useState(currentStatus)

  if (!isAdmin) {
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Badge variant={config?.variant || "secondary"} className={config?.color}>
        {config?.label || status}
      </Badge>
    )
  }

  const handleStatusUpdate = async (newStatus: "pending" | "in_review" | "published") => {
    if (newStatus === status) return

    setIsUpdating(true)
    try {
      const result = await updateEntityStatus(entityId, newStatus)

      if (result.success) {
        setStatus(newStatus)
        toast.success("Entity status updated successfully")
        onStatusUpdate?.()
      } else {
        toast.error(result.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    } finally {
      setIsUpdating(false)
    }
  }

  const currentConfig = statusConfig[status as keyof typeof statusConfig]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isUpdating} className="gap-2">
          <Shield className="h-4 w-4" />
          <span className={currentConfig?.color}>{currentConfig?.label || status}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(statusConfig).map(([statusKey, config]) => (
          <DropdownMenuItem
            key={statusKey}
            onClick={() => handleStatusUpdate(statusKey as "pending" | "in_review" | "published")}
            disabled={isUpdating || statusKey === status}
          >
            <span className={config.color}>{config.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
