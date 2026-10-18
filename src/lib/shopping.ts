import type { Food, FridgeItem, Gap, GroceryProduct, Profile, ShoppingLine, ShoppingList, Targets } from '../types'
import { allowedFood, isProteinSource } from './diet'
import type { FoodMap } from './planner'

const PRODUCE_PER_DAY_G = 400
/** Soon-to-expire fridge items count for at most this many portions a day before they spoil. */
const MAX_PORTIONS_PER_DAY = 2
/** First pass buys up to ~1 portion a day of each food (variety); a second pass allows 2 (volume). */
const PASSES = [1, 2]

type Amounts = { protein: number; produceG: number; kcal: number }

function amountsOf(food: Food, grams: number): Amounts {
  return {
    protein: (food.per100g.protein * grams) / 100,
    produceG: food.category === 'produce' ? grams : 0,
    kcal: (food.per100g.kcal * grams) / 100,
  }
}

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
    // Best-value product for each food, then foods in order of value.
    const best = new Map<string, { p: GroceryProduct & { priceAUD: number }; f: Food; v: number }>()
    for (const p of priced) {
      const f = foods.get(p.foodId)!
      if (!pick(f)) continue
      const v = valuePerDollar(p, f)
      const cur = best.get(f.id)
      if (!cur || v > cur.v || (v === cur.v && p.id < cur.p.id)) best.set(f.id, { p, f, v })
    }
    const cands = [...best.values()].sort((a, b) => b.v - a.v || a.p.id.localeCompare(b.p.id))

    for (const perDay of PASSES) {
      for (const { p, f } of cands) {
        const cap = f.portionG * perDay * days
        while (gapLeft(key) > 0) {
          const used = usedGrams.get(f.id) ?? 0
          // The first pack of a food is always allowed, even if one pack is more than the weekly cap (e.g. a 2 kg bag of rice).
          if (used > 0 && used + p.packGrams > cap) break
          if (total + p.priceAUD > budget + 1e-9) break

          const line = lines.get(p.id) ?? { product: p, packs: 0, cost: 0, reason }
          line.packs += 1
          line.cost = Math.round(line.packs * p.priceAUD * 100) / 100
          lines.set(p.id, line)
          total += p.priceAUD
          usedGrams.set(f.id, used + p.packGrams)
          const a = amountsOf(f, p.packGrams)
          added.protein += a.protein
          added.produceG += a.produceG
          added.kcal += a.kcal
        }
      }
    }
  }

  fill('protein', isProteinSource, 'protein', (p, f) => (f.per100g.protein * p.packGrams) / 100 / p.priceAUD)
  fill('produce', (f) => f.category === 'produce', 'produceG', (p) => p.packGrams / p.priceAUD)
  fill('energy', (f) => f.category === 'carb' || f.category === 'fat' || (f.category === 'dairy' && !isProteinSource(f)), 'kcal', (p, f) => (f.per100g.kcal * p.packGrams) / 100 / p.priceAUD)

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
