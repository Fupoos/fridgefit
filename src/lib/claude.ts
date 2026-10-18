import Anthropic from '@anthropic-ai/sdk'
import type { FridgeItem } from '../types'

/**
 * Food recognition with Claude, called straight from the browser with the
 * user's own API key (kept on this device). Only the photo is sent.
 */
export const DEFAULT_MODEL = 'claude-opus-5-5'

export type ClaudeErrorKind = 'no-key' | 'auth' | 'credits' | 'quota' | 'model' | 'network' | 'malformed' | 'refused'

export class ClaudeError extends Error {
  kind: ClaudeErrorKind
  constructor(kind: ClaudeErrorKind, message: string) {
    super(message)
    this.name = 'ClaudeError'
    this.kind = kind
  }
}

export interface ClaudeConfig {
  apiKey: string
  model: string
  fetchImpl?: typeof fetch
  maxRetries?: number
}

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

const RECOGNITION_PROMPT = [
  'You are the fridge scanner for FridgeFit, a student nutrition app.',
  'List every distinct FOOD or DRINK item visible in this photo of a fridge.',
  'Map each item to the closest foodId from the allowed list; use "other" if nothing fits and describe it in "label".',
  'Estimate "grams" as the as-bought amount on hand (for liquids, 1 mL = 1 g).',
  'If an item is clearly perishable (fresh meat, opened dairy, leafy greens), estimate "useWithinDays" in days; otherwise omit it.',
  'Give "confidence" from 0 to 1.',
  'Ignore anything that is not food or drink, such as medication, documents, labels with names, or people.',
].join(' ')

/** Uses only JSON Schema features structured outputs supports (no numeric min/max). */
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
            grams: { type: 'integer', description: 'Amount on hand in grams, 0 to 5000' },
            useWithinDays: { type: 'integer', description: 'Days until it should be eaten' },
            confidence: { type: 'number', description: 'From 0 to 1' },
          },
          required: ['foodId', 'label', 'grams', 'confidence'],
          additionalProperties: false,
        },
      },
    },
    required: ['items'],
    additionalProperties: false,
  }
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
    throw new ClaudeError('malformed', 'Claude did not return valid JSON.')
  }
  const items = (data as { items?: unknown }).items
  if (!Array.isArray(items)) throw new ClaudeError('malformed', 'Claude response had no "items" list.')

  const valid = new Set(foodIds)
  return items
    .filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
    .map((it) => {
      const raw = typeof it.foodId === 'string' ? it.foodId.toLowerCase() : ''
      const id = valid.has(raw) ? raw : 'other'
      const label = typeof it.label === 'string' && it.label.trim() ? it.label.trim() : String(it.foodId ?? 'Unknown item')
      const grams = typeof it.grams === 'number' && Number.isFinite(it.grams) ? Math.min(5000, Math.max(0, Math.round(it.grams))) : 0
      const days = typeof it.useWithinDays === 'number' && Number.isFinite(it.useWithinDays) ? Math.max(0, Math.round(it.useWithinDays)) : null
      const confidence = typeof it.confidence === 'number' ? Math.min(1, Math.max(0, it.confidence)) : undefined
      const item: FridgeItem = { foodId: id, label, grams, useWithinDays: days }
      if (confidence !== undefined) item.confidence = confidence
      return item
    })
}

function client(cfg: ClaudeConfig): Anthropic {
  if (!cfg.apiKey.trim()) throw new ClaudeError('no-key', 'Add a Claude API key in Settings, or use a sample fridge.')
  return new Anthropic({
    apiKey: cfg.apiKey.trim(),
    dangerouslyAllowBrowser: true,
    maxRetries: cfg.maxRetries ?? 1,
    ...(cfg.fetchImpl ? { fetch: cfg.fetchImpl } : {}),
  })
}

/** Turns SDK errors into the app's error kinds (most specific first). */
function toClaudeError(e: unknown): ClaudeError {
  if (e instanceof ClaudeError) return e
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return new ClaudeError('auth', 'Claude rejected the API key.')
  }
  if (e instanceof Anthropic.RateLimitError) return new ClaudeError('quota', 'Too many requests. Wait a minute and try again.')
  if (e instanceof Anthropic.NotFoundError) return new ClaudeError('model', 'That model name was not found. Check it in Settings.')
  if (e instanceof Anthropic.BadRequestError) {
    if (/credit balance/i.test(e.message)) return new ClaudeError('credits', 'Your API credit has run out.')
    return new ClaudeError('model', `Claude rejected the request: ${e.message}`)
  }
  if (e instanceof Anthropic.APIConnectionError) return new ClaudeError('network', 'Could not reach Claude. Check your connection.')
  if (e instanceof Anthropic.APIError) return new ClaudeError('model', `Claude error ${e.status ?? ''}: ${e.message}`)
  return new ClaudeError('network', e instanceof Error ? e.message : 'Unknown error')
}

async function recognizeOnce(api: Anthropic, b64: string, mediaType: ImageMediaType, foodIds: string[], model: string): Promise<FridgeItem[]> {
  const response = await api.beta.messages.create({
    model,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: recognitionSchema(foodIds) } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } },
          { type: 'text', text: RECOGNITION_PROMPT },
        ],
      },
    ],
  })

  if (response.stop_reason === 'refusal') throw new ClaudeError('refused', 'Claude declined to read this photo.')
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  return parseRecognition(text, foodIds)
}

export async function recognizeFridge(b64: string, mediaType: ImageMediaType, foodIds: string[], cfg: ClaudeConfig): Promise<FridgeItem[]> {
  const api = client(cfg)
  try {
    try {
      return await recognizeOnce(api, b64, mediaType, foodIds, cfg.model)
    } catch (e) {
      if (!(e instanceof ClaudeError) || e.kind !== 'malformed') throw e
      return await recognizeOnce(api, b64, mediaType, foodIds, cfg.model)
    }
  } catch (e) {
    throw toClaudeError(e)
  }
}

/** Checks the key and model name with the Models API (no tokens used). */
export async function testKey(cfg: ClaudeConfig): Promise<boolean> {
  const api = client(cfg)
  try {
    await api.models.retrieve(cfg.model)
    return true
  } catch (e) {
    throw toClaudeError(e)
  }
}
