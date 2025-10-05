/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { ReviewAttribute } from "@/drizzle/db/schema"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

interface AttributeInputProps {
  attribute: ReviewAttribute
  value: any
  onChange: (attributeId: string, value: any) => void
  error?: string
  className?: string
}

export function AttributeInput({
  attribute,
  value,
  onChange,
  error,
  className,
}: AttributeInputProps) {
  const metadata = (attribute.metadata as any) || {}

  const handleScaleChange = (newValue: number[]) => {
    onChange(attribute.id, { score: newValue[0] })
  }

  const handleBooleanChange = (checked: boolean) => {
    onChange(attribute.id, { value: checked })
  }

  const renderInput = () => {
    switch (attribute.attributeType) {
      case "scale":
        const scaleValue = value?.score || metadata.min || 1
        return (
          <div className="space-y-4">
            <div className="px-2">
              <Slider
                value={[scaleValue]}
                onValueChange={handleScaleChange}
                min={metadata.min || 1}
                max={metadata.max || 10}
                step={metadata.step || 1}
                className="w-full"
              />
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>Poor ({metadata.min || 1})</span>
              <Badge variant="outline" className="text-sm font-medium">
                {scaleValue}/{metadata.max || 10}
              </Badge>
              <span>Excellent ({metadata.max || 10})</span>
            </div>
          </div>
        )

      case "boolean":
        const boolValue = value?.value || false
        return (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {boolValue ? metadata.trueLabel : metadata.falseLabel}
              </div>
              <div className="text-muted-foreground text-xs">
                Tap to {boolValue ? "disagree" : "agree"}
              </div>
            </div>
            <Switch checked={boolValue} onCheckedChange={handleBooleanChange} className="ml-4" />
          </div>
        )

      default:
        return (
          <div className="text-muted-foreground text-sm">
            Unsupported attribute type: {attribute.attributeType}
          </div>
        )
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Label className="text-foreground text-sm font-medium">
            {attribute.label}
            {attribute.isRequired && <span className="ml-1 text-red-500">*</span>}
          </Label>
          {attribute.description && (
            <p className="text-muted-foreground text-xs">{attribute.description}</p>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {attribute.category.replace("_", " ")}
        </Badge>
      </div>

      {renderInput()}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
