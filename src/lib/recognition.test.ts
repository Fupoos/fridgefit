import { describe, expect, it } from 'vitest'
import { MAX_TOKENS, MODEL, parseRecognition, recognitionSchema, sanitizeItems } from './recognition'

const IDS = ['chicken_breast', 'eggs', 'broccoli']

describe('recognition request', () => {
  it('uses Claude Opus 5.5 with a bounded output budget', () => {
    expect(MODEL).toBe('claude-opus-5-5')
    expect(MAX_TOKENS).toBeLessThanOrEqual(8000)
  })

  it('limits foodId to the local food list plus "other"', () => {
    const item = recognitionSchema(IDS).properties.items.items
    expect(item.properties.foodId.enum).toEqual([...IDS, 'other'])
    expect(item.additionalProperties).toBe(false)
  })

  it('uses only JSON Schema features that structured outputs supports', () => {
    expect(JSON.stringify(recognitionSchema(IDS))).not.toMatch(/"minimum"|"maximum"|"minLength"|"maxLength"/)
  })
})

describe('parseRecognition', () => {
  it('parses items into fridge items', () => {
    const text = JSON.stringify({ items: [{ foodId: 'chicken_breast', label: 'Chicken breast', grams: 500, useWithinDays: 2, confidence: 0.8 }] })
    expect(parseRecognition(text, IDS)).toEqual([{ foodId: 'chicken_breast', label: 'Chicken breast', grams: 500, useWithinDays: 2, confidence: 0.8 }])
  })

  it('accepts enum values that come back in a different case', () => {
    const items = parseRecognition(JSON.stringify({ items: [{ foodId: 'EGGS', label: 'Eggs', grams: 100, confidence: 1 }] }), IDS)
    expect(items?.[0].foodId).toBe('eggs')
  })

  it('maps unknown food ids to "other" and keeps the label', () => {
    const items = parseRecognition(JSON.stringify({ items: [{ foodId: 'kimchi', label: 'Kimchi jar', grams: 400, confidence: 0.6 }] }), IDS)
    expect(items?.[0]).toMatchObject({ foodId: 'other', label: 'Kimchi jar', useWithinDays: null })
  })

  it('clamps grams to 0–5000 and confidence to 0–1', () => {
    const items = parseRecognition(JSON.stringify({ items: [{ foodId: 'eggs', label: 'Eggs', grams: 99999, confidence: 4 }] }), IDS)
    expect(items?.[0]).toMatchObject({ grams: 5000, confidence: 1 })
  })

  it('reads JSON wrapped in a code fence', () => {
    expect(parseRecognition('```json\n{"items":[]}\n```', IDS)).toEqual([])
  })

  it('returns null for text that is not the expected JSON', () => {
    expect(parseRecognition('not json', IDS)).toBeNull()
    expect(parseRecognition('{"nope":true}', IDS)).toBeNull()
  })
})

describe('sanitizeItems', () => {
  it('returns null when items is not a list', () => {
    expect(sanitizeItems({ foodId: 'eggs' }, IDS)).toBeNull()
    expect(sanitizeItems(undefined, IDS)).toBeNull()
  })

  it('drops entries that are not objects', () => {
    expect(sanitizeItems([null, 'eggs', { foodId: 'eggs', label: 'Eggs', grams: 100 }], IDS)).toEqual([
      { foodId: 'eggs', label: 'Eggs', grams: 100, useWithinDays: null },
    ])
  })
})
