import { describe, expect, it } from 'vitest'
import type { FridgeItem, Profile, Targets } from '../types'
import { planShopping } from './shopping'
import { TEST_CATALOG, TEST_FOOD_MAP } from './testFoods'

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

const profile = (over: Partial<Profile> = {}): Pick<Profile, 'diet' | 'allergies' | 'weeklyBudgetAud'> => ({
  diet: 'any',
  allergies: [],
  weeklyBudgetAud: 80,
  ...over,
})

const item = (foodId: string, grams: number, useWithinDays: number | null = null): FridgeItem => ({
  foodId,
  label: foodId,
  grams,
  useWithinDays,
})

const run = (fridge: FridgeItem[], over: Partial<Profile> = {}) => planShopping(fridge, targets, profile(over), TEST_FOOD_MAP, TEST_CATALOG)

describe('planShopping', () => {
  it('only lists products from the Queensland catalogue', () => {
    const list = run([])
    const ids = new Set(TEST_CATALOG.map((p) => p.id))
    expect(list.lines.length).toBeGreaterThan(0)
    for (const l of list.lines) expect(ids.has(l.product.id)).toBe(true)
  })

  it('never goes over the weekly budget', () => {
    for (const budget of [10, 25, 50, 80, 200]) {
      const list = run([], { weeklyBudgetAud: budget })
      expect(list.total).toBeLessThanOrEqual(budget + 1e-9)
      expect(list.total).toBeCloseTo(
        list.lines.reduce((a, l) => a + l.cost, 0),
        6,
      )
    }
  })

  it('skips products whose price could not be verified', () => {
    expect(run([]).lines.some((l) => l.product.priceAUD === null)).toBe(false)
  })

  it('buys less when the fridge already covers part of the week', () => {
    const empty = run([], { weeklyBudgetAud: 200 })
    const stocked = run([item('chicken_breast', 3000), item('frozen_veg', 2000), item('rice', 2000)], { weeklyBudgetAud: 200 })
    expect(stocked.have.protein).toBeGreaterThan(0)
    expect(stocked.total).toBeLessThan(empty.total)
  })

  it('counts soon-to-expire items only for what can be eaten before they spoil', () => {
    const keeps = run([item('chicken_breast', 3000, null)], { weeklyBudgetAud: 200 })
    const spoils = run([item('chicken_breast', 3000, 1)], { weeklyBudgetAud: 200 })
    expect(spoils.have.protein).toBeLessThan(keeps.have.protein)
  })

  it('respects diet and allergies', () => {
    const veg = run([], { diet: 'vegetarian', allergies: ['egg'], weeklyBudgetAud: 200 })
    const foods = veg.lines.map((l) => l.product.foodId)
    expect(foods).not.toContain('chicken_breast')
    expect(foods).not.toContain('tuna_can')
    expect(foods).not.toContain('eggs')
    expect(veg.lines.some((l) => l.reason === 'protein')).toBe(true)
  })

  it('prefers the cheaper product per gram of protein', () => {
    const list = run([], { weeklyBudgetAud: 200 })
    const chicken = list.lines.filter((l) => l.product.foodId === 'chicken_breast').map((l) => l.product.id)
    if (chicken.length) expect(chicken[0]).toBe('chicken-1kg')
    expect(list.lines.find((l) => l.product.id === 'lentils-400g')).toBeDefined()
  })

  it('buys one product per food (the best value), not every brand', () => {
    const list = run([], { weeklyBudgetAud: 300 })
    const foods = list.lines.map((l) => l.product.foodId)
    expect(new Set(foods).size).toBe(foods.length)
  })

  it('does not count low-protein drinks such as milk as protein sources', () => {
    const list = run([], { weeklyBudgetAud: 300 })
    expect(list.lines.filter((l) => l.reason === 'protein').map((l) => l.product.foodId)).not.toContain('milk')
  })

  it('reports what is still missing when the budget runs out', () => {
    const list = run([], { weeklyBudgetAud: 10 })
    expect(list.unmet.some((g) => g.nutrient === 'protein')).toBe(true)
  })

  it('reports no unmet needs when the budget is generous', () => {
    expect(run([], { weeklyBudgetAud: 300 }).unmet).toEqual([])
  })

  it('is deterministic', () => {
    expect(run([item('eggs', 300)])).toEqual(run([item('eggs', 300)]))
  })
})
