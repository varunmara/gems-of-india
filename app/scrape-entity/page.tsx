/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { EntityType, entityType } from "@/drizzle/db/schema"
import {
  RiDeleteBinLine,
  RiEditLine,
  RiGlobalLine,
  RiLoader4Line,
  RiPieChart2Line,
  RiRobotLine,
  RiSendPlaneLine,
  RiUserLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { getAllCategories, submitEntity } from "@/app/actions/entities"

interface ScrapedEntityData {
  __id: string
  name: string
  description: string
  jobTitle?: string
  jobResponsibilities?: string
  keywords: string[]
  streetAddress: string
  city: string
  state: string
  zipCode: string
  country: string
  phoneNumber: string
  email: string
  websiteUrl: string
  twitterUrl: string
  facebookUrl: string
  netWorth: string
  sourceUrl: string
  parentEntities: ParentEntity[]
  categories: string[]
  entityType: EntityType
}

interface ParentEntity {
  id: string
  name: string
  entityType: EntityType
}

export default function ScrapeEntityPage() {
  const router = useRouter()

  // State for scraping new entities
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [scrapeUrl, setScrapeUrl] = useState("")
  const [scrapeEntityType, setScrapeEntityType] = useState<EntityType>(entityType.PERSON)

  // State for scraped entities list
  const [scrapedEntities, setScrapedEntities] = useState<ScrapedEntityData[]>([])

  // State for editing entities
  const [editingEntity, setEditingEntity] = useState<ScrapedEntityData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // State for categories and entity search
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [entityOptions, setEntityOptions] = useState<
    { label: string; value: string; entityType: EntityType }[]
  >([])
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)
  const [entitySearchError, setEntitySearchError] = useState<Error | null>(null)

  // Load categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setIsLoadingCategories(true)
    try {
      const data = await getAllCategories()
      setCategories(data)
    } catch (err) {
      console.error("Error fetching categories:", err)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  // Handle entity search for parent entities
  const handleEntitySearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setEntityOptions([])
      return
    }

    setIsLoadingEntities(true)
    setEntitySearchError(null)

    try {
      const response = await fetch(
        `/api/entities?query=${encodeURIComponent(searchQuery)}&type=${entityType.ORGANIZATION}&type=${entityType.DEPARTMENT}`,
      )
      const data = await response.json()

      // Transform the data to match MultiAsyncSelect Option interface
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

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) {
      setScrapeError("Please enter a URL")
      return
    }

    setIsScraping(true)
    setScrapeError(null)

    try {
      const response = await fetch("/api/scrape-entity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: scrapeUrl,
          entityType: scrapeEntityType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape URL")
      }

      // Handle both single entity and multiple entities response
      const entitiesToAdd = Array.isArray(data) ? data : [data]

      // Add default values for parentEntities and categories
      const processedEntities = entitiesToAdd.map((entity) => ({
        ...entity,
        __id: crypto.randomUUID(),
        parentEntities: entity.parentEntities || [],
        categories: entity.categories || [],
      }))

      // Add or update scraped entities list
      setScrapedEntities((prev) => {
        const newIds = processedEntities.map((p) => p.__id)
        // Note: This logic assumes that if you re-scrape a URL, you want to replace ALL entities from that source.
        const filteredPrev = prev.filter((p) => !newIds.includes(p.__id))
        return [...filteredPrev, ...processedEntities]
      })
      setScrapeUrl("")
    } catch (error) {
      console.error("Error scraping:", error)
      setScrapeError(error instanceof Error ? error.message : "Failed to scrape URL")
    } finally {
      setIsScraping(false)
    }
  }

  const handleSubmitEntity = async (entity: ScrapedEntityData) => {
    if (!entity.name || !entity.description) {
      setSubmitError("Name and description are required.")
      return
    }

    if (entity.categories.length === 0) {
      setSubmitError("Please select at least one category.")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const submissionData = {
        name: entity.name,
        description: entity.description,
        entityType: entity.entityType,
        parentEntities: entity.parentEntities,
        jobTitle: entity.jobTitle,
        jobResponsibilities: entity.jobResponsibilities,
        categories: entity.categories,
        keywords: entity.keywords,
        streetAddress: entity.streetAddress,
        city: entity.city,
        state: entity.state,
        zipCode: entity.zipCode,
        country: entity.country,
        phoneNumber: entity.phoneNumber,
        email: entity.email,
        websiteUrl: entity.websiteUrl,
        twitterUrl: entity.twitterUrl,
        facebookUrl: entity.facebookUrl,
        logoUrl: null,
        imageUrl: null,
        netWorth: entity.netWorth,
        featuredOnHomepage: false,
        dailyRanking: 0,
      }

      const result = await submitEntity(submissionData)

      if (!result.success) {
        throw new Error(result.error || "Failed to submit entity")
      }

      // Remove from scraped entities list
      setScrapedEntities((prev) => prev.filter((e) => e.__id !== entity.__id))
      router.push(`/${result.slug}`)
    } catch (error) {
      console.error("Error submitting entity:", error)
      setSubmitError(error instanceof Error ? error.message : "Failed to submit entity")
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteEntity = (id: string) => {
    setScrapedEntities((prev) => prev.filter((e) => e.__id !== id))
  }

  const getEntityTypeIcon = (type: EntityType) => {
    switch (type) {
      case entityType.PERSON:
        return <RiUserLine className="h-4 w-4" />
      case entityType.DEPARTMENT:
        return <RiPieChart2Line className="h-4 w-4" />
      case entityType.ORGANIZATION:
        return <RiPieChart2Line className="h-4 w-4" />
      default:
        return <RiPieChart2Line className="h-4 w-4" />
    }
  }

  // Entity Edit Dialog Component
  const EntityEditDialog = ({
    entity,
    open,
    onOpenChange,
  }: {
    entity: ScrapedEntityData | null
    open: boolean
    onOpenChange: (open: boolean) => void
  }) => {
    const [editData, setEditData] = useState<ScrapedEntityData | null>(null)

    useEffect(() => {
      // Deep copy entity to avoid modifying the original object in the list
      if (entity) {
        setEditData(JSON.parse(JSON.stringify(entity)))
      } else {
        setEditData(null)
      }
    }, [entity])

    if (!entity || !editData) return null

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Entity</DialogTitle>
            <DialogDescription>
              Review and edit the scraped entity information before submitting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editData.name}
                    onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="edit-description">Description *</Label>
                  <Textarea
                    id="edit-description"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe the entity..."
                    className="mt-1"
                    rows={4}
                  />
                </div>

                {editData.jobTitle && (
                  <div>
                    <Label htmlFor="edit-jobTitle">Job Title</Label>
                    <Input
                      id="edit-jobTitle"
                      value={editData.jobTitle}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, jobTitle: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Parent Entity Selection */}
            {editData.entityType !== entityType.ORGANIZATION && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Parent Organizations</h3>
                <div>
                  <Label htmlFor="parent-entities">Parent Organizations</Label>
                  <MultiAsyncSelect
                    value={editData.parentEntities.map((parent) => parent.id)}
                    onValueChange={(value) =>
                      setEditData((prev) => ({
                        ...prev,
                        parentEntities: entityOptions
                          .filter((option) => value.includes(option.value))
                          .map((option) => ({
                            id: option.value,
                            name: option.label,
                            entityType: option.entityType,
                          })),
                      }))
                    }
                    options={entityOptions}
                    onSearch={handleEntitySearch}
                    loading={isLoadingEntities}
                    error={entitySearchError}
                    async={true}
                    modalPopover={true}
                    placeholder="Search for parent organizations..."
                    searchPlaceholder="Search entities..."
                    maxCount={2}
                    clearSearchOnClose={false}
                    labelFunc={(option) => (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(option as any).entityType}
                        </Badge>
                      </div>
                    )}
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    A person can belong to multiple parent organizations.
                  </p>
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Categories *</h3>
              <div>
                <Label className="mb-2 block">
                  Categories ({editData.categories.length}/3 selected)
                </Label>
                {isLoadingCategories ? (
                  <div className="text-muted-foreground flex items-center gap-2">
                    <RiLoader4Line className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : categories.length > 0 ? (
                  <div className="max-h-60 space-y-3 overflow-y-auto rounded-md border p-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${cat.id}`}
                          checked={editData.categories.includes(cat.id)}
                          onCheckedChange={(checked) => {
                            if (checked && editData.categories.length >= 3) {
                              return
                            }
                            setEditData((prev) => ({
                              ...prev,
                              categories: checked
                                ? [...prev.categories, cat.id]
                                : prev.categories.filter((id) => id !== cat.id),
                            }))
                          }}
                        />
                        <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer font-normal">
                          {cat.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No categories available.</p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  Select up to 3 relevant categories for this entity.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={editData.city}
                    onChange={(e) => setEditData((prev) => ({ ...prev, city: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-state">State</Label>
                  <Input
                    id="edit-state"
                    value={editData.state}
                    onChange={(e) => setEditData((prev) => ({ ...prev, state: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editData.phoneNumber}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    value={editData.websiteUrl}
                    onChange={(e) =>
                      setEditData((prev) => ({ ...prev, websiteUrl: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Validation Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="mb-2 font-medium">Validation Check</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {editData.name ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                  <span>Name is required</span>
                </div>
                <div className="flex items-center gap-2">
                  {editData.description ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                  <span>Description is required</span>
                </div>
                <div className="flex items-center gap-2">
                  {editData.categories.length > 0 ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                  <span>At least one category is required</span>
                </div>
                {editData.entityType !== entityType.ORGANIZATION && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>Parent organizations are optional but recommended</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setScrapedEntities((prev) =>
                  prev.map((e) => (e.__id === entity.__id ? editData : e)),
                )
                onOpenChange(false)
              }}
              disabled={!editData.name || !editData.description || editData.categories.length === 0}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Scrape Entity from Website</h1>
        <p className="text-muted-foreground mt-2">
          Extract entity information from government websites automatically
        </p>
      </div>

      {/* Scrape Form */}
      <div className="bg-card mb-8 rounded-lg border p-6">
        <div className="flex flex-col items-end gap-4 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="scrape-url">
              Government Website URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="scrape-url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://example.gov.in/official-page"
              className="mt-1"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Enter a government website URL to extract entity information
            </p>
          </div>

          <div className="w-full sm:w-48">
            <Label htmlFor="entity-type">Entity Type</Label>
            <Select
              value={scrapeEntityType}
              onValueChange={(value) => setScrapeEntityType(value as EntityType)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={entityType.PERSON}>Person</SelectItem>
                <SelectItem value={entityType.DEPARTMENT}>Department</SelectItem>
                <SelectItem value={entityType.ORGANIZATION}>Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleScrape}
            disabled={isScraping || !scrapeUrl.trim()}
            className="w-full sm:w-auto"
          >
            {isScraping ? (
              <>
                <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <RiRobotLine className="mr-2 h-4 w-4" />
                Scrape
              </>
            )}
          </Button>
        </div>

        {scrapeError && (
          <div className="bg-destructive/10 border-destructive/30 text-destructive mt-4 rounded-md border p-3 text-sm">
            {scrapeError}
          </div>
        )}
      </div>

      {/* Scraped Entities Table */}
      {scrapedEntities.length > 0 && (
        <div className="bg-card rounded-lg border">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">Scraped Entities ({scrapedEntities.length})</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Review and manage scraped entities before submission
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scrapedEntities.map((entity) => (
                  <TableRow key={entity.__id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entity.name}</div>
                        {entity.jobTitle && (
                          <div className="text-muted-foreground text-sm">{entity.jobTitle}</div>
                        )}
                        {entity.description && (
                          <div className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                            {entity.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEntityTypeIcon(entity.entityType)}
                        <Badge variant="secondary" className="text-xs">
                          {entity.entityType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {entity.city && entity.state ? `${entity.city}, ${entity.state}` : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {entity.email && (
                          <div className="cursor-pointer text-blue-600 hover:text-blue-800">
                            {entity.email}
                          </div>
                        )}
                        {entity.phoneNumber && <div>{entity.phoneNumber}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={entity.__id}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 underline hover:text-blue-800"
                      >
                        View Source
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingEntity(entity)}
                        >
                          <RiEditLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSubmitEntity(entity)}
                          disabled={isSubmitting}
                        >
                          <RiSendPlaneLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEntity(entity.__id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <RiDeleteBinLine className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {scrapedEntities.length === 0 && (
        <div className="bg-muted/30 rounded-lg border border-dashed p-12 text-center">
          <RiGlobalLine className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-medium">No entities scraped yet</h3>
          <p className="text-muted-foreground mb-4">
            Enter a government website URL above to start scraping entity information
          </p>
        </div>
      )}

      {submitError && (
        <div className="bg-destructive/10 border-destructive/30 text-destructive mt-6 rounded-md border p-3 text-sm">
          {submitError}
        </div>
      )}

      {/* Edit Dialog */}
      <EntityEditDialog
        entity={editingEntity}
        open={!!editingEntity}
        onOpenChange={(open) => !open && setEditingEntity(null)}
      />
    </div>
  )
}
