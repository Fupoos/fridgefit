import type { Label } from '../types'

/**
 * SYNTHETIC training data for the in-app supervised-learning demo.
 *
 * Nothing here comes from real people. Rows are drawn from a documented
 * generative rule (see MODEL_CARD.md) so the pitch can show what a labelled
 * dataset looks like and how a model learns from it.
 */

export const FEATURES = [
  'proteinItems',
  'produceItems',
  'upfItems',
  'expiredUnused',
  'restocks',
  'sessions',
  'stepsK',
  'sleepH',
  'takeawayOrders',
] as const

export type Feature = (typeof FEATURES)[number]

export const FEATURE_INFO: Record<Feature, { label: string; short: string }> = {
  proteinItems: { label: 'Protein-source items in fridge', short: 'Protein items' },
  produceItems: { label: 'Fruit & veg items in fridge', short: 'Fruit & veg items' },
  upfItems: { label: 'Ultra-processed items in fridge', short: 'Ultra-processed items' },
  expiredUnused: { label: 'Items expired unused this week', short: 'Expired unused' },
  restocks: { label: 'Grocery restocks this week', short: 'Restocks' },
  sessions: { label: 'Training sessions this week', short: 'Training sessions' },
  stepsK: { label: 'Average daily steps (thousands)', short: 'Steps (k/day)' },
  sleepH: { label: 'Average sleep (hours/night)', short: 'Sleep (h)' },
  takeawayOrders: { label: 'Takeaway / delivery orders this week', short: 'Takeaway orders' },
}

export const LABELS = ['on-track', 'stalled', 'too-fast'] as const satisfies readonly Label[]

export interface Row {
  x: number[]
  y: Label
}

/** Small seeded PRNG so the dataset (and therefore the model) is reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rand: () => number): number {
  const u = 1 - rand()
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const count = (v: number, hi: number) => clamp(Math.round(v), 0, hi)
const oneDp = (v: number) => Math.round(v * 10) / 10

function percentile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
}

/**
 * Each synthetic student-week has a latent "organised shopper" trait that makes
 * fridge features correlate the way they plausibly would in real life.
 * Scores (plus Gaussian noise) decide the label:
 *   sOn   = .6·protein + .35·produce − .5·upf − .4·expired + .25·sessions
 *           + .15·stepsK + .5·(sleep − 7) − .45·takeaway + N(0,1)
 *   sFast = .5·sessions + .2·stepsK − .3·(protein + produce) − .5·restocks
 *           − .4·(sleep − 7) + N(0,1)
 *   too-fast if sFast is in its top quartile; otherwise on-track if sOn is above
 *   its 55th percentile; otherwise stalled.
 * All synthetic users are on a fat-loss ("cut") goal.
 */
export function generateDataset(n = 300, seed = 1130): Row[] {
  const rand = mulberry32(seed)
  const g = () => gaussian(rand)
  const raw: { x: number[]; sOn: number; sFast: number }[] = []

  for (let i = 0; i < n; i++) {
    const organised = g()
    const proteinItems = count(3 + 1.3 * organised + 1.2 * g(), 8)
    const produceItems = count(5 + 1.8 * organised + 2 * g(), 12)
    const upfItems = count(4 - 1.2 * organised + 1.8 * g(), 10)
    const expiredUnused = count(1.5 - 0.6 * organised + 1.1 * g(), 6)
    const restocks = count(2 + 0.5 * organised + 0.8 * g(), 4)
    const sessions = count(3.5 + 1.6 * g(), 7)
    const stepsK = oneDp(clamp(7.5 + 2.5 * g(), 2, 15))
    const sleepH = oneDp(clamp(7 + 0.9 * g(), 4.5, 9.5))
    const takeawayOrders = count(2.5 - 1 * organised + 1.5 * g(), 8)

    const sOn =
      0.6 * proteinItems +
      0.35 * produceItems -
      0.5 * upfItems -
      0.4 * expiredUnused +
      0.25 * sessions +
      0.15 * stepsK +
      0.5 * (sleepH - 7) -
      0.45 * takeawayOrders +
      g()
    const sFast =
      0.5 * sessions + 0.2 * stepsK - 0.3 * (proteinItems + produceItems) - 0.5 * restocks - 0.4 * (sleepH - 7) + g()

    raw.push({
      x: [proteinItems, produceItems, upfItems, expiredUnused, restocks, sessions, stepsK, sleepH, takeawayOrders],
      sOn,
      sFast,
    })
  }

  const fastCut = percentile(
    raw.map((r) => r.sFast),
    0.75,
  )
  const onCut = percentile(
    raw.map((r) => r.sOn),
    0.55,
  )
  return raw.map((r) => ({
    x: r.x,
    y: r.sFast > fastCut ? 'too-fast' : r.sOn > onCut ? 'on-track' : 'stalled',
  }))
}
