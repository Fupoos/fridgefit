import type { FridgeItem } from '../types'

/**
 * Minimal browser client for the Gemini Interactions API (REST, no SDK).
 * The key is supplied by the user at runtime and never leaves their browser
 * except in the request header to Google.
 */
export const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions'
export const DEFAULT_MODEL = 'gemini-3.8-flash'

export type GeminiErrorKind = 'no-key' | 'auth' | 'quota' | 'model' | 'network' | 'malformed'

export class GeminiError extends Error {
  kind: GeminiErrorKind
  constructor(kind: GeminiErrorKind, message: string) {
    super(message)
    this.name = 'GeminiError'
    this.kind = kind
  }
}

export interface GeminiConfig {
  apiKey: string
  model: string
  fetchImpl?: typeof fetch
}

const RECOGNITION_PROMPT = [
  'You are the fridge scanner for FridgeFit, a student nutrition app.',
  'List every distinct FOOD or DRINK item visible in this photo of a fridge.',
  'Map each item to the closest foodId from the allowed list; use "other" if nothing fits and describe it in "label".',
  'Estimate "grams" as the as-bought amount on hand (for liquids, 1 mL = 1 g).',
  'If an item is clearly perishable (fresh meat, opened dairy, leafy greens), estimate "useWithinDays"; otherwise omit it.',
  'Give "confidence" from 0 to 1.',
  'Ignore anything that is not food or drink, such as medication, documents, labels with names, or people.',
].join(' ')

function recognitionSchema(foodIds: string[]) {
  return {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            foodId: { type: 'string', enum: [...foodIds, 'other'] },
            label: { type: 'string' },
            grams: { type: 'integer', minimum: 0, maximum: 5000 },
            useWithinDays: { type: 'integer', minimum: 0, maximum: 60 },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['foodId', 'label', 'grams', 'confidence'],
        },
      },
    },
    required: ['items'],
  }
}

/** Returns the generated text from an Interactions response (or the legacy generateContent shape). */
export function extractOutputText(json: unknown): string {
  const j = json as {
    steps?: { type?: string; content?: { type?: string; text?: string }[] }[]
    output_text?: string
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  if (Array.isArray(j.steps)) {
    const text = j.steps
      .filter((s) => s.type === 'model_output')
      .flatMap((s) => s.content ?? [])
      .filter((c) => c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text)
      .join('')
    if (text) return text
  }
  if (typeof j.output_text === 'string') return j.output_text
  const parts = j.candidates?.[0]?.content?.parts
  if (parts) return parts.map((p) => p.text ?? '').join('')
  return ''
}

function stripFence(text: string): string {
  const m = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return m ? m[1] : text.trim()
}

export function parseRecognition(text: string, foodIds: string[]): FridgeItem[] {
  let data: unknown
  try {
    data = JSON.parse(stripFence(text))
  } catch {
    throw new GeminiError('malformed', 'Gemini did not return valid JSON.')
  }
  const items = (data as { items?: unknown }).items
  if (!Array.isArray(items)) throw new GeminiError('malformed', 'Gemini response had no "items" list.')

  const valid = new Set(foodIds)
  return items
    .filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
    .map((it) => {
      const id = typeof it.foodId === 'string' && valid.has(it.foodId) ? it.foodId : 'other'
      const label = typeof it.label === 'string' && it.label.trim() ? it.label.trim() : String(it.foodId ?? 'Unknown item')
      const grams = typeof it.grams === 'number' && Number.isFinite(it.grams) ? Math.max(0, Math.round(it.grams)) : 0
      const days = typeof it.useWithinDays === 'number' && Number.isFinite(it.useWithinDays) ? Math.round(it.useWithinDays) : null
      const confidence = typeof it.confidence === 'number' ? Math.min(1, Math.max(0, it.confidence)) : undefined
      const item: FridgeItem = { foodId: id, label, grams, useWithinDays: days }
      if (confidence !== undefined) item.confidence = confidence
      return item
    })
}

async function errorFor(res: Response): Promise<GeminiError> {
  let message = `HTTP ${res.status}`
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    if (body.error?.message) message = body.error.message
  } catch {
    /* keep the status text */
  }
  if (res.status === 401 || res.status === 403) return new GeminiError('auth', `API key rejected: ${message}`)
  if (res.status === 429) return new GeminiError('quota', 'Free-tier limit reached. Try again later or use demo mode.')
  if (res.status === 400 && /api key/i.test(message)) return new GeminiError('auth', `API key rejected: ${message}`)
  return new GeminiError('model', `Request failed (${res.status}): ${message}. Check the model name in Settings.`)
}

/** POSTs one interaction and returns the output text. Retries a 400 once without generation_config. */
async function interact(cfg: GeminiConfig, body: Record<string, unknown>): Promise<string> {
  if (!cfg.apiKey.trim()) throw new GeminiError('no-key', 'Add a Gemini API key in Settings, or use demo mode.')
  const doFetch = cfg.fetchImpl ?? fetch

  const send = async (payload: Record<string, unknown>) => {
    try {
      return await doFetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': cfg.apiKey.trim() },
        body: JSON.stringify(payload),
      })
    } catch {
      throw new GeminiError('network', 'Could not reach Gemini. Check your connection or use demo mode.')
    }
  }

  let res = await send(body)
  if (res.status === 400 && 'generation_config' in body) {
    const rest = { ...body }
    delete rest.generation_config
    res = await send(rest)
  }
  if (!res.ok) throw await errorFor(res)
  return extractOutputText(await res.json())
}

export async function recognizeFridge(b64: string, mimeType: string, foodIds: string[], cfg: GeminiConfig): Promise<FridgeItem[]> {
  const body = {
    model: cfg.model,
    store: false,
    generation_config: { thinking_level: 'low' },
    input: [
      { type: 'image', mime_type: mimeType, data: b64 },
      { type: 'text', text: RECOGNITION_PROMPT },
    ],
    response_format: { type: 'text', mime_type: 'application/json', schema: recognitionSchema(foodIds) },
  }

  try {
    return parseRecognition(await interact(cfg, body), foodIds)
  } catch (e) {
    if (!(e instanceof GeminiError) || e.kind !== 'malformed') throw e
    return parseRecognition(await interact(cfg, body), foodIds)
  }
}

/** Cheap round-trip used by the Settings page to check a key and model name. */
export async function testKey(cfg: GeminiConfig): Promise<boolean> {
  await interact(cfg, { model: cfg.model, store: false, input: 'Reply with the single word OK.' })
  return true
}
