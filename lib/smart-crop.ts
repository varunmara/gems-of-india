import SmartCrop from "smartcrop"

interface CropOptions {
  width: number
  height: number
  quality?: number
}

export async function smartCropImage(
  imageUrl: string,
  options: CropOptions = { width: 256, height: 256, quality: 0.9 },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      SmartCrop.crop(canvas, { width: options.width, height: options.height })
        .then((result) => {
          const crop = result.topCrop

          // Create output canvas with target dimensions
          const outputCanvas = document.createElement("canvas")
          const outputCtx = outputCanvas.getContext("2d")

          if (!outputCtx) {
            reject(new Error("Could not get output canvas context"))
            return
          }

          outputCanvas.width = options.width
          outputCanvas.height = options.height

          // Draw cropped and resized image
          outputCtx.drawImage(
            canvas,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            options.width,
            options.height,
          )

          // Convert to blob and create URL
          outputCanvas.toBlob(
            (blob) => {
              if (blob) {
                const croppedUrl = URL.createObjectURL(blob)
                resolve(croppedUrl)
              } else {
                reject(new Error("Could not create blob from canvas"))
              }
            },
            "image/jpeg",
            options.quality,
          )
        })
        .catch(reject)
    }

    img.onerror = () => {
      reject(new Error("Could not load image"))
    }

    img.src = imageUrl
  })
}

export async function smartCropImageFile(
  file: File,
  options: CropOptions = { width: 256, height: 256, quality: 0.9 },
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      // Clean up the object URL
      URL.revokeObjectURL(url)

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      SmartCrop.crop(canvas, { width: options.width, height: options.height })
        .then((result) => {
          const crop = result.topCrop

          // Create output canvas with target dimensions
          const outputCanvas = document.createElement("canvas")
          const outputCtx = outputCanvas.getContext("2d")

          if (!outputCtx) {
            reject(new Error("Could not get output canvas context"))
            return
          }

          outputCanvas.width = options.width
          outputCanvas.height = options.height

          // Draw cropped and resized image
          outputCtx.drawImage(
            canvas,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            options.width,
            options.height,
          )

          // Convert to blob
          outputCanvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Could not create blob from canvas"))
              }
            },
            "image/jpeg",
            options.quality,
          )
        })
        .catch(reject)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not load image"))
    }

    img.src = url
  })
}

export function revokeObjectURL(url: string) {
  URL.revokeObjectURL(url)
}
