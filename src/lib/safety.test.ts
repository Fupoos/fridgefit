import { describe, expect, it } from 'vitest'
import type { Profile } from '../types'
import { bmi, calorieFloor, checkGoal } from './safety'

const base: Profile = {
  age: 19,
  sex: 'female',
  heightCm: 160,
  weightKg: 50,
  targetWeightKg: 48,
  goal: 'cut',
  activity: 'sedentary',
  trainingDays: 3,
  weeklyBudgetAud: 70,
  diet: 'any',
  allergies: [],
}

describe('bmi', () => {
  it('is weight / height²', () => {
    expect(bmi(45, 160)).toBeCloseTo(17.58, 2)
  })
})

describe('calorieFloor', () => {
  it('is never below BMR', () => {
    expect(calorieFloor('female', 1400)).toBe(1400)
  })

  it('uses sex-based minimums when BMR is lower', () => {
    expect(calorieFloor('female', 1100)).toBe(1200)
    expect(calorieFloor('male', 1400)).toBe(1500)
    expect(calorieFloor('unspecified', 1300)).toBe(1350)
  })
})

describe('checkGoal', () => {
  it('allows a modest cut that stays in a healthy BMI range', () => {
    expect(checkGoal(base)).toEqual({ allowed: true })
  })

  it('blocks a cut whose target BMI is under 18.5', () => {
    const r = checkGoal({ ...base, targetWeightKg: 45 })
    expect(r.allowed).toBe(false)
    expect(r.code).toBe('TARGET_BMI_LOW')
  })

  it('blocks a cut when current BMI is already under 18.5', () => {
    const r = checkGoal({ ...base, weightKg: 46, targetWeightKg: 44 })
    expect(r.code).toBe('CURRENT_BMI_LOW')
  })

  it('blocks any cut for users under 18, before BMI checks', () => {
    const r = checkGoal({ ...base, age: 17, targetWeightKg: 45 })
    expect(r.code).toBe('UNDER_18_CUT')
  })

  it('flags a cut whose target is not below current weight', () => {
    expect(checkGoal({ ...base, targetWeightKg: 52 }).code).toBe('GOAL_MISMATCH')
  })

  it('flags a bulk whose target is not above current weight', () => {
    expect(checkGoal({ ...base, goal: 'bulk', targetWeightKg: 49 }).code).toBe('GOAL_MISMATCH')
  })

  it('always allows maintenance', () => {
    expect(checkGoal({ ...base, goal: 'maintain', weightKg: 44, age: 16 })).toEqual({ allowed: true })
  })

  it('gives every blocked result a supportive, non-shaming message', () => {
    const r = checkGoal({ ...base, targetWeightKg: 45 })
    expect(r.message).toBeTruthy()
    expect(r.message!.toLowerCase()).not.toMatch(/fail|bad|lazy/)
  })
})
