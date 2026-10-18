/** The last scanned photo, kept in memory only (never written to storage). */
let previewUrl: string | null = null

export function setPreview(url: string | null) {
  previewUrl = url
}

export function getPreview(): string | null {
  return previewUrl
}
