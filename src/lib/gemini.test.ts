import { describe, expect, it } from 'vitest'
import { GeminiError, extractOutputText, recognizeFridge, testKey } from './gemini'
import { fitWithin } from './image'

const IDS = ['chicken_breast', 'eggs', 'broccoli']

/** Wraps text the way the Interactions API returns it. */
const envelope = (text: string) => ({
  id: 'v1_test',
  object: 'interaction',
  status: 'completed',
  steps: [
    { type: 'user_input', content: [{ type: 'text', text: 'ignored' }] },
    { type: 'model_output', content: [{ type: 'text', text }] },
  ],
})

function fakeFetch(responses: Array<{ status: number; body: unknown } | Error>) {
  const calls: { url: string; init: RequestInit }[] = []
  const impl = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} })
    const next = responses.shift()
    if (!next) throw new Error('no more fake responses')
    if (next instanceof Error) throw next
    return new Response(JSON.stringify(next.body), { status: next.status, headers: { 'content-type': 'application/json' } })
  }
  return { impl: impl as typeof fetch, calls }
}

const ok = (items: unknown[]) => ({ status: 200, body: envelope(JSON.stringify({ items })) })
const cfg = (impl: typeof fetch) => ({ apiKey: 'test-key', model: 'gemini-3.8-flash', fetchImpl: impl })

describe('extractOutputText', () => {
  it('reads the text of model_output steps', () => {
    expect(extractOutputText(envelope('{"a":1}'))).toBe('{"a":1}')
  })

  it('falls back to the legacy generateContent shape', () => {
    expect(extractOutputText({ candidates: [{ content: { parts: [{ text: 'hi' }] } }] })).toBe('hi')
  })
})

describe('recognizeFridge', () => {
  it('sends the image with the key header, store:false and an enum-constrained schema', async () => {
    const f = fakeFetch([ok([{ foodId: 'eggs', label: 'Eggs', grams: 600, confidence: 0.9 }])])
    await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))

    const { url, init } = f.calls[0]
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions')
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key')
    const body = JSON.parse(String(init.body))
    expect(body.store).toBe(false)
    expect(body.model).toBe('gemini-3.8-flash')
    expect(body.input).toContainEqual({ type: 'image', mime_type: 'image/jpeg', data: 'AAAA' })
    const idSchema = body.response_format.schema.properties.items.items.properties.foodId
    expect(idSchema.enum).toEqual([...IDS, 'other'])
  })

  it('never sends body measurements or other profile data', async () => {
    const f = fakeFetch([ok([])])
    await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(String(f.calls[0].init.body)).not.toMatch(/heightCm|weightKg|targetWeight|"age"|"sex"/)
  })

  it('parses items into fridge items', async () => {
    const f = fakeFetch([ok([{ foodId: 'chicken_breast', label: 'Chicken breast', grams: 500, useWithinDays: 2, confidence: 0.8 }])])
    const items = await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(items).toEqual([{ foodId: 'chicken_breast', label: 'Chicken breast', grams: 500, useWithinDays: 2, confidence: 0.8 }])
  })

  it('accepts JSON wrapped in a code fence', async () => {
    const fenced = { status: 200, body: envelope('```json\n{"items":[{"foodId":"eggs","label":"Eggs","grams":120,"confidence":0.7}]}\n```') }
    const items = await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(fakeFetch([fenced]).impl))
    expect(items[0].foodId).toBe('eggs')
  })

  it('maps unknown food ids to "other" and keeps the label', async () => {
    const f = fakeFetch([ok([{ foodId: 'kimchi', label: 'Kimchi jar', grams: 400, confidence: 0.6 }])])
    const items = await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(items[0]).toMatchObject({ foodId: 'other', label: 'Kimchi jar', useWithinDays: null })
  })

  it('retries once on malformed JSON, then succeeds', async () => {
    const f = fakeFetch([{ status: 200, body: envelope('not json') }, ok([{ foodId: 'eggs', label: 'Eggs', grams: 100, confidence: 1 }])])
    const items = await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(items).toHaveLength(1)
    expect(f.calls).toHaveLength(2)
  })

  it('throws a malformed error after two bad responses', async () => {
    const bad = { status: 200, body: envelope('{"nope":true}') }
    await expect(recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(fakeFetch([bad, bad]).impl))).rejects.toMatchObject({
      kind: 'malformed',
    })
  })

  it.each([
    [401, 'auth'],
    [403, 'auth'],
    [429, 'quota'],
    [404, 'model'],
  ])('maps HTTP %i to a %s error', async (status, kind) => {
    const f = fakeFetch([{ status, body: { error: { message: 'x' } } }])
    await expect(recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))).rejects.toMatchObject({ kind })
  })

  it('retries a 400 once without generation_config', async () => {
    const f = fakeFetch([{ status: 400, body: { error: { message: 'Unknown field generation_config' } } }, ok([])])
    await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(JSON.parse(String(f.calls[0].init.body)).generation_config).toBeDefined()
    expect(JSON.parse(String(f.calls[1].init.body)).generation_config).toBeUndefined()
  })

  it('maps a network failure to a network error', async () => {
    const f = fakeFetch([new TypeError('Failed to fetch')])
    await expect(recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))).rejects.toMatchObject({ kind: 'network' })
  })

  it('refuses to call the API without a key', async () => {
    const f = fakeFetch([])
    const err = await recognizeFridge('AAAA', 'image/jpeg', IDS, { apiKey: ' ', model: 'm', fetchImpl: f.impl }).catch((e) => e)
    expect(err).toBeInstanceOf(GeminiError)
    expect(err.kind).toBe('no-key')
    expect(f.calls).toHaveLength(0)
  })
})

describe('testKey', () => {
  it('resolves true when the API answers', async () => {
    const f = fakeFetch([{ status: 200, body: envelope('OK') }])
    await expect(testKey(cfg(f.impl))).resolves.toBe(true)
  })
})

describe('fitWithin', () => {
  it('scales the long edge down to the limit, keeping aspect ratio', () => {
    expect(fitWithin(4032, 3024, 1024)).toEqual({ width: 1024, height: 768 })
    expect(fitWithin(3024, 4032, 1024)).toEqual({ width: 768, height: 1024 })
  })

  it('never upscales', () => {
    expect(fitWithin(800, 600, 1024)).toEqual({ width: 800, height: 600 })
  })
})
