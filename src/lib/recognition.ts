import type { FridgeItem } from '../types'

/**
 * What FridgeFit asks Claude for and how it reads the answer. Shared by the
 * scan server (which calls Claude) and the app (which re-checks the result),
 * so it must not depend on the DOM or the Anthropic SDK.
 */
export const MODEL = 'claude-opus-5-5'

/** Caps the cost of one call: thinking plus the JSON for a full fridge fits well inside this. */
export const MAX_TOKENS = 5000

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
export const IMAGE_MEDIA_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const RECOGNITION_PROMPT = [
  'You are the fridge scanner for FridgeFit, a student nutrition app.',
  'List every distinct FOOD or DRINK item visible in this photo of a fridge.',
  'Map each item to the closest foodId from the allowed list; use "other" if nothing fits and describe it in "label".',
  'Estimate "grams" as the as-bought amount on hand (for liquids, 1 mL = 1 g).',
  'If an item is clearly perishable (fresh meat, opened dairy, leafy greens), estimate "useWithinDays" in days; otherwise omit it.',
  'Give "confidence" from 0 to 1.',
  'Ignore anything that is not food or drink, such as medication, documents, labels with names, or people.',
].join(' ')

/** Uses only JSON Schema features structured outputs supports (no numeric min/max). */
export function recognitionSchema(foodIds: string[]) {
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

/** Cleans a list of items from Claude (or from the scan server); null if it is not a list. */
export function sanitizeItems(items: unknown, foodIds: string[]): FridgeItem[] | null {
  if (!Array.isArray(items)) return null
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

function stripFence(text: string): string {
  const m = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return m ? m[1] : text.trim()
}

/** Reads Claude's text answer; null if it is not the JSON we asked for. */
export function parseRecognition(text: string, foodIds: string[]): FridgeItem[] | null {
  try {
    return sanitizeItems((JSON.parse(stripFence(text)) as { items?: unknown }).items, foodIds)
  } catch {
    return null
  }
}
