import type { Profile, Sex } from '../types'

export type GoalCheckCode = 'UNDER_18_CUT' | 'CURRENT_BMI_LOW' | 'TARGET_BMI_LOW' | 'GOAL_MISMATCH'

export interface GoalCheck {
  allowed: boolean
  code?: GoalCheckCode
  message?: string
}

/** Lower edge of the "healthy weight" BMI range used by Australian health bodies. */
export const HEALTHY_BMI_MIN = 18.5

const SEX_MIN_KCAL: Record<Sex, number> = { female: 1200, male: 1500, unspecified: 1350 }

export const SUPPORT = [
  {
    name: 'Butterfly Foundation National Helpline',
    phone: '1800 33 4673',
    detail: 'Eating disorder and body image support, 8am–midnight AEST, 7 days (not a crisis line)',
    url: 'https://butterfly.org.au/get-support/helpline/',
  },
  { name: 'Lifeline (24/7 crisis support)', phone: '13 11 14', detail: 'Call or text, any time', url: 'https://www.lifeline.org.au/' },
  { name: 'Emergency', phone: '000', detail: 'If you or someone else is in immediate danger', url: '' },
] as const

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return weightKg / (m * m)
}

/** The app never prescribes fewer calories than this. */
export function calorieFloor(sex: Sex, bmr: number): number {
  return Math.max(Math.round(bmr), SEX_MIN_KCAL[sex])
}

export function checkGoal(p: Profile): GoalCheck {
  if (p.goal === 'maintain') return { allowed: true }

  if (p.goal === 'cut') {
    if (p.age < 18) {
      return {
        allowed: false,
        code: 'UNDER_18_CUT',
        message:
          'FridgeFit does not build weight-loss plans for people under 18. Bodies are still growing — a GP or school nurse can help you set goals safely. We have set your plan to maintenance.',
      }
    }
    if (bmi(p.weightKg, p.heightCm) < HEALTHY_BMI_MIN) {
      return {
        allowed: false,
        code: 'CURRENT_BMI_LOW',
        message:
          'Your current weight is already below the healthy range for your height, so FridgeFit will not plan a calorie deficit. If food or body image feels stressful, the support lines below are free and confidential.',
      }
    }
    if (bmi(p.targetWeightKg, p.heightCm) < HEALTHY_BMI_MIN) {
      return {
        allowed: false,
        code: 'TARGET_BMI_LOW',
        message:
          'That target would put you below the healthy weight range for your height, so FridgeFit will not plan towards it. Your plan is set to maintenance instead. If you would like to talk to someone, the support lines below are free and confidential.',
      }
    }
    if (p.targetWeightKg >= p.weightKg) {
      return {
        allowed: false,
        code: 'GOAL_MISMATCH',
        message: 'Your target weight is not below your current weight. Did you mean "maintain" or "bulk"?',
      }
    }
    return { allowed: true }
  }

  if (p.targetWeightKg <= p.weightKg) {
    return {
      allowed: false,
      code: 'GOAL_MISMATCH',
      message: 'Your target weight is not above your current weight. Did you mean "maintain" or "cut"?',
    }
  }
  return { allowed: true }
}
