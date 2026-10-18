import { describe, expect, it } from 'vitest'
import type { FridgeItem, Profile, Targets } from '../types'
import { allowedFood } from './diet'
import { findGaps, macrosOf, planLocal } from './planner'
import { TEST_FOOD_MAP } from './testFoods'

const targets: Targets = {
  bmr: 1830,
  tdee: 2836.5,
  kcal: 2269,
  proteinG: 160,
  fatG: 63,
  carbsG: 266,
  floorKcal: 1830,
  floorApplied: false,
  goal: 'cut',
  expectedWeeklyChangeKg: -0.52,
}

const profile: Pick<Profile, 'diet' | 'allergies'> = { diet: 'any', allergies: [] }

const item = (foodId: string, grams: number, useWithinDays: number | null = null): FridgeItem => ({
  foodId,
  label: TEST_FOOD_MAP.get(foodId)?.name ?? foodId,
  grams,
  useWithinDays,
})

const wellStocked: FridgeItem[] = [
  item('chicken_breast', 1000),
  item('eggs', 600),
  item('greek_yogurt', 1000),
  item('broccoli', 500),
  item('banana', 600),
  item('spinach', 120),
  item('rice', 1000),
  item('oats', 750),
  item('olive_oil', 500),
  item('chips', 150),
  item('beer', 2250),
]

const lines = (plan: ReturnType<typeof planLocal>) => plan.meals.flatMap((m) => m.lines)

describe('allowedFood', () => {
  it('excludes meat for vegetarians and animal products for vegans', () => {
    const chicken = TEST_FOOD_MAP.get('chicken_breast')!
    const yogurt = TEST_FOOD_MAP.get('greek_yogurt')!
    expect(allowedFood(chicken, { diet: 'vegetarian', allergies: [] })).toBe(false)
    expect(allowedFood(yogurt, { diet: 'vegetarian', allergies: [] })).toBe(true)
    expect(allowedFood(yogurt, { diet: 'vegan', allergies: [] })).toBe(false)
  })

  it('excludes foods matching an allergy', () => {
    expect(allowedFood(TEST_FOOD_MAP.get('peanut_butter')!, { diet: 'any', allergies: ['nuts'] })).toBe(false)
  })
})

describe('macrosOf', () => {
  it('sums per-100g values scaled by grams', () => {
    const m = macrosOf([{ foodId: 'chicken_breast', label: 'x', grams: 200 }], TEST_FOOD_MAP)
    expect(m).toEqual({ kcal: 240, protein: 45, fat: 5.2, carbs: 0 })
  })
})

describe('planLocal', () => {
  it('is deterministic', () => {
    expect(planLocal(wellStocked, targets, profile, TEST_FOOD_MAP)).toEqual(
      planLocal(wellStocked, targets, profile, TEST_FOOD_MAP),
    )
  })

  it('reports totals that equal the sum of its lines', () => {
    const plan = planLocal(wellStocked, targets, profile, TEST_FOOD_MAP)
    const sum = macrosOf(lines(plan), TEST_FOOD_MAP)
    expect(plan.totals.kcal).toBeCloseTo(sum.kcal, 6)
    expect(plan.totals.protein).toBeCloseTo(sum.protein, 6)
  })

  it('gets within 10% of the protein target from a well-stocked fridge', () => {
    const plan = planLocal(wellStocked, targets, profile, TEST_FOOD_MAP)
    expect(plan.totals.protein).toBeGreaterThanOrEqual(targets.proteinG * 0.9)
  })

  it('does not overshoot the calorie target by more than 10%', () => {
    const plan = planLocal(wellStocked, targets, profile, TEST_FOOD_MAP)
    expect(plan.totals.kcal).toBeLessThanOrEqual(targets.kcal * 1.1)
  })

  it('includes at least 400 g of fruit and veg when the fridge has it', () => {
    const plan = planLocal(wellStocked, targets, profile, TEST_FOOD_MAP)
    const produce = lines(plan)
      .filter((l) => TEST_FOOD_MAP.get(l.foodId)?.category === 'produce')
      .reduce((a, l) => a + l.grams, 0)
    expect(produce).toBeGreaterThanOrEqual(400)
  })

  it('never uses more of an item than is in the fridge', () => {
    const scarce = [item('chicken_breast', 200), item('rice', 100), item('broccoli', 50)]
    const plan = planLocal(scarce, targets, profile, TEST_FOOD_MAP)
    const used = (id: string) => lines(plan).filter((l) => l.foodId === id).reduce((a, l) => a + l.grams, 0)
    expect(used('chicken_breast')).toBeLessThanOrEqual(200)
    expect(used('rice')).toBeLessThanOrEqual(100)
    expect(used('broccoli')).toBeLessThanOrEqual(50)
  })

  it('uses grams in multiples of 10', () => {
    const plan = planLocal(wellStocked, targets, profile, TEST_FOOD_MAP)
    for (const l of lines(plan)) expect(l.grams % 10).toBe(0)
  })

  it('never plans alcohol', () => {
    const plan = planLocal(wellStocked, targets, profile, TEST_FOOD_MAP)
    expect(lines(plan).some((l) => l.foodId === 'beer')).toBe(false)
  })

  it('respects diet and allergies even for food that is in the fridge', () => {
    const plan = planLocal(wellStocked, targets, { diet: 'vegetarian', allergies: ['egg'] }, TEST_FOOD_MAP)
    const ids = lines(plan).map((l) => l.foodId)
    expect(ids).not.toContain('chicken_breast')
    expect(ids).not.toContain('eggs')
  })

  it('uses items that expire soon before equivalent items that keep', () => {
    const fridge = [item('tofu', 150, null), item('eggs', 100, 1), item('rice', 300)]
    const plan = planLocal(fridge, { ...targets, proteinG: 20 }, profile, TEST_FOOD_MAP)
    expect(lines(plan).some((l) => l.foodId === 'eggs')).toBe(true)
  })

  it('lists items it cannot match to the food table', () => {
    const plan = planLocal([...wellStocked, { foodId: 'other', label: 'Kimchi', grams: 300, useWithinDays: null }], targets, profile, TEST_FOOD_MAP)
    expect(plan.unmatched).toEqual(['Kimchi'])
  })
})

describe('findGaps', () => {
  it('flags a protein shortfall and suggests cheap proteins that fit the diet', () => {
    const plan = planLocal([item('rice', 1000), item('banana', 600)], targets, { diet: 'vegetarian', allergies: [] }, TEST_FOOD_MAP)
    const protein = plan.gaps.find((g) => g.nutrient === 'protein')
    expect(protein).toBeDefined()
    expect(protein!.shortBy).toBeGreaterThan(0)
    expect(protein!.suggestions).not.toContain('chicken_breast')
    expect(protein!.suggestions).not.toContain('tuna_can')
    expect(protein!.suggestions.length).toBeGreaterThan(0)
  })

  it('reports no gaps when targets are met', () => {
    expect(findGaps({ kcal: 2300, protein: 165, fat: 60, carbs: 270 }, 450, targets, profile, TEST_FOOD_MAP)).toEqual([])
  })
})

describe('stepsFor', () => {
  it('returns language-neutral step codes with the food ids they apply to', async () => {
    const { stepsFor } = await import('./planner')
    const steps = stepsFor(
      [
        { foodId: 'rice', label: 'Rice', grams: 80 },
        { foodId: 'chicken_breast', label: 'Chicken', grams: 150 },
        { foodId: 'broccoli', label: 'Broccoli', grams: 100 },
        { foodId: 'spinach', label: 'Spinach', grams: 60 },
      ],
      TEST_FOOD_MAP,
    )
    expect(steps).toEqual([
      { kind: 'boil', foods: ['rice'] },
      { kind: 'pan', foods: ['chicken_breast'] },
      { kind: 'steam', foods: ['broccoli'] },
      { kind: 'raw', foods: ['spinach'] },
    ])
  })

  it('says no cooking is needed for snack-only meals', async () => {
    const { stepsFor } = await import('./planner')
    expect(stepsFor([{ foodId: 'greek_yogurt', label: 'Yoghurt', grams: 170 }], TEST_FOOD_MAP)).toEqual([{ kind: 'assemble', foods: [] }])
  })
})
