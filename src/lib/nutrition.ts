import type { Activity, Goal, Profile, Targets } from '../types'
import { calorieFloor, checkGoal } from './safety'

const SEX_CONSTANT = { male: 5, female: -161, unspecified: -78 } as const

const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
}

/** Approximate energy in 1 kg of body-weight change. */
const KCAL_PER_KG = 7700

/** Mifflin–St Jeor resting energy expenditure (kcal/day). */
export function bmr(p: Pick<Profile, 'weightKg' | 'heightCm' | 'age' | 'sex'>): number {
  return Math.round(10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + SEX_CONSTANT[p.sex])
}

export function tdee(bmrKcal: number, activity: Activity): number {
  return bmrKcal * ACTIVITY_FACTOR[activity]
}

function goalKcal(goal: Goal, p: Profile, maintenance: number): number {
  if (goal === 'cut') {
    // 20% deficit, but never faster than ~1% of body weight per week.
    const maxDeficit = (p.weightKg * 0.01 * KCAL_PER_KG) / 7
    return maintenance - Math.min(maintenance * 0.2, maxDeficit)
  }
  if (goal === 'bulk') return maintenance + Math.min(maintenance * 0.1, 500)
  return maintenance
}

export function computeTargets(p: Profile): Targets {
  const b = bmr(p)
  const maintenance = tdee(b, p.activity)
  const goal: Goal = checkGoal(p).allowed ? p.goal : 'maintain'
  const floorKcal = calorieFloor(p.sex, b)

  const wanted = Math.round(goalKcal(goal, p, maintenance))
  const kcal = Math.max(wanted, floorKcal)

  const perKg = goal === 'cut' ? 2.0 : 1.8
  const proteinG = Math.round(Math.min(2.2, Math.max(1.6, perKg)) * p.weightKg)
  const fatG = Math.round(Math.max((kcal * 0.25) / 9, 0.6 * p.weightKg))
  const carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4))

  return {
    bmr: b,
    tdee: maintenance,
    kcal,
    proteinG,
    fatG,
    carbsG,
    floorKcal,
    floorApplied: kcal > wanted,
    goal,
    expectedWeeklyChangeKg: ((kcal - maintenance) * 7) / KCAL_PER_KG,
  }
}
