/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { useEffect, useId, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { EntityType, entityType } from "@/drizzle/db/schema"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBuildingLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiFileCheckLine,
  RiGovernmentLine,
  RiImageAddLine,
  RiInformation2Line,
  RiInformationLine,
  RiListCheck,
  RiLoader4Line,
  RiMapPinLine,
  RiRobotLine,
  RiRocketLine,
  RiUserLine,
} from "@remixicon/react"
import { Tag, TagInput } from "emblor"

import { INDIAN_STATES } from "@/lib/constants"
import { smartCropImageFile } from "@/lib/smart-crop"
import { UploadButton } from "@/lib/uploadthing"
import { useAutoFill } from "@/hooks/use-auto-fill"
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
import { getAllCategories, submitEntity } from "@/app/actions/entities"

import { RichTextDisplay, RichTextEditor } from "../ui/rich-text-editor"
import { Textarea } from "../ui/textarea"

interface EntityFormData {
  name: string
  description: string
  entityType: EntityType
  parentEntities: ParentEntity[] // Changed to array for multiple parent entities
  jobTitle?: string
  jobResponsibilities?: string
  categories: string[]
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
  logoUrl: string | null
  imageUrl: string | null
  netWorth: string
  featuredOnHomepage: boolean
  dailyRanking: number
}

interface ParentEntity {
  id: string
  name: string
  entityType: EntityType
}

export function SubmitEntityFormNew() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<EntityFormData>({
    name: "",
    description: "",
    jobTitle: "",
    jobResponsibilities: "",
    parentEntities: [] as ParentEntity[],
    entityType: entityType.PERSON,
    categories: [],
    keywords: [],
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phoneNumber: "",
    email: "",
    websiteUrl: "",
    twitterUrl: "",
    facebookUrl: "",
    netWorth: "",
    logoUrl: null,
    imageUrl: null,
    featuredOnHomepage: false,
    dailyRanking: 0,
  })

  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null)

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingEntityImage, setIsUploadingEntityImage] = useState(false)

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const tagInputId = useId()

  const [keywordsTags, setKeywordsTags] = useState<Tag[]>([])
  const [activeKeywordTagIndex, setActiveKeywordTagIndex] = useState<number | null>(null)

  // State for async entity loading
  const [entityOptions, setEntityOptions] = useState<
    { label: string; value: string; entityType: EntityType }[]
  >([])
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)
  const [entitySearchError, setEntitySearchError] = useState<Error | null>(null)

  // AI Auto-fill functionality
  const { isAutoFilling, autoFillError, triggerAutoFill } = useAutoFill({
    onAutoFillComplete: (data) => {
      // Populate form with AI-extracted data
      const updatedFormData = {
        ...formData,
        name: data.name || formData.name,
        description: data.description || formData.description,
        jobTitle: data.jobTitle || formData.jobTitle,
        jobResponsibilities: data.jobResponsibilities || formData.jobResponsibilities,
        keywords: data.keywords || formData.keywords,
        streetAddress: data.streetAddress || formData.streetAddress,
        city: data.city || formData.city,
        state: data.state || formData.state,
        zipCode: data.zipCode || formData.zipCode,
        country: data.country || formData.country,
        phoneNumber: data.phoneNumber || formData.phoneNumber,
        email: data.email || formData.email,
        websiteUrl: data.websiteUrl || formData.websiteUrl,
        twitterUrl: data.twitterUrl || formData.twitterUrl,
        facebookUrl: data.facebookUrl || formData.facebookUrl,
        netWorth: data.netWorth || formData.netWorth,
      }
      setFormData(updatedFormData)

      // Count populated fields for user feedback
      const populatedFields = Object.entries(data).filter(
        ([, value]) => value && value !== "" && value !== null && value !== undefined,
      ).length

      if (populatedFields > 0) {
        // You could add a toast notification here if you have a toast system
      }
    },
    onError: (errorMessage) => {
      setError(errorMessage)
    },
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const tagsFromFormData = formData.keywords.map((keyword, index) => ({
      id: `${index}-${keyword}`,
      text: keyword,
    }))
    if (JSON.stringify(tagsFromFormData) !== JSON.stringify(keywordsTags)) {
      setKeywordsTags(tagsFromFormData)
    }
  }, [formData.keywords])

  useEffect(() => {
    const keywordsStringArray = keywordsTags.map((tag) => tag.text)
    if (JSON.stringify(keywordsStringArray) !== JSON.stringify(formData.keywords)) {
      setFormData((prev) => ({ ...prev, keywords: keywordsStringArray }))
    }
  }, [keywordsTags])

  async function fetchCategories() {
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

  const nextStep = () => {
    setError(null)

    if (currentStep === 1) {
      if (!formData.name || !formData.description || !formData.entityType) {
        setError("Please fill in all required basic information.")
        return
      }

      if (formData.entityType === entityType.PERSON) {
        if (!formData.jobTitle || !formData.jobResponsibilities) {
          setError("For persons, job title and responsibilities are required.")
          return
        }
      }

      if (formData.entityType !== entityType.ORGANIZATION && formData.parentEntities.length === 0) {
        setError("Please select at least one parent entity.")
        return
      }
    }

    if (currentStep === 2) {
      if (formData.categories.length === 0) {
        setError("Please select at least one category and add keywords.")
        return
      }
    }

    if (currentStep === 3) {
      if (!formData.city) {
        setError("City is required.")
        return
      }
      if (!INDIAN_STATES.includes(formData.state) || !formData.state) {
        setError("State is required and must be a valid Indian state.")
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4))
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 0)
  }

  const prevStep = () => {
    setError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 0)
  }

  const handleFinalSubmit = async () => {
    if (!formData.name || !formData.description || formData.categories.length === 0) {
      setError("Please complete all required fields.")
      return
    }

    setIsPending(true)
    setError(null)

    try {
      // Logo URL is already processed and cropped
      const finalLogoUrl = uploadedLogoUrl || null

      const entityData = {
        name: formData.name,
        description: formData.description,
        websiteUrl: formData.websiteUrl,
        logoUrl: finalLogoUrl,
        imageUrl: formData.imageUrl || null,
        categories: formData.categories,
        keywords: formData.keywords,
        parentEntities: formData.parentEntities,
        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
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

      const submissionResult = await submitEntity(entityData)

      if (!submissionResult.success || !submissionResult.entityId || !submissionResult.slug) {
        throw new Error(submissionResult.error || "Failed to submit entity.")
      }

      router.push(`/${submissionResult.slug}`)
    } catch (submissionError: unknown) {
      console.error("Error during final submission:", submissionError)
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "An unexpected error occurred.",
      )
      setIsPending(false)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    handleFinalSubmit()
  }

  const renderStepper = () => (
    <div className="mb-8 sm:mb-10">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-between pt-2 sm:px-4 sm:pt-0">
          {[
            { step: 1, label: "Basic Info", icon: RiInformation2Line },
            { step: 2, label: "Categories", icon: RiListCheck },
            { step: 3, label: "Contact", icon: RiMapPinLine },
            { step: 4, label: "Review", icon: RiFileCheckLine },
          ].map(({ step, label, icon: Icon }) => (
            <div
              key={`step-${step}`}
              className="relative flex w-[120px] flex-col items-center sm:w-[140px]"
            >
              {step < 4 && (
                <div className="absolute top-5 left-[calc(50%+1.5rem)] -z-10 hidden h-[2px] w-[calc(100%-1rem)] sm:block">
                  <div
                    className={`h-full ${
                      currentStep > step ? "bg-primary" : "bg-muted"
                    } transition-all duration-300`}
                  />
                </div>
              )}

              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 sm:h-12 sm:w-12 ${
                  currentStep > step
                    ? "bg-primary ring-primary/10 text-white ring-4"
                    : currentStep === step
                      ? "bg-primary ring-primary/20 text-white ring-4"
                      : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {currentStep > step ? (
                  <RiCheckLine className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                )}

                {currentStep === step && (
                  <span className="border-primary absolute inset-0 animate-pulse rounded-full border-2" />
                )}
              </div>

              <div className="mt-3 w-full text-center sm:mt-4">
                <span
                  className={`mb-0.5 block text-xs font-medium sm:text-sm ${
                    currentStep >= step ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 px-2 sm:mt-6 sm:px-4">
        <div className="bg-muted/50 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )

  const handleCheckboxChange = (
    field: "categories" | "keywords",
    value: string,
    checked: boolean,
  ) => {
    setFormData((prev) => {
      const currentValues = prev[field] || []
      if (checked) {
        return { ...prev, [field]: [...currentValues, value] }
      } else {
        return {
          ...prev,
          [field]: currentValues.filter((item) => item !== value),
        }
      }
    })
  }

  const getCategoryName = (id: string) => categories.find((cat) => cat.id === id)?.name || id

  const getEntityTypeIcon = (type: EntityType) => {
    switch (type) {
      case entityType.PERSON:
        return <RiUserLine className="h-4 w-4" />
      case entityType.DEPARTMENT:
        return <RiBuildingLine className="h-4 w-4" />
      case entityType.ORGANIZATION:
        return <RiGovernmentLine className="h-4 w-4" />
      default:
        return <RiInformation2Line className="h-4 w-4" />
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
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
              <div className="flex items-center justify-between">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (formData.name.trim()) {
                      triggerAutoFill(formData.name, formData.entityType)
                    } else {
                      setError("Please enter a name first")
                    }
                  }}
                  disabled={isAutoFilling || !formData.name.trim()}
                  className="text-xs"
                >
                  {isAutoFilling ? (
                    <RiLoader4Line className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <RiRobotLine className="mr-1 h-3 w-3" />
                  )}
                  Auto-Fill with AI
                </Button>
              </div>
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
              {autoFillError && <p className="text-destructive mt-1 text-xs">{autoFillError}</p>}
              <p className="text-muted-foreground mt-1 text-xs">
                Enter a name and click &quot;Auto-Fill&quot; to automatically populate form data
                using AI
              </p>
            </div>

            <div>
              <Label htmlFor="parentEntity">
                Parent Organizations <span className="text-red-500">*</span>
              </Label>
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
              <p className="text-muted-foreground mt-1 text-xs">
                A person can belong to multiple parent organizations.
              </p>
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

            <div className="space-y-4">
              <div>
                <Label htmlFor="logoUrl">
                  Logo/Profile Image{" "}
                  <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <p className="text-muted-foreground text-xs">
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
                        console.log("Upload Response (Logo):", res)
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
            </div>
            <div className="space-y-2">
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
                    onClick={() => setFormData((prev) => ({ ...prev, imageUrl: null }))}
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
                      console.log("Upload Begin (Logo)")
                      setIsUploadingEntityImage(true)
                      setError(null)
                    }}
                    onClientUploadComplete={(res) => {
                      console.log("Upload Response (Logo):", res)
                      setIsUploadingEntityImage(false)
                      if (res && res.length > 0 && res[0].url) {
                        setFormData((prev) => ({
                          ...prev,
                          imageUrl: res[0].ufsUrl,
                        }))
                        console.log("Logo URL set:", res[0].ufsUrl)
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
        )

      case 2:
        return (
          <div className="space-y-8">
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
                          handleCheckboxChange("categories", cat.id, !!checked)
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

            <div>
              <Label htmlFor={tagInputId}>
                Keywords/Tags
                <span className="text-muted-foreground ml-2 text-xs">
                  ({formData.keywords.length}/10 keywords)
                </span>
              </Label>
              <TagInput
                id={tagInputId}
                tags={keywordsTags}
                setTags={(newTags) => {
                  if (newTags.length > 10) {
                    setError("You can add a maximum of 10 keywords.")
                    return
                  }
                  setKeywordsTags(newTags)
                }}
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
              <p className="text-muted-foreground mt-1 text-xs">
                Add relevant keywords that describe this entity&apos;s functions, jurisdiction, or
                expertise.
              </p>
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
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h4 className="font-medium">Address Information</h4>

                <div>
                  <Label htmlFor="streetAddress">Street Address</Label>
                  <Input
                    id="streetAddress"
                    placeholder="Enter street address"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>

                  <Input
                    id="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
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
                    placeholder="Enter postal code"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    disabled={true}
                    placeholder="India"
                    value="India"
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Contact & Social</h4>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Enter phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    placeholder="Enter official website URL"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="twitterUrl">Twitter/X Profile URL</Label>
                  <Input
                    id="twitterUrl"
                    placeholder="Enter Twitter/X profile URL"
                    value={formData.twitterUrl}
                    onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="facebookUrl">Facebook Profile URL</Label>
                  <Input
                    id="facebookUrl"
                    placeholder="Enter Facebook profile URL"
                    value={formData.facebookUrl}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <RiCheckLine className="h-5 w-5" />
              <h3 className="text-lg font-medium">Review and Submit</h3>
            </div>

            <div className="bg-card overflow-hidden rounded-lg border">
              <div className="space-y-6 p-6">
                <div>
                  <h4 className="mb-3 border-b pb-2 text-base font-semibold">Entity Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      {getEntityTypeIcon(formData.entityType)}
                      <span>
                        <strong>Type:</strong>{" "}
                        {formData.entityType.charAt(0).toUpperCase() + formData.entityType.slice(1)}
                      </span>
                    </div>
                    <p>
                      <strong>Name:</strong> {formData.name}
                    </p>
                    {formData.parentEntities.length > 0 && (
                      <p>
                        <strong>Parent Entities:</strong>{" "}
                        {formData.parentEntities.map((parent) => parent.name).join(", ")}
                      </p>
                    )}
                    {formData.jobTitle && (
                      <p>
                        <strong>Job Title:</strong> {formData.jobTitle}
                      </p>
                    )}
                    {formData.jobResponsibilities && (
                      <p>
                        <strong>Responsibilities:</strong> {formData.jobResponsibilities}
                      </p>
                    )}
                    <div className="w-full">
                      <strong>Description:</strong>
                      <RichTextDisplay content={formData.description} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 border-b pb-2 text-base font-semibold">Contact & Social</h4>
                  <div className="space-y-3 text-sm">
                    {formData.websiteUrl && (
                      <p>
                        <strong>Website:</strong>{" "}
                        <a
                          href={formData.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formData.websiteUrl}
                        </a>
                      </p>
                    )}
                    {formData.email && (
                      <p>
                        <strong>Email:</strong> {formData.email}
                      </p>
                    )}
                    {formData.phoneNumber && (
                      <p>
                        <strong>Phone:</strong> {formData.phoneNumber}
                      </p>
                    )}
                    {formData.streetAddress ||
                    formData.city ||
                    formData.state ||
                    formData.zipCode ||
                    formData.country ? (
                      <p>
                        <strong>Address:</strong>{" "}
                        {[
                          formData.streetAddress,
                          formData.city,
                          formData.state,
                          formData.zipCode,
                          formData.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <h4 className="mb-3 border-b pb-2 text-base font-semibold">
                    Categories & Keywords
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Categories:</strong>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.categories.map((catId) => (
                          <Badge key={catId} variant="secondary">
                            {getCategoryName(catId)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong>Keywords:</strong>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {formData.keywords.map((keyword) => (
                          <Badge key={keyword} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {uploadedLogoUrl && (
                  <div>
                    <h4 className="mb-3 border-b pb-2 text-base font-semibold">Images</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-4">
                        <div>
                          <strong>Logo:</strong>
                          <Image
                            src={uploadedLogoUrl}
                            alt="Uploaded logo"
                            width={48}
                            height={48}
                            className="mt-1 rounded border"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {formData.imageUrl && (
                  <p className="flex flex-col items-start gap-2">
                    <strong>Product Image:</strong>
                    <Image
                      src={formData.imageUrl}
                      alt="Entity image"
                      width={128}
                      height={128}
                      className="rounded border object-cover"
                    />
                  </p>
                )}
              </div>

              <div className="bg-muted/30 border-t px-6 py-4">
                <div className="flex items-start gap-3">
                  <RiInformationLine className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Ready to submit?</p>
                    <p className="text-muted-foreground text-xs">
                      Please review all information carefully. Once submitted, your entity will be
                      added to the database and can be rated by the community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {renderStepper()}

      {renderStepContent()}

      {error && (
        <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-md border p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={
            currentStep === 1 ||
            isPending ||
            isUploadingLogo ||
            isUploadingEntityImage ||
            isAutoFilling
          }
        >
          <RiArrowLeftLine className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={isPending || isUploadingLogo || isUploadingEntityImage || isAutoFilling}
          >
            Next
            <RiArrowRightLine className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isPending || isUploadingLogo || isUploadingEntityImage || isAutoFilling}
          >
            {isPending ? (
              <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RiRocketLine className="mr-2 h-4 w-4" />
            )}
            Submit Entity
          </Button>
        )}
      </div>
    </form>
  )
}
