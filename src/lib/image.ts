/** Scales (width, height) so the long edge is at most `max`, never upscaling. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export interface PreparedImage {
  base64: string
  mimeType: string
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
    // Some browsers cannot decode HEIC; Gemini accepts it directly if it is small enough.
    if (file.size > 15 * 1024 * 1024) throw new Error('This photo format could not be read. Try a JPEG or a screenshot.')
    return { base64: await toBase64(file), mimeType: file.type || 'image/heic', bytes: file.size, width: 0, height: 0 }
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
