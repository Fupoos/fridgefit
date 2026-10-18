import { describe, expect, it } from 'vitest'
import { FOODS, FOOD_MAP } from './foods'
import { DEMO_FRIDGES } from './samples'

describe('FOODS (USDA FoodData Central)', () => {
  it('has unique ids and an FDC id for every food', () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length)
    for (const f of FOODS) expect(f.fdcId).toBeGreaterThan(0)
  })

  it('has energy roughly consistent with 4/4/9 Atwater factors (fibre-rich veg and alcohol excepted)', () => {
    for (const f of FOODS) {
      if (f.tags.includes('alcohol')) continue
      const { kcal, protein, fat, carbs } = f.per100g
      const tolerance = f.category === 'produce' ? 0.35 : 0.15
      expect(Math.abs(kcal - (4 * protein + 4 * carbs + 9 * fat)) / kcal, f.id).toBeLessThan(tolerance)
    }
  })
})

describe('DEMO_FRIDGES', () => {
  it('only use known food ids (or "other")', () => {
    for (const d of DEMO_FRIDGES) {
      for (const it of [...d.predicted, ...d.actual]) {
        expect(it.foodId === 'other' || FOOD_MAP.has(it.foodId), `${d.id}: ${it.foodId}`).toBe(true)
      }
    }
  })

  it('each contain at least one deliberate scanner mistake to correct', () => {
    for (const d of DEMO_FRIDGES) {
      const key = (xs: typeof d.actual) => xs.map((i) => `${i.foodId}:${i.label}`).sort().join('|')
      expect(key(d.predicted)).not.toBe(key(d.actual))
    }
  })
})
