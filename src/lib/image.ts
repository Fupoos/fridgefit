/** Scales (width, height) so the long edge is at most `max`, never upscaling. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** Error message thrown when the browser cannot decode the photo; the UI translates it. */
export const UNREADABLE_PHOTO = 'unreadable-photo'

export interface PreparedImage {
  base64: string
  mimeType: 'image/jpeg'
  bytes: number
  width: number
  height: number
}

/**
 * Downscales a photo to a JPEG with the long edge at `maxEdge` px.
 * Re-encoding through a canvas also drops EXIF metadata such as GPS location.
 */
export async function prepareImage(file: File, maxEdge = 1024, quality = 0.8): Promise<PreparedImage> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Claude accepts JPEG/PNG/GIF/WebP only, so a photo the browser cannot decode (e.g. some HEIC) cannot be sent.
    throw new Error(UNREADABLE_PHOTO)
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not compress the photo.'))), 'image/jpeg', quality),
  )
  return { base64: await toBase64(blob), mimeType: 'image/jpeg', bytes: blob.size, width, height }
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
