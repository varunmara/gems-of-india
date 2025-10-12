"use client"

import { useEffect, useState } from "react"

import { EntityType } from "@/drizzle/db/schema"
import { toast } from "sonner"

import { INDIAN_STATES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiAsyncSelect } from "@/components/ui/multi-async-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { assignModeratorScope, changeUserRole, getModeratorScopeInfo } from "@/app/actions/admin"

type User = {
  id: string
  name: string
  email: string
  role?: string
}

type ScopeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess: () => void
}

export function AssignModeratorScopeDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ScopeDialogProps) {
  const [scopeType, setScopeType] = useState<"all" | "state" | "city" | "entity">("all")
  const [selectedState, setSelectedState] = useState<string>("")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedEntityId, setSelectedEntityId] = useState<string>("")
  const [entityOptions, setEntityOptions] = useState<
    { label: string; value: string; entityType: EntityType }[]
  >([])
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)
  const [entitySearchError, setEntitySearchError] = useState<Error | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingScope, setIsLoadingScope] = useState(false)

  // Load existing scope when editing a moderator
  useEffect(() => {
    if (open && user?.role === "moderator") {
      setIsLoadingScope(true)
      getModeratorScopeInfo(user.id)
        .then((result) => {
          if (result.success && result.scope) {
            const scope = result.scope
            setScopeType(scope.scopeType as "all" | "state" | "city" | "entity")

            if (scope.scopeType === "state" && scope.state) {
              setSelectedState(scope.state)
            } else if (scope.scopeType === "city" && scope.city && scope.state) {
              setSelectedCity(scope.city)
              setSelectedState(scope.state)
            } else if (scope.scopeType === "entity" && scope.entityId) {
              setSelectedEntityId(scope.entityId)
              // Pre-load the entity in options
              fetch(`/api/entities/${scope.entityId}`)
                .then((res) => res.json())
                .then((entity) => {
                  setEntityOptions([
                    {
                      label: entity.name,
                      value: entity.id,
                      entityType: entity.entityType,
                    },
                  ])
                })
                .catch(console.error)
            }
          }
        })
        .catch((error) => {
          console.error("Failed to load moderator scope:", error)
        })
        .finally(() => {
          setIsLoadingScope(false)
        })
    } else if (open) {
      // Reset form when opening for non-moderator
      setScopeType("all")
      setSelectedState("")
      setSelectedCity("")
      setSelectedEntityId("")
      setEntityOptions([])
    }
  }, [open, user])

  const handleEntitySearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setEntityOptions([])
      return
    }

    setIsLoadingEntities(true)
    setEntitySearchError(null)

    try {
      const response = await fetch(`/api/entities?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      const transformedOptions = data.map(
        (entity: { id: string; name: string; entityType: EntityType }) => ({
          label: entity.name,
          value: entity.id,
          entityType: entity.entityType,
        }),
      )

      setEntityOptions(transformedOptions)
    } catch (error) {
      console.error("Error fetching entities:", error)
      setEntitySearchError(new Error("Failed to fetch entities"))
    } finally {
      setIsLoadingEntities(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    // Validation
    if (scopeType === "state" && !selectedState) {
      toast.error("Please select a state")
      return
    }
    if (scopeType === "city" && (!selectedCity || !selectedState)) {
      toast.error("Please enter city and select state")
      return
    }
    if (scopeType === "entity" && !selectedEntityId) {
      toast.error("Please select an entity")
      return
    }

    setIsSubmitting(true)

    try {
      // If user is not already a moderator, promote them first
      if (user.role !== "moderator") {
        const roleResult = await changeUserRole(user.id, "moderator")
        if (!roleResult.success) {
          toast.error("Failed to promote user to moderator")
          setIsSubmitting(false)
          return
        }
      }

      // Assign the scope
      const scopeData = {
        scopeType,
        entityId: scopeType === "entity" ? selectedEntityId : undefined,
        state: scopeType === "state" || scopeType === "city" ? selectedState : undefined,
        city: scopeType === "city" ? selectedCity : undefined,
      }

      const result = await assignModeratorScope(user.id, scopeData)

      if (result.success) {
        toast.success(
          user.role === "moderator"
            ? "Moderator scope updated successfully"
            : "User promoted to moderator successfully",
        )
        onSuccess()
        onOpenChange(false)
        // Reset form
        setScopeType("all")
        setSelectedState("")
        setSelectedCity("")
        setSelectedEntityId("")
      } else {
        toast.error(result.error || "Failed to assign moderator scope")
      }
    } catch (error) {
      console.error("Error assigning moderator scope:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {user.role === "moderator" ? "Edit Moderator Scope" : "Assign Moderator Role & Scope"}
          </DialogTitle>
          <DialogDescription>
            {user.role === "moderator"
              ? `Update moderation scope for ${user.name}`
              : `Promote ${user.name} to moderator and assign their moderation scope.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoadingScope ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">Loading current scope...</div>
            </div>
          ) : (
            <>
              <div>
                <Label className="mb-3">Scope Type</Label>
                <RadioGroup
                  value={scopeType}
                  onValueChange={(v) => setScopeType(v as typeof scopeType)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="cursor-pointer font-normal">
                      All entities (Full moderator access)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="state" id="state" />
                    <Label htmlFor="state" className="cursor-pointer font-normal">
                      Specific state
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="city" id="city" />
                    <Label htmlFor="city" className="cursor-pointer font-normal">
                      Specific city
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="entity" id="entity" />
                    <Label htmlFor="entity" className="cursor-pointer font-normal">
                      Specific entity
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {scopeType === "state" && (
                <div>
                  <Label htmlFor="state-select">Select State</Label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger id="state-select">
                      <SelectValue placeholder="Choose a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Moderator will be able to edit all entities in{" "}
                    {selectedState || "the selected state"}
                  </p>
                </div>
              )}

              {scopeType === "city" && (
                <>
                  <div>
                    <Label htmlFor="state-select-city">Select State</Label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger id="state-select-city">
                        <SelectValue placeholder="Choose a state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city-input">Enter City</Label>
                    <Input
                      id="city-input"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      placeholder="e.g., Mumbai, Bangalore"
                    />
                    <p className="text-muted-foreground mt-1 text-xs">
                      Moderator will be able to edit all entities in {selectedCity || "the city"},{" "}
                      {selectedState || "state"}
                    </p>
                  </div>
                </>
              )}

              {scopeType === "entity" && (
                <div>
                  <Label>Select Entity</Label>
                  <MultiAsyncSelect
                    value={selectedEntityId ? [selectedEntityId] : []}
                    onValueChange={(values) => setSelectedEntityId(values[0] || "")}
                    options={entityOptions}
                    onSearch={handleEntitySearch}
                    loading={isLoadingEntities}
                    error={entitySearchError}
                    async={true}
                    placeholder="Search for an entity..."
                    searchPlaceholder="Type to search entities..."
                    maxCount={1}
                    clearSearchOnClose={false}
                    labelFunc={(option) => (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {
                            (option as { label: string; value: string; entityType: EntityType })
                              .entityType
                          }
                        </Badge>
                      </div>
                    )}
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    Moderator will be able to edit this entity and all its children
                  </p>
                </div>
              )}

              {scopeType === "all" && (
                <div className="bg-muted/50 rounded-md border p-3">
                  <p className="text-muted-foreground text-sm">
                    This moderator will have permission to edit any entity in the system.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isLoadingScope}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingScope}>
            {isSubmitting
              ? "Saving..."
              : user.role === "moderator"
                ? "Update Scope"
                : "Assign Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
