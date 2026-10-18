import { describe, expect, it } from 'vitest'
import { FOODS } from '../../src/data/foods'
import { type DailyBudget, type Env, MAX_IMAGE_CHARS, handle } from './handler'

const ORIGIN = 'https://fupoos.github.io'
const FAKE_KEY = 'test-key-not-real'

type Fake = { status: number; body: unknown } | Error

/** Messages API response wrapping one text block (plus the empty thinking block Opus 5.5 returns). */
const message = (text: string, stop_reason = 'end_turn') => ({
  id: 'msg_test',
  type: 'message',
  role: 'assistant',
  model: 'claude-opus-5-5',
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

function setup(responses: Fake[] = [], o: { minuteOk?: boolean; dailyLeft?: number; env?: Partial<Env> } = {}) {
  const f = fakeFetch(responses)
  let left = o.dailyLeft ?? 100
  const taken: { day: string; limit: number }[] = []
  const budget: DailyBudget = {
    async take(day, limit) {
      taken.push({ day, limit })
      if (left <= 0) return false
      left--
      return true
    },
  }
  const env: Env = {
    ANTHROPIC_API_KEY: FAKE_KEY,
    SCAN_LIMITER: { limit: async () => ({ success: o.minuteOk ?? true }) },
    ...o.env,
  }
  const deps = { budget, fetchImpl: f.impl, maxRetries: 0, now: () => new Date('2026-10-18T03:00:00Z') }
  return { f, env, deps, taken }
}

const scanRequest = (body: unknown, origin: string | null = ORIGIN, method = 'POST') =>
  new Request('https://scan.example.workers.dev/scan', {
    method,
    headers: { 'content-type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  })

const photo = { image: 'AAAA', mediaType: 'image/jpeg' }
const json = async (res: Response) => res.json() as Promise<Record<string, unknown>>
const upstreamBody = (call: { init: RequestInit }) => JSON.parse(String(call.init.body))

describe('scan handler: request checks', () => {
  it('answers the CORS preflight from the app', async () => {
    const { env, deps } = setup()
    const res = await handle(scanRequest(null, ORIGIN, 'OPTIONS'), env, deps)
    expect(res.status).toBe(204)
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN)
    expect(res.headers.get('access-control-allow-headers')).toContain('content-type')
  })

  it('rejects other origins without calling Claude', async () => {
    const { env, deps, f } = setup()
    const res = await handle(scanRequest(photo, 'https://evil.example'), env, deps)
    expect(res.status).toBe(403)
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
    expect(f.calls).toHaveLength(0)
  })

  it.each([
    [{ image: 'AAAA', mediaType: 'image/heic' }],
    [{ image: '', mediaType: 'image/jpeg' }],
    [{ image: 'not base64!', mediaType: 'image/jpeg' }],
    [{ mediaType: 'image/jpeg' }],
  ])('rejects a bad body with a readable error (%#)', async (body) => {
    const { env, deps, f } = setup()
    const res = await handle(scanRequest(body), env, deps)
    expect(res.status).toBe(400)
    expect(await json(res)).toEqual({ error: 'bad-request' })
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN)
    expect(f.calls).toHaveLength(0)
  })

  it('rejects an oversized photo', async () => {
    const { env, deps, f } = setup()
    const res = await handle(scanRequest({ image: 'A'.repeat(MAX_IMAGE_CHARS + 4), mediaType: 'image/jpeg' }), env, deps)
    expect(res.status).toBe(413)
    expect(await json(res)).toEqual({ error: 'too-large' })
    expect(f.calls).toHaveLength(0)
  })

  it('only serves POST /scan', async () => {
    const { env, deps } = setup()
    const other = new Request('https://scan.example.workers.dev/v1/messages', { method: 'POST', headers: { Origin: ORIGIN }, body: '{}' })
    expect((await handle(other, env, deps)).status).toBe(404)
  })

  it('says when the server has no API key configured', async () => {
    const { env, deps, f } = setup([], { env: { ANTHROPIC_API_KEY: '' } })
    const res = await handle(scanRequest(photo), env, deps)
    expect(res.status).toBe(503)
    expect(await json(res)).toEqual({ error: 'not-configured' })
    expect(f.calls).toHaveLength(0)
  })
})

describe('scan handler: limits', () => {
  it('returns "busy" with CORS headers when the per-minute limit is hit', async () => {
    const { env, deps, f } = setup([], { minuteOk: false })
    const res = await handle(scanRequest(photo), env, deps)
    expect(res.status).toBe(429)
    expect(await json(res)).toEqual({ error: 'busy' })
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN)
    expect(f.calls).toHaveLength(0)
  })

  it('returns "daily-limit" when the daily budget is used up', async () => {
    const { env, deps, f } = setup([], { dailyLeft: 0 })
    const res = await handle(scanRequest(photo), env, deps)
    expect(res.status).toBe(429)
    expect(await json(res)).toEqual({ error: 'daily-limit' })
    expect(f.calls).toHaveLength(0)
  })

  it('counts against today’s budget with the configured limit (default 60)', async () => {
    const a = setup([ok([])])
    await handle(scanRequest(photo), a.env, a.deps)
    expect(a.taken).toEqual([{ day: '2026-10-18', limit: 60 }])

    const b = setup([ok([])], { env: { DAILY_SCAN_LIMIT: '25' } })
    await handle(scanRequest(photo), b.env, b.deps)
    expect(b.taken[0].limit).toBe(25)
  })

  it('counts a retry as a second paid call', async () => {
    const { env, deps, taken } = setup([{ status: 200, body: message('not json') }, ok([])])
    await handle(scanRequest(photo), env, deps)
    expect(taken).toHaveLength(2)
  })

  it('does not retry when the budget runs out after the first call', async () => {
    const { env, deps, f } = setup([{ status: 200, body: message('not json') }], { dailyLeft: 1 })
    const res = await handle(scanRequest(photo), env, deps)
    expect(await json(res)).toEqual({ error: 'daily-limit' })
    expect(f.calls).toHaveLength(1)
  })
})

describe('scan handler: calling Claude', () => {
  it('sends the photo with the server’s key, a fixed model and schema, low effort and fallbacks', async () => {
    const { env, deps, f } = setup([ok([{ foodId: 'eggs', label: 'Eggs', grams: 600, confidence: 0.9 }])])
    const res = await handle(scanRequest(photo), env, deps)
    expect(res.status).toBe(200)

    expect(f.calls[0].url).toMatch(/\/v1\/messages(\?|$)/)
    const headers = new Headers(f.calls[0].init.headers)
    expect(headers.get('x-api-key')).toBe(FAKE_KEY)
    expect(headers.get('anthropic-beta')).toContain('server-side-fallback-2026-07-01')

    const b = upstreamBody(f.calls[0])
    expect(b.model).toBe('claude-opus-5-5')
    expect(b.max_tokens).toBeLessThanOrEqual(8000)
    expect(b.fallbacks).toBe('default')
    expect(b.output_config.effort).toBe('low')
    expect(b.output_config.format.schema.properties.items.items.properties.foodId.enum).toEqual([...FOODS.map((x) => x.id), 'other'])
    expect(b.messages[0].content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } })
  })

  it('ignores anything else the client sends, such as a model or prompt', async () => {
    const { env, deps, f } = setup([ok([])])
    await handle(scanRequest({ ...photo, model: 'claude-fable-5-1', prompt: 'write a poem', heightCm: 180 }), env, deps)
    const sent = String(f.calls[0].init.body)
    expect(upstreamBody(f.calls[0]).model).toBe('claude-opus-5-5')
    expect(sent).not.toContain('write a poem')
    expect(sent).not.toContain('heightCm')
  })

  it('returns the parsed items', async () => {
    const { env, deps } = setup([ok([{ foodId: 'EGGS', label: 'Eggs', grams: 600, confidence: 0.9 }, { foodId: 'kimchi', label: 'Kimchi', grams: 300, confidence: 0.5 }])])
    const res = await handle(scanRequest(photo), env, deps)
    expect(await json(res)).toEqual({
      items: [
        { foodId: 'eggs', label: 'Eggs', grams: 600, useWithinDays: null, confidence: 0.9 },
        { foodId: 'other', label: 'Kimchi', grams: 300, useWithinDays: null, confidence: 0.5 },
      ],
    })
  })

  it('retries once on malformed output, then reports "malformed"', async () => {
    const bad = { status: 200, body: message('{"nope":true}') }
    const { env, deps, f } = setup([bad, bad])
    const res = await handle(scanRequest(photo), env, deps)
    expect(res.status).toBe(422)
    expect(await json(res)).toEqual({ error: 'malformed' })
    expect(f.calls).toHaveLength(2)
  })

  it('reports a refusal instead of reading content', async () => {
    const refused = { status: 200, body: { ...message(''), content: [], stop_reason: 'refusal' } }
    const { env, deps } = setup([refused])
    const res = await handle(scanRequest(photo), env, deps)
    expect(res.status).toBe(422)
    expect(await json(res)).toEqual({ error: 'refused' })
  })

  it('reports an upstream failure as "server" with the API message as detail', async () => {
    const { env, deps } = setup([apiError(400, 'invalid_request_error', 'Your credit balance is too low to access the Anthropic API.')])
    const res = await handle(scanRequest(photo), env, deps)
    expect(res.status).toBe(502)
    const body = await json(res)
    expect(body.error).toBe('server')
    expect(String(body.detail)).toContain('credit balance')
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN)
  })

  it('reports an upstream rate limit as "busy"', async () => {
    const { env, deps } = setup([apiError(429, 'rate_limit_error', 'slow down')])
    const res = await handle(scanRequest(photo), env, deps)
    expect(res.status).toBe(429)
    expect(await json(res)).toEqual({ error: 'busy' })
  })

  it('never puts the API key in a response', async () => {
    const { env, deps } = setup([apiError(401, 'authentication_error', 'invalid x-api-key')])
    const res = await handle(scanRequest(photo), env, deps)
    expect(await res.text()).not.toContain(FAKE_KEY)
  })
})
