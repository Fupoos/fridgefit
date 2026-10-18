import { describe, expect, it } from 'vitest'
import { TEST_FOOD_MAP } from '../lib/testFoods'
import type { FridgeItem, WeeklyLog } from '../types'
import { featuresFrom } from './features'
import { FEATURES } from './synthetic'

const log: WeeklyLog = {
  weekStart: '2026-10-12',
  weightKg: 79.4,
  sessions: 4,
  avgStepsK: 8.2,
  avgSleepH: 6.9,
  expiredUnused: 2,
  restocks: 1,
  takeawayOrders: 3,
}

const item = (foodId: string): FridgeItem => ({ foodId, label: foodId, grams: 100, useWithinDays: null })

describe('featuresFrom', () => {
  const x = featuresFrom([item('chicken_breast'), item('greek_yogurt'), item('broccoli'), item('banana'), item('chips'), item('other'), item('rice')], log, TEST_FOOD_MAP)
  const get = (f: (typeof FEATURES)[number]) => x[FEATURES.indexOf(f)]

  it('returns one number per model feature, in order', () => {
    expect(x).toHaveLength(FEATURES.length)
  })

  it('counts protein sources (including high-protein dairy), produce and ultra-processed items', () => {
    expect(get('proteinItems')).toBe(2)
    expect(get('produceItems')).toBe(2)
    expect(get('upfItems')).toBe(1)
  })

  it('takes behaviour features from the weekly log', () => {
    expect(get('sessions')).toBe(4)
    expect(get('stepsK')).toBe(8.2)
    expect(get('sleepH')).toBe(6.9)
    expect(get('expiredUnused')).toBe(2)
    expect(get('restocks')).toBe(1)
    expect(get('takeawayOrders')).toBe(3)
  })
})
