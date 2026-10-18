import type { Food, FridgeItem, Gap, GroceryProduct, Profile, ShoppingLine, ShoppingList, Targets } from '../types'
import { allowedFood } from './diet'
import type { FoodMap } from './planner'

const PRODUCE_PER_DAY_G = 400
/** At most two portions a day of any one food across the week's shop. */
const MAX_PORTIONS_PER_DAY = 2

type Amounts = { protein: number; produceG: number; kcal: number }

function amountsOf(food: Food, grams: number): Amounts {
  return {
    protein: (food.per100g.protein * grams) / 100,
    produceG: food.category === 'produce' ? grams : 0,
    kcal: (food.per100g.kcal * grams) / 100,
  }
}

const isProteinSource = (f: Food) =>
  f.category === 'protein' || (f.category === 'dairy' && f.per100g.protein / Math.max(1, f.per100g.kcal) >= 0.05)

/**
 * Builds a week's shopping list from a Queensland supermarket catalogue:
 * weekly targets minus what is already in the fridge (counting soon-to-expire
 * items only for what can be eaten before they spoil), filled in order of
 * protein, then fruit & veg, then energy — best value per dollar first —
 * without ever going over the weekly budget.
 */
export function planShopping(
  fridge: FridgeItem[],
  targets: Targets,
  profile: Pick<Profile, 'diet' | 'allergies' | 'weeklyBudgetAud'>,
  foods: FoodMap,
  catalog: GroceryProduct[],
  days = 7,
): ShoppingList {
  const need: Amounts = { protein: targets.proteinG * days, produceG: PRODUCE_PER_DAY_G * days, kcal: targets.kcal * days }

  const have: Amounts = { protein: 0, produceG: 0, kcal: 0 }
  const usedGrams = new Map<string, number>()
  for (const it of fridge) {
    const food = foods.get(it.foodId)
    if (!food || food.category === 'drink' || !allowedFood(food, profile)) continue
    const spoilsFirst = it.useWithinDays !== null && it.useWithinDays < days
    const usable = spoilsFirst ? Math.min(it.grams, it.useWithinDays! * food.portionG * MAX_PORTIONS_PER_DAY) : it.grams
    const a = amountsOf(food, usable)
    have.protein += a.protein
    have.produceG += a.produceG
    have.kcal += a.kcal
    usedGrams.set(food.id, (usedGrams.get(food.id) ?? 0) + usable)
  }

  const added: Amounts = { protein: 0, produceG: 0, kcal: 0 }
  const lines = new Map<string, ShoppingLine>()
  let total = 0
  const budget = profile.weeklyBudgetAud

  const priced = catalog.filter((p): p is GroceryProduct & { priceAUD: number } => {
    const food = foods.get(p.foodId)
    return p.priceAUD !== null && p.priceAUD > 0 && food !== undefined && food.category !== 'drink' && allowedFood(food, profile)
  })

  const gapLeft = (key: keyof Amounts) => need[key] - have[key] - added[key]

  const fill = (
    reason: ShoppingLine['reason'],
    pick: (f: Food) => boolean,
    key: keyof Amounts,
    valuePerDollar: (p: GroceryProduct & { priceAUD: number }, f: Food) => number,
  ) => {
    const cands = priced
      .filter((p) => pick(foods.get(p.foodId)!))
      .map((p) => ({ p, f: foods.get(p.foodId)!, v: valuePerDollar(p, foods.get(p.foodId)!) }))
      .sort((a, b) => b.v - a.v || a.p.id.localeCompare(b.p.id))

    let added1 = true
    while (gapLeft(key) > 0 && added1) {
      added1 = false
      for (const { p, f } of cands) {
        if (gapLeft(key) <= 0) break
        if (total + p.priceAUD > budget + 1e-9) continue
        const cap = f.portionG * MAX_PORTIONS_PER_DAY * days
        if ((usedGrams.get(f.id) ?? 0) + p.packGrams > cap) continue

        const line = lines.get(p.id) ?? { product: p, packs: 0, cost: 0, reason }
        line.packs += 1
        line.cost = Math.round(line.packs * p.priceAUD * 100) / 100
        lines.set(p.id, line)
        total += p.priceAUD
        usedGrams.set(f.id, (usedGrams.get(f.id) ?? 0) + p.packGrams)
        const a = amountsOf(f, p.packGrams)
        added.protein += a.protein
        added.produceG += a.produceG
        added.kcal += a.kcal
        added1 = true
      }
    }
  }

  fill('protein', isProteinSource, 'protein', (p, f) => (f.per100g.protein * p.packGrams) / 100 / p.priceAUD)
  fill('produce', (f) => f.category === 'produce', 'produceG', (p) => p.packGrams / p.priceAUD)
  fill('energy', (f) => f.category === 'carb' || f.category === 'fat', 'kcal', (p, f) => (f.per100g.kcal * p.packGrams) / 100 / p.priceAUD)

  const unmet: Gap[] = []
  if (gapLeft('protein') > need.protein * 0.05) {
    unmet.push({ nutrient: 'protein', shortBy: Math.round(gapLeft('protein')), unit: 'g', suggestions: [] })
  }
  if (gapLeft('produceG') > need.produceG * 0.05) {
    unmet.push({ nutrient: 'produce', shortBy: Math.round(gapLeft('produceG')), unit: 'g', suggestions: [] })
  }
  if (gapLeft('kcal') > need.kcal * 0.1) {
    unmet.push({ nutrient: 'kcal', shortBy: Math.round(gapLeft('kcal')), unit: 'kcal', suggestions: [] })
  }

  return {
    lines: [...lines.values()],
    total: Math.round(total * 100) / 100,
    budget,
    need,
    have,
    added,
    unmet,
  }
}
