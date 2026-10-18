import { describe, expect, it } from 'vitest'
import { ClaudeError, DEFAULT_MODEL, recognizeFridge, testKey } from './claude'
import { fitWithin } from './image'

const IDS = ['chicken_breast', 'eggs', 'broccoli']

type Fake = { status: number; body: unknown } | Error

/** Messages API response wrapping one text block (plus the empty thinking block Opus 5.5 returns). */
const message = (text: string, stop_reason = 'end_turn') => ({
  id: 'msg_test',
  type: 'message',
  role: 'assistant',
  model: DEFAULT_MODEL,
  content: [
    { type: 'thinking', thinking: '', signature: 'sig' },
    { type: 'text', text },
  ],
  stop_reason,
  stop_sequence: null,
  usage: { input_tokens: 1200, output_tokens: 300 },
})

const ok = (items: unknown[]) => ({ status: 200, body: message(JSON.stringify({ items })) })
const apiError = (status: number, type: string, msg: string) => ({ status, body: { type: 'error', error: { type, message: msg } } })

function fakeFetch(responses: Fake[]) {
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

const cfg = (impl: typeof fetch) => ({ apiKey: 'sk-ant-test', model: DEFAULT_MODEL, fetchImpl: impl, maxRetries: 0 })
const body = (call: { init: RequestInit }) => JSON.parse(String(call.init.body))

describe('recognizeFridge', () => {
  it('defaults to Claude Opus 5.5', () => {
    expect(DEFAULT_MODEL).toBe('claude-opus-5-5')
  })

  it('posts the photo to the Messages API with a JSON schema, low effort and server-side fallbacks', async () => {
    const f = fakeFetch([ok([{ foodId: 'eggs', label: 'Eggs', grams: 600, confidence: 0.9 }])])
    await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))

    expect(f.calls[0].url).toMatch(/\/v1\/messages(\?|$)/)
    const b = body(f.calls[0])
    expect(b.model).toBe('claude-opus-5-5')
    expect(b.fallbacks).toBe('default')
    expect(b.output_config.effort).toBe('low')
    expect(b.output_config.format.type).toBe('json_schema')
    const item = b.output_config.format.schema.properties.items.items
    expect(item.properties.foodId.enum).toEqual([...IDS, 'other'])
    expect(item.additionalProperties).toBe(false)
    expect(b.messages[0].content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } })
  })

  it('sends the beta header for server-side fallbacks and the browser-access opt-in', async () => {
    const f = fakeFetch([ok([])])
    await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    const headers = new Headers(f.calls[0].init.headers)
    expect(headers.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01')
    expect(headers.get('anthropic-dangerous-direct-browser-access')).toBe('true')
    expect(headers.get('x-api-key')).toBe('sk-ant-test')
  })

  it('never sends body measurements or other profile data', async () => {
    const f = fakeFetch([ok([])])
    await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(String(f.calls[0].init.body)).not.toMatch(/heightCm|weightKg|targetWeight|"age"|"sex"/)
  })

  it('uses only JSON Schema features that structured outputs supports', async () => {
    const f = fakeFetch([ok([])])
    await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(String(f.calls[0].init.body)).not.toMatch(/"minimum"|"maximum"|"minLength"|"maxLength"/)
  })

  it('parses items into fridge items', async () => {
    const f = fakeFetch([ok([{ foodId: 'chicken_breast', label: 'Chicken breast', grams: 500, useWithinDays: 2, confidence: 0.8 }])])
    const items = await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(items).toEqual([{ foodId: 'chicken_breast', label: 'Chicken breast', grams: 500, useWithinDays: 2, confidence: 0.8 }])
  })

  it('accepts enum values that come back in a different case', async () => {
    const f = fakeFetch([ok([{ foodId: 'EGGS', label: 'Eggs', grams: 100, confidence: 1 }])])
    const items = await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(items[0].foodId).toBe('eggs')
  })

  it('maps unknown food ids to "other" and keeps the label', async () => {
    const f = fakeFetch([ok([{ foodId: 'kimchi', label: 'Kimchi jar', grams: 400, confidence: 0.6 }])])
    const items = await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(items[0]).toMatchObject({ foodId: 'other', label: 'Kimchi jar', useWithinDays: null })
  })

  it('retries once on malformed JSON, then succeeds', async () => {
    const f = fakeFetch([{ status: 200, body: message('not json') }, ok([{ foodId: 'eggs', label: 'Eggs', grams: 100, confidence: 1 }])])
    const items = await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))
    expect(items).toHaveLength(1)
    expect(f.calls).toHaveLength(2)
  })

  it('throws a malformed error after two bad responses', async () => {
    const bad = { status: 200, body: message('{"nope":true}') }
    await expect(recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(fakeFetch([bad, bad]).impl))).rejects.toMatchObject({ kind: 'malformed' })
  })

  it('reports a refusal instead of reading content', async () => {
    const refused = { status: 200, body: { ...message(''), content: [], stop_reason: 'refusal' } }
    await expect(recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(fakeFetch([refused]).impl))).rejects.toMatchObject({ kind: 'refused' })
  })

  it.each([
    [apiError(401, 'authentication_error', 'invalid x-api-key'), 'auth'],
    [apiError(403, 'permission_error', 'not allowed'), 'auth'],
    [apiError(429, 'rate_limit_error', 'slow down'), 'quota'],
    [apiError(404, 'not_found_error', 'model: claude-nope'), 'model'],
    [apiError(400, 'invalid_request_error', 'Your credit balance is too low to access the Anthropic API.'), 'credits'],
  ])('maps an API error to the right kind (%#)', async (resp, kind) => {
    await expect(recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(fakeFetch([resp]).impl))).rejects.toMatchObject({ kind })
  })

  it('keeps the API message as detail so a failure can be diagnosed', async () => {
    const resp = apiError(400, 'invalid_request_error', 'output_config.format.schema: unsupported keyword')
    const err = await recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(fakeFetch([resp]).impl)).catch((e) => e)
    expect(err.kind).toBe('model')
    expect(err.detail).toContain('unsupported keyword')
  })

  it('maps a network failure to a network error', async () => {
    const f = fakeFetch([new TypeError('Failed to fetch'), new TypeError('Failed to fetch')])
    await expect(recognizeFridge('AAAA', 'image/jpeg', IDS, cfg(f.impl))).rejects.toMatchObject({ kind: 'network' })
  })

  it('refuses to call the API without a key', async () => {
    const f = fakeFetch([])
    const err = await recognizeFridge('AAAA', 'image/jpeg', IDS, { apiKey: ' ', model: DEFAULT_MODEL, fetchImpl: f.impl, maxRetries: 0 }).catch((e) => e)
    expect(err).toBeInstanceOf(ClaudeError)
    expect(err.kind).toBe('no-key')
    expect(f.calls).toHaveLength(0)
  })
})

describe('testKey', () => {
  it('checks the key and model with a free Models API lookup', async () => {
    const f = fakeFetch([{ status: 200, body: { id: DEFAULT_MODEL, type: 'model', display_name: 'Claude Opus 5.5', created_at: '2026-09-01T00:00:00Z' } }])
    await expect(testKey(cfg(f.impl))).resolves.toBe(true)
    expect(f.calls[0].url).toContain(`/v1/models/${DEFAULT_MODEL}`)
  })

  it('reports a bad key', async () => {
    const f = fakeFetch([apiError(401, 'authentication_error', 'invalid x-api-key')])
    await expect(testKey(cfg(f.impl))).rejects.toMatchObject({ kind: 'auth' })
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
