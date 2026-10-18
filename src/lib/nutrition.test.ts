import { describe, expect, it } from 'vitest'
import type { Profile } from '../types'
import { bmr, computeTargets, tdee } from './nutrition'

const base: Profile = {
  age: 20,
  sex: 'male',
  heightCm: 180,
  weightKg: 80,
  targetWeightKg: 75,
  goal: 'cut',
  activity: 'moderate',
  trainingDays: 4,
  weeklyBudgetAud: 80,
  diet: 'any',
  allergies: [],
}

describe('bmr (Mifflin–St Jeor)', () => {
  it('uses +5 for male', () => {
    expect(bmr(base)).toBe(1830)
  })

  it('uses -161 for female', () => {
    expect(bmr({ ...base, sex: 'female', age: 19, heightCm: 160, weightKg: 50 })).toBe(1244)
  })

  it('uses the midpoint constant (-78) when sex is unspecified', () => {
    expect(bmr({ ...base, sex: 'unspecified' })).toBe(1747)
  })
})

describe('tdee', () => {
  it('multiplies BMR by the activity factor', () => {
    expect(tdee(1830, 'moderate')).toBeCloseTo(2836.5, 5)
    expect(tdee(1000, 'sedentary')).toBeCloseTo(1200, 5)
    expect(tdee(1000, 'extra')).toBeCloseTo(1900, 5)
  })
})

describe('computeTargets', () => {
  it('cuts 20% below TDEE for a typical male student', () => {
    const t = computeTargets(base)
    expect(t.kcal).toBe(2269)
    expect(t.floorApplied).toBe(false)
    expect(t.goal).toBe('cut')
  })

  it('sets protein to 2.0 g/kg on a cut and 1.8 g/kg otherwise', () => {
    expect(computeTargets(base).proteinG).toBe(160)
    expect(computeTargets({ ...base, goal: 'maintain', targetWeightKg: 80 }).proteinG).toBe(144)
  })

  it('makes macros add back up to the calorie target (within rounding)', () => {
    const t = computeTargets(base)
    const fromMacros = t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9
    expect(Math.abs(fromMacros - t.kcal)).toBeLessThanOrEqual(10)
  })

  it('never sets fat below 0.6 g/kg', () => {
    const t = computeTargets({ ...base, weightKg: 120, targetWeightKg: 100, activity: 'sedentary' })
    expect(t.fatG).toBeGreaterThanOrEqual(72)
  })

  it('caps a cut so weight loss stays at or below 1% of body weight per week', () => {
    const big = computeTargets({ ...base, weightKg: 60, targetWeightKg: 55, activity: 'extra', age: 22 })
    // deficit cap = 60 * 0.01 * 7700 / 7 = 660 kcal/day
    expect(big.tdee - big.kcal).toBeLessThanOrEqual(660 + 1)
    expect(Math.abs(big.expectedWeeklyChangeKg)).toBeLessThanOrEqual(0.6 + 1e-9)
  })

  it('adds 10% (max +500 kcal) on a bulk', () => {
    const t = computeTargets({ ...base, goal: 'bulk', targetWeightKg: 85 })
    expect(t.kcal).toBe(Math.round(2836.5 * 1.1))
    const huge = computeTargets({ ...base, goal: 'bulk', targetWeightKg: 110, weightKg: 100, activity: 'extra' })
    expect(huge.kcal - Math.round(huge.tdee)).toBeLessThanOrEqual(500)
  })

  it('lifts a cut to the calorie floor for a small, sedentary user', () => {
    const t = computeTargets({
      ...base,
      sex: 'female',
      age: 19,
      heightCm: 160,
      weightKg: 50,
      targetWeightKg: 48,
      activity: 'sedentary',
    })
    expect(t.floorKcal).toBe(1244)
    expect(t.kcal).toBe(1244)
    expect(t.floorApplied).toBe(true)
  })

  it('falls back to maintenance when the goal is blocked by a safety rule', () => {
    const t = computeTargets({ ...base, sex: 'female', age: 19, heightCm: 160, weightKg: 50, targetWeightKg: 45 })
    expect(t.goal).toBe('maintain')
    expect(t.kcal).toBe(Math.round(t.tdee))
  })

  it('reports expected weekly weight change in kg (negative on a cut)', () => {
    const t = computeTargets(base)
    expect(t.expectedWeeklyChangeKg).toBeLessThan(0)
    expect(t.expectedWeeklyChangeKg).toBeCloseTo(-((t.tdee - t.kcal) * 7) / 7700, 2)
  })
})
