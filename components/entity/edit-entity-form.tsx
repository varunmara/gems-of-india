"use client"

import { useCallback, useEffect, useId, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { EntityType, entityType } from "@/drizzle/db/schema"
import { RiCloseCircleLine, RiImageAddLine, RiLoader4Line, RiRocketLine } from "@remixicon/react"
import { Tag, TagInput } from "emblor"

import { INDIAN_STATES } from "@/lib/constants"
import { smartCropImageFile } from "@/lib/smart-crop"
import { UploadButton } from "@/lib/uploadthing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { getAllCategories, updateEntity } from "@/app/actions/entities"

import { RichTextEditor } from "../ui/rich-text-editor"
import { Textarea } from "../ui/textarea"

interface EntityFormData {
  name: string
  description: string
  entityType: EntityType
  parentEntities: ParentEntity[]
  jobTitle?: string
  jobResponsibilities?: string
  categories: string[]
  keywords: string[]
  streetAddress: string
  city: string
  state: string
  zipCode: string
  phoneNumber: string
  email: string
  websiteUrl: string
  twitterUrl: string
  facebookUrl: string
  logoUrl: string | null
  imageUrl: string | null
  netWorth: string
  featuredOnHomepage: boolean
  dailyRanking: number
}

export interface ParentEntity {
  id: string
  name: string
  entityType: EntityType
}

interface EditEntityFormProps {
  entityId: string
  initialData: EntityFormData
}

export function EditEntityForm({ entityId, initialData }: EditEntityFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<EntityFormData>(initialData)

  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(initialData.logoUrl)
  const [uploadedEntityImage, setUploadedEntityImage] = useState<string | null>(
    initialData.imageUrl,
  )
  const [isUploadingEntityImage, setIsUploadingEntityImage] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const tagInputId = useId()
  const [keywordsTags, setKeywordsTags] = useState<Tag[]>(
    initialData.keywords.map((keyword, index) => ({
      id: `${index}-${keyword}`,
      text: keyword,
    })),
  )
  const [activeKeywordTagIndex, setActiveKeywordTagIndex] = useState<number | null>(null)

  // State for async entity loading
  const [entityOptions, setEntityOptions] = useState<
    { label: string; value: string; entityType: EntityType }[]
  >([])
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)
  const [entitySearchError, setEntitySearchError] = useState<Error | null>(null)

  // Event handlers and utility functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true)
    try {
      const data = await getAllCategories()
      setCategories(data)
    } catch (err) {
      console.error("Error fetching categories:", err)
      setError("Failed to load categories")
    } finally {
      setIsLoadingCategories(false)
    }
  }, [])

  // Initialize with current data
  useEffect(() => {
    fetchCategories()

    // Initialize entity options with current parent entities
    if (initialData.parentEntities.length > 0) {
      setEntityOptions(
        initialData.parentEntities.map((parent) => ({
          label: parent.name,
          value: parent.id,
          entityType: parent.entityType,
        })),
      )
    }

    // Update uploaded logo URL from initial data
    setUploadedLogoUrl(initialData.logoUrl)
    setUploadedEntityImage(initialData.imageUrl)
  }, [fetchCategories, initialData.parentEntities, initialData.logoUrl, initialData.imageUrl])

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

  const handleFinalSubmit = async () => {
    if (
      !formData.name ||
      !formData.description ||
      !formData.websiteUrl ||
      formData.categories.length === 0 ||
      formData.keywords.length === 0
    ) {
      setError("Please complete all required fields.")
      return
    }

    setIsPending(true)
    setError(null)

    try {
      // Remove placeholder logic - just use uploaded logo or null
      const finalLogoUrl = uploadedLogoUrl || null

      const entityData = {
        name: formData.name,
        description: formData.description,
        websiteUrl: formData.websiteUrl,
        logoUrl: finalLogoUrl,
        imageUrl: uploadedEntityImage || null,
        categories: formData.categories,
        keywords: formData.keywords,
        parentEntities: formData.parentEntities,
        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        twitterUrl: formData.twitterUrl || "",
        facebookUrl: formData.facebookUrl || "",
        netWorth: formData.netWorth || "",
        featuredOnHomepage: formData.featuredOnHomepage || false,
        dailyRanking: formData.dailyRanking || 0,
        entityType: formData.entityType,
        jobTitle: formData.jobTitle || "",
        jobResponsibilities: formData.jobResponsibilities || "",
      }

      const updateResult = await updateEntity(entityId, entityData)

      if (!updateResult.success || !updateResult.entityId || !updateResult.slug) {
        throw new Error(updateResult.error || "Failed to update entity.")
      }

      router.push(`/${updateResult.slug}`)
    } catch (submissionError: unknown) {
      console.error("Error during update:", submissionError)
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "An unexpected error occurred.",
      )
      setIsPending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Entity</h1>
        <p className="text-muted-foreground mt-2">
          Update the information for this entity. Changes will be saved and reflected on the entity
          page.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleFinalSubmit()
        }}
        className="space-y-8"
      >
        {/* Basic Information */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
          <div className="space-y-6">
            <div>
              <Label htmlFor="entityType">
                Entity Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.entityType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    entityType: value as EntityType,
                  }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an entity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={entityType.PERSON}>Person (Government Official)</SelectItem>
                  <SelectItem value={entityType.DEPARTMENT}>Department</SelectItem>
                  <SelectItem value={entityType.ORGANIZATION}>Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={
                  formData.entityType === entityType.PERSON
                    ? "e.g., John Doe, Municipal Commissioner"
                    : "e.g., Municipal Corporation, Health Department"
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="parentEntity">Parent Organizations</Label>
              <MultiAsyncSelect
                value={formData.parentEntities.map((parent) => parent.id)}
                onValueChange={(value) =>
                  setFormData((prev) => ({
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
                placeholder="Search for parent organizations..."
                searchPlaceholder="Search entities..."
                maxCount={2}
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
            </div>

            {formData.entityType === entityType.PERSON && (
              <>
                <div>
                  <Label htmlFor="jobTitle">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder="e.g., Municipal Commissioner, District Collector"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="jobResponsibilities">
                    Job Responsibilities <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="jobResponsibilities"
                    name="jobResponsibilities"
                    value={formData.jobResponsibilities}
                    onChange={handleInputChange}
                    placeholder="Describe the key responsibilities and duties of this position..."
                    required
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <RichTextEditor
                content={formData.description}
                onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
                placeholder="Give a paragraph about the Gem including networth, interesing detailsPlease share details about the gem:

If it’s an individual (babu/official): Include net worth, background, career highlights, and any other interesting facts the public should know.

If it’s a department/organization: Provide as much structured information as possible.

👉 Make the content informative, neatly arranged, and well-formatted.
👉 Use tools like ChatGPT (or similar) to generate a rich text display with:

✅ Bullet points

🔹 Icons/emojis for clarity

📝 Clean sections for readability, etc."
                className="max-h-[300px] overflow-y-auto"
              />
            </div>

            <div>
              <Label htmlFor="logoUrl">
                Logo/Profile Image <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <p className="text-muted-foreground mb-2 text-xs">
                Recommended: 1:1 square image (e.g., 256x256px). If not provided, initials will be
                used.
              </p>
              {uploadedLogoUrl ? (
                <div className="bg-muted/30 relative w-fit rounded-md border p-3">
                  <Image
                    src={uploadedLogoUrl}
                    alt="Logo preview"
                    width={64}
                    height={64}
                    className="rounded object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground absolute top-1 right-1 h-6 w-6"
                    onClick={() => setUploadedLogoUrl(null)}
                    aria-label="Remove logo"
                  >
                    <RiCloseCircleLine className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <UploadButton
                    endpoint="entityLogo"
                    onBeforeUploadBegin={async (files) => {
                      const file = files[0]
                      if (file && file.type.startsWith("image/")) {
                        try {
                          console.log("Starting smart crop for logo...")
                          const croppedBlob = await smartCropImageFile(file, {
                            width: 256,
                            height: 256,
                          })
                          const croppedFile = new File([croppedBlob], file.name, {
                            type: "image/jpeg",
                          })
                          console.log(
                            "Smart crop completed. Original size:",
                            file.size,
                            "Cropped size:",
                            croppedFile.size,
                          )
                          return [croppedFile]
                        } catch (error) {
                          console.error("Smart crop failed:", error)
                          setError("Image processing failed. Using original image.")
                          return files
                        }
                      }
                      return files
                    }}
                    onUploadBegin={() => {
                      setIsUploadingLogo(true)
                      setError(null)
                    }}
                    onClientUploadComplete={(res) => {
                      setIsUploadingLogo(false)
                      if (res && res.length > 0 && res[0].ufsUrl) {
                        setUploadedLogoUrl(res[0].ufsUrl)
                      } else {
                        setError("Logo upload failed: No URL returned.")
                      }
                    }}
                    onUploadError={(error: Error) => {
                      setIsUploadingLogo(false)
                      setError(`Logo upload failed: ${error.message}`)
                    }}
                    appearance={{
                      button: `ut-button border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm h-9 px-3 inline-flex items-center justify-center gap-2 ${isUploadingLogo ? "opacity-50 pointer-events-none" : ""}`,
                      allowedContent: "hidden",
                    }}
                    content={{
                      button({ ready, isUploading }) {
                        if (isUploading) return <RiLoader4Line className="h-4 w-4 animate-spin" />
                        if (ready)
                          return (
                            <>
                              <RiImageAddLine className="h-4 w-4" /> Upload Logo
                            </>
                          )
                        return "Getting ready..."
                      },
                    }}
                  />
                  {isUploadingLogo && (
                    <span className="text-muted-foreground text-xs">Uploading...</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="imageUrl">
                Entity Image (like infrastructure, government building, etc.)<span>(Optional)</span>
              </Label>
              <p className="text-muted-foreground text-xs">
                Add a entity image. Recommended: 16:9 aspect ratio (e.g., 800x450px).
              </p>
              {formData.imageUrl ? (
                <div className="bg-muted/30 relative w-fit rounded-md border p-3">
                  <Image
                    src={formData.imageUrl}
                    alt="Entity image preview"
                    width={256}
                    height={256}
                    className="rounded object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground absolute top-1 right-1 h-6 w-6"
                    onClick={() => setUploadedEntityImage(null)}
                    aria-label="Remove entity image"
                  >
                    <RiCloseCircleLine className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <UploadButton
                    endpoint="entityImage"
                    onUploadBegin={() => {
                      setIsUploadingEntityImage(true)
                      setError(null)
                    }}
                    onClientUploadComplete={(res) => {
                      setIsUploadingEntityImage(false)
                      if (res && res.length > 0 && res[0].ufsUrl) {
                        setUploadedEntityImage(res[0].ufsUrl)
                      } else {
                        console.error("Entity image upload failed: No URL", res)
                        setError("Entity image upload failed: No URL returned.")
                      }
                    }}
                    onUploadError={(error: Error) => {
                      console.error("Upload Error (Entity Image):", error)
                      setIsUploadingEntityImage(false)
                      setError(`Entity image upload failed: ${error.message}`)
                    }}
                    appearance={{
                      button: `ut-button flex items-center w-fit gap-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm h-9 px-3 ${isUploadingEntityImage ? "opacity-50 pointer-events-none" : ""}`,
                      allowedContent: "hidden",
                    }}
                    content={{
                      button({ ready, isUploading }) {
                        if (isUploading) return <RiLoader4Line className="h-4 w-4 animate-spin" />
                        if (ready)
                          return (
                            <>
                              <RiImageAddLine className="h-4 w-4" /> Add Entity Image
                            </>
                          )
                        return "Getting ready..."
                      },
                    }}
                  />
                  {isUploadingEntityImage && (
                    <span className="text-muted-foreground text-xs">Uploading...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories & Keywords */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Categories & Keywords</h2>
          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">
                Categories <span className="text-red-500">*</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  ({formData.categories.length}/3 selected)
                </span>
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
                        checked={formData.categories.includes(cat.id)}
                        onCheckedChange={(checked) => {
                          if (checked && formData.categories.length >= 3) {
                            setError("You can select a maximum of 3 categories.")
                            return
                          }
                          const currentValues = formData.categories
                          if (checked) {
                            setFormData((prev) => ({
                              ...prev,
                              categories: [...currentValues, cat.id],
                            }))
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              categories: currentValues.filter((item) => item !== cat.id),
                            }))
                          }
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
            </div>

            <div>
              <Label htmlFor={tagInputId}>
                Keywords/Tags <span className="text-red-500">*</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  ({formData.keywords.length}/10 keywords)
                </span>
              </Label>
              <TagInput
                id={tagInputId}
                tags={keywordsTags}
                setTags={setKeywordsTags}
                placeholder="Type keywords and press Enter (e.g., governance, infrastructure, healthcare)..."
                styleClasses={{
                  inlineTagsContainer:
                    "border-input rounded-md bg-background shadow-xs transition-[color,box-shadow] focus-within:border-ring outline-none focus-within:ring-[3px] focus-within:ring-ring/50 p-1 gap-1 mt-1",
                  input: "w-full min-w-[80px] shadow-none px-2 h-7",
                  tag: {
                    body: "h-7 relative bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7",
                    closeButton:
                      "absolute -inset-y-px -end-px p-0 rounded-e-md flex size-7 transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-muted-foreground/80 hover:text-foreground",
                  },
                }}
                activeTagIndex={activeKeywordTagIndex}
                setActiveTagIndex={setActiveKeywordTagIndex}
              />
            </div>

            {formData.entityType === entityType.PERSON && (
              <div>
                <Label htmlFor="netWorth">Net Worth (Optional)</Label>
                <Input
                  id="netWorth"
                  name="netWorth"
                  type="number"
                  value={formData.netWorth}
                  onChange={handleInputChange}
                  placeholder="Enter net worth in crores"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  This information helps in transparency and accountability assessments.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact & Social Information */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Contact & Social Information</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Address Information</h4>

              <div>
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  name="streetAddress"
                  placeholder="Enter street address"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a state" />
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
                <Label htmlFor="zipCode">Postal Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  placeholder="Enter postal code"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Contact & Social</h4>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="websiteUrl">
                  Website URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  placeholder="Enter official website URL"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="twitterUrl">Twitter/X Profile URL</Label>
                <Input
                  id="twitterUrl"
                  name="twitterUrl"
                  type="url"
                  placeholder="Enter Twitter/X profile URL"
                  value={formData.twitterUrl}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="facebookUrl">Facebook Profile URL</Label>
                <Input
                  id="facebookUrl"
                  name="facebookUrl"
                  type="url"
                  placeholder="Enter Facebook profile URL"
                  value={formData.facebookUrl}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-md border p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || isUploadingLogo}>
            {isPending ? (
              <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RiRocketLine className="mr-2 h-4 w-4" />
            )}
            Update Entity
          </Button>
        </div>
      </form>
    </div>
  )
}
