"use client"

import { useCallback, useState } from "react"

import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Upload, XCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ImportResult {
  summary: {
    total: number
    successful: number
    failed: number
  }
  results: Array<{
    row: number
    name: string
    entityId: string
    slug: string
    status: string
  }>
  errors: Array<{
    row: number
    name?: string
    error: string
  }>
}

export default function ImportEntitiesPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          setUploadProgress(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const result: ImportResult = JSON.parse(xhr.responseText)
          setImportResult(result)
        } else {
          const errorResponse = JSON.parse(xhr.responseText)
          setError(errorResponse.error || "Upload failed")
        }
        setIsUploading(false)
        setUploadProgress(0)
      }

      xhr.onerror = () => {
        setError("Network error occurred during upload")
        setIsUploading(false)
        setUploadProgress(0)
      }

      xhr.open("POST", "/api/entities/import")
      xhr.send(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during upload")
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    disabled: isUploading,
  })

  const downloadTemplate = () => {
    const templateData = [
      {
        name: "Example Person",
        description: "A government official responsible for municipal administration",
        entityType: "person",
        streetAddress: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        zipCode: "400001",
        phoneNumber: "+91 22 1234 5678",
        email: "official@example.com",
        websiteUrl: "https://example.com",
        netWorth: "50",
        keywords: "administration, governance, public service",
      },
      {
        name: "Example Department",
        description: "Government department responsible for public health services",
        entityType: "department",
        streetAddress: "456 Government Plaza",
        city: "Delhi",
        state: "Delhi",
        zipCode: "110001",
        phoneNumber: "+91 11 2345 6789",
        email: "health.dept@example.com",
        websiteUrl: "https://health.example.com",
        keywords: "healthcare, public health, medical services",
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Entities")
    XLSX.writeFile(workbook, "entities-import-template.xlsx")
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Import Entities</h1>
        <p className="text-muted-foreground mt-2">
          Upload an Excel file to import multiple entities at once. Each row in the Excel file will
          create one entity.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload Excel File
            </CardTitle>
            <CardDescription>
              Upload an Excel file with entity data. Supported formats: .xlsx, .xls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div
                  {...getRootProps()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  {isDragActive ? (
                    <p className="text-lg font-medium">Drop the Excel file here...</p>
                  ) : (
                    <div>
                      <p className="mb-2 text-lg font-medium">
                        Drag and drop your Excel file here, or click to browse
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Supports .xlsx and .xls files (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uploading and processing...</span>
                    <span className="text-muted-foreground text-sm">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {importResult && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{importResult.summary.total}</div>
                    <div className="text-muted-foreground text-sm">Total Rows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.summary.successful}
                    </div>
                    <div className="text-muted-foreground text-sm">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResult.summary.failed}
                    </div>
                    <div className="text-muted-foreground text-sm">Failed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {importResult.results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Successfully Imported ({importResult.results.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {importResult.results.map((result) => (
                      <div
                        key={result.entityId}
                        className="flex items-center justify-between rounded-lg bg-green-50 p-3"
                      >
                        <div>
                          <div className="font-medium">{result.name}</div>
                          <div className="text-muted-foreground text-sm">
                            Row {result.row} • Slug: {result.slug}
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Success
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {importResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Import Errors ({importResult.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between rounded-lg bg-red-50 p-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {error.name ? `Row ${error.row}: ${error.name}` : `Row ${error.row}`}
                          </div>
                          <div className="mt-1 text-sm text-red-600">{error.error}</div>
                        </div>
                        <Badge variant="destructive">Error</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="mb-2 font-semibold">Required Columns:</h4>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>name:</strong> Entity name (required)
                  </li>
                  <li>
                    <strong>description:</strong> Entity description (required)
                  </li>
                  <li>
                    <strong>entityType:</strong> Type of entity (required)
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Optional Columns:</h4>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>streetAddress:</strong> Street address
                  </li>
                  <li>
                    <strong>city:</strong> City name
                  </li>
                  <li>
                    <strong>state:</strong> State name
                  </li>
                  <li>
                    <strong>zipCode:</strong> Postal code
                  </li>
                  <li>
                    <strong>phoneNumber:</strong> Phone number
                  </li>
                  <li>
                    <strong>email:</strong> Email address
                  </li>
                  <li>
                    <strong>websiteUrl:</strong> Website URL
                  </li>
                  <li>
                    <strong>netWorth:</strong> Net worth (for persons)
                  </li>
                  <li>
                    <strong>keywords:</strong> Comma-separated keywords
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Valid Entity Types:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">person</Badge>
                  <Badge variant="outline">department</Badge>
                  <Badge variant="outline">organization</Badge>
                  <Badge variant="outline">infrastructure</Badge>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Note</AlertTitle>
                <AlertDescription>
                  Images and parent entities are not supported in Excel imports. You can add these
                  later through the entity edit interface.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
