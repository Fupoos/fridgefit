import Anthropic from '@anthropic-ai/sdk'
import { FOODS } from '../../src/data/foods'
import {
  IMAGE_MEDIA_TYPES, type ImageMediaType, MAX_TOKENS, MODEL, RECOGNITION_PROMPT, parseRecognition, recognitionSchema,
} from '../../src/lib/recognition'

/**
 * The FridgeFit scan server. It holds the Anthropic API key so the app never
 * sees it, accepts only "recognise this fridge photo" requests from the app's
 * own origin, and caps how many paid calls can happen per minute and per day.
 * Photos are passed straight to Claude and never stored or logged here.
 */

export interface RateLimiter {
  limit(o: { key: string }): Promise<{ success: boolean }>
}

/** Counts paid calls per UTC day; false once the day's limit is reached. */
export interface DailyBudget {
  take(day: string, limit: number): Promise<boolean>
}

export interface Env {
  ANTHROPIC_API_KEY?: string
  /** Comma-separated origins allowed to call /scan. */
  ALLOWED_ORIGINS?: string
  DAILY_SCAN_LIMIT?: string
  SCAN_LIMITER: RateLimiter
}

export interface Deps {
  budget: DailyBudget
  fetchImpl?: typeof fetch
  maxRetries?: number
  now?: () => Date
}

/** Base64 of about 1.5 MB; the app sends a JPEG of at most 1024 px, far smaller. */
export const MAX_IMAGE_CHARS = 2_000_000
const DEFAULT_ORIGINS = 'https://fupoos.github.io'
const DEFAULT_DAILY_LIMIT = 60
const FOOD_IDS = FOODS.map((f) => f.id)
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/

const allowedOrigins = (env: Env) => (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(',').map((o) => o.trim())

function dailyLimit(env: Env): number {
  const n = Number(env.DAILY_SCAN_LIMIT)
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_DAILY_LIMIT
}

/** The API's own error text (it already starts with the status), so a failure can be diagnosed from the app. */
function describe(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error'
}

export async function handle(request: Request, env: Env, deps: Deps): Promise<Response> {
  const origin = request.headers.get('Origin')
  const allowed = origin !== null && allowedOrigins(env).includes(origin)
  // Every answer to the app carries CORS headers, or the browser hides error details.
  const headers: Record<string, string> = { Vary: 'Origin' }
  if (allowed) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'content-type'
    headers['Access-Control-Max-Age'] = '86400'
  }
  const reply = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { ...headers, 'content-type': 'application/json' } })

  if (new URL(request.url).pathname !== '/scan') return reply(404, { error: 'not-found' })
  if (request.method === 'OPTIONS') return new Response(null, { status: allowed ? 204 : 403, headers })
  if (request.method !== 'POST') return reply(405, { error: 'bad-request' })
  if (!allowed) return reply(403, { error: 'forbidden' })
  if (!env.ANTHROPIC_API_KEY) return reply(503, { error: 'not-configured' })

  // Cheap checks first; nothing below costs money until the budget is taken.
  if (Number(request.headers.get('content-length') ?? 0) > MAX_IMAGE_CHARS + 1000) return reply(413, { error: 'too-large' })
  let body: { image?: unknown; mediaType?: unknown }
  try {
    body = await request.json()
  } catch {
    return reply(400, { error: 'bad-request' })
  }
  const { image, mediaType } = body ?? {}
  if (typeof image === 'string' && image.length > MAX_IMAGE_CHARS) return reply(413, { error: 'too-large' })
  if (typeof image !== 'string' || !BASE64.test(image) || typeof mediaType !== 'string' || !IMAGE_MEDIA_TYPES.includes(mediaType)) {
    return reply(400, { error: 'bad-request' })
  }

  // One shared key: phones on the same campus Wi-Fi share an IP, so a per-IP key would block a whole class.
  if (!(await env.SCAN_LIMITER.limit({ key: 'scan' })).success) return reply(429, { error: 'busy' })

  const day = (deps.now?.() ?? new Date()).toISOString().slice(0, 10)
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    maxRetries: deps.maxRetries ?? 1,
    ...(deps.fetchImpl ? { fetch: deps.fetchImpl } : {}),
  })

  // A malformed answer gets one retry; each attempt is a paid call and counts against the day.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!(await deps.budget.take(day, dailyLimit(env)))) return reply(429, { error: 'daily-limit' })
    let response: Anthropic.Beta.BetaMessage
    try {
      response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: recognitionSchema(FOOD_IDS) } },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType as ImageMediaType, data: image } },
              { type: 'text', text: RECOGNITION_PROMPT },
            ],
          },
        ],
      })
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return reply(429, { error: 'busy' })
      return reply(502, { error: 'server', detail: describe(e) })
    }
    if (response.stop_reason === 'refusal') return reply(422, { error: 'refused' })
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
    const items = parseRecognition(text, FOOD_IDS)
    if (items) return reply(200, { items })
  }
  return reply(422, { error: 'malformed' })
}
