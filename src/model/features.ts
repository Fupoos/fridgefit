import { isProteinSource } from '../lib/diet'
import type { FoodMap } from '../lib/planner'
import type { FridgeItem, WeeklyLog } from '../types'
import type { Feature } from './synthetic'
import { FEATURES } from './synthetic'

/** Typical values used when the user has not logged a week yet. */
const DEFAULT_LOG: Omit<WeeklyLog, 'weekStart' | 'weightKg'> = {
  sessions: 3,
  avgStepsK: 7.5,
  avgSleepH: 7,
  expiredUnused: 1,
  restocks: 2,
  takeawayOrders: 2,
}

/** Turns a confirmed fridge scan plus the latest weekly check-in into the model's feature vector. */
export function featuresFrom(items: FridgeItem[], log: WeeklyLog | null, foods: FoodMap): number[] {
  let proteinItems = 0
  let produceItems = 0
  let upfItems = 0
  for (const it of items) {
    const f = foods.get(it.foodId)
    if (!f) continue
    if (isProteinSource(f)) proteinItems++
    if (f.category === 'produce') produceItems++
    if (f.ultraProcessed) upfItems++
  }
  const l = log ?? DEFAULT_LOG
  const values: Record<Feature, number> = {
    proteinItems,
    produceItems,
    upfItems,
    expiredUnused: l.expiredUnused,
    restocks: l.restocks,
    sessions: l.sessions,
    stepsK: l.avgStepsK,
    sleepH: l.avgSleepH,
    takeawayOrders: l.takeawayOrders,
  }
  return FEATURES.map((f) => values[f])
}
