import { FOODS } from '../data/foods'
import type { FridgeItem } from '../types'
import { type ImageMediaType, sanitizeItems } from './recognition'

/**
 * Food recognition through the FridgeFit scan server (see worker/), which
 * holds the API key and calls Claude. Only the photo is sent.
 * Set at build time with VITE_SCAN_URL; empty means scanning is unavailable.
 */
export const SCAN_URL: string = import.meta.env.VITE_SCAN_URL ?? ''

export type ScanErrorKind = 'unavailable' | 'network' | 'busy' | 'daily-limit' | 'too-large' | 'refused' | 'malformed' | 'server'

export class ScanError extends Error {
  kind: ScanErrorKind
  /** The server's own error text, shown small under the friendly message to help diagnose failures. */
  detail?: string
  constructor(kind: ScanErrorKind, message: string, detail?: string) {
    super(message)
    this.name = 'ScanError'
    this.kind = kind
    this.detail = detail
  }
}

const FOOD_IDS = FOODS.map((f) => f.id)
const PASSED_THROUGH: ReadonlySet<string> = new Set(['busy', 'daily-limit', 'too-large', 'refused', 'malformed'])

export async function recognizeFridge(
  b64: string,
  mediaType: ImageMediaType,
  opts: { endpoint?: string; fetchImpl?: typeof fetch } = {},
): Promise<FridgeItem[]> {
  const endpoint = opts.endpoint ?? SCAN_URL
  if (!endpoint) throw new ScanError('unavailable', 'Photo scanning is not set up.')
  const send = opts.fetchImpl ?? ((url, init) => fetch(url, init))

  let res: Response
  try {
    res = await send(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image: b64, mediaType }) })
  } catch (e) {
    throw new ScanError('network', 'Could not reach the scan server.', e instanceof Error ? e.message : undefined)
  }

  let data: { items?: unknown; error?: unknown; detail?: unknown } | null = null
  try {
    data = await res.json()
  } catch {
    /* not JSON: handled below */
  }

  if (!res.ok) {
    const code = typeof data?.error === 'string' ? data.error : ''
    const kind = (PASSED_THROUGH.has(code) ? code : 'server') as ScanErrorKind
    throw new ScanError(kind, `Scan failed (${code || res.status}).`, typeof data?.detail === 'string' ? data.detail : `HTTP ${res.status}`)
  }
  const items = sanitizeItems(data?.items, FOOD_IDS)
  if (!items) throw new ScanError('malformed', 'The scan server returned no item list.')
  return items
}
