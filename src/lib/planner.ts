import type { Food, FridgeItem, Gap, Macros, Meal, Plan, PlanLine, Profile, Targets } from '../types'
import { allowedFood, isProteinSource } from './diet'

export type FoodMap = Map<string, Food>
type MealName = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'

const MEALS: MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

/** Which meals each food sensibly goes in. Anything not listed goes to lunch or dinner. */
const MEAL_FIT: Record<string, MealName[]> = {
  eggs: ['Breakfast', 'Lunch'],
  greek_yogurt: ['Breakfast', 'Snack'],
  cottage_cheese: ['Breakfast', 'Snack'],
  milk: ['Breakfast', 'Snack'],
  milk_skim: ['Breakfast', 'Snack'],
  soy_milk: ['Breakfast', 'Snack'],
  whey: ['Snack', 'Breakfast'],
  oats: ['Breakfast'],
  bread_wholemeal: ['Breakfast', 'Lunch'],
  wraps: ['Lunch'],
  banana: ['Breakfast', 'Snack'],
  apple: ['Snack', 'Breakfast'],
  orange: ['Snack', 'Breakfast'],
  mango: ['Snack', 'Breakfast'],
  berries_frozen: ['Breakfast', 'Snack'],
  peanut_butter: ['Breakfast', 'Snack'],
  almonds: ['Snack'],
  avocado: ['Lunch', 'Breakfast'],
  cheddar: ['Lunch', 'Snack'],
  edamame: ['Snack', 'Lunch', 'Dinner'],
  tuna_can: ['Lunch', 'Snack'],
  carrot: ['Lunch', 'Dinner', 'Snack'],
  cucumber: ['Lunch', 'Snack'],
}
const DEFAULT_FIT: MealName[] = ['Dinner', 'Lunch']

const CHEAP_PROTEIN = ['eggs', 'lentils_can', 'chickpeas_can', 'tuna_can', 'chicken_thigh', 'greek_yogurt', 'tofu', 'milk', 'whey']
const EASY_PRODUCE = ['frozen_veg', 'banana', 'carrot', 'peas_frozen', 'spinach', 'apple']
const EASY_ENERGY = ['oats', 'rice', 'peanut_butter', 'banana', 'potato', 'pasta']

const MIN_PRODUCE_G = 400

const floor10 = (g: number) => Math.floor(g / 10) * 10

export function macrosOf(lines: PlanLine[], foods: FoodMap): Macros {
  const m: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  for (const l of lines) {
    const f = foods.get(l.foodId)
    if (!f) continue
    const k = l.grams / 100
    m.kcal += f.per100g.kcal * k
    m.protein += f.per100g.protein * k
    m.fat += f.per100g.fat * k
    m.carbs += f.per100g.carbs * k
  }
  return m
}

export function findGaps(
  totals: Macros,
  produceGrams: number,
  targets: Targets,
  profile: Pick<Profile, 'diet' | 'allergies'>,
  foods: FoodMap,
): Gap[] {
  const fits = (ids: string[]) =>
    ids.filter((id) => {
      const f = foods.get(id)
      return f !== undefined && allowedFood(f, profile)
    })
  const gaps: Gap[] = []
  if (totals.protein < targets.proteinG * 0.9) {
    gaps.push({ nutrient: 'protein', shortBy: Math.round(targets.proteinG - totals.protein), unit: 'g', suggestions: fits(CHEAP_PROTEIN) })
  }
  if (produceGrams < MIN_PRODUCE_G) {
    gaps.push({ nutrient: 'produce', shortBy: Math.round(MIN_PRODUCE_G - produceGrams), unit: 'g', suggestions: fits(EASY_PRODUCE) })
  }
  if (totals.kcal < targets.kcal * 0.9) {
    gaps.push({ nutrient: 'kcal', shortBy: Math.round(targets.kcal - totals.kcal), unit: 'kcal', suggestions: fits(EASY_ENERGY) })
  }
  return gaps
}

interface Stock {
  food: Food
  label: string
  left: number
  soon: boolean
  used: number
}

/**
 * Deterministic, greedy one-day plan built only from what is in the fridge:
 * protein first (spread across meals), then at least 400 g of fruit & veg,
 * then carbs and fats up to the calorie target. Items that expire soon go first.
 */
export function planLocal(
  items: FridgeItem[],
  targets: Targets,
  profile: Pick<Profile, 'diet' | 'allergies'>,
  foods: FoodMap,
): Plan {
  const unmatched: string[] = []
  const stock = new Map<string, Stock>()
  for (const it of items) {
    const food = foods.get(it.foodId)
    if (!food) {
      unmatched.push(it.label)
      continue
    }
    if (food.category === 'drink' || !allowedFood(food, profile)) continue
    const s = stock.get(food.id)
    const soon = it.useWithinDays !== null && it.useWithinDays <= 2
    if (s) {
      s.left += it.grams
      s.soon ||= soon
    } else {
      stock.set(food.id, { food, label: it.label, left: it.grams, soon, used: 0 })
    }
  }

  const meals = new Map<MealName, PlanLine[]>(MEALS.map((m) => [m, []]))
  const totals: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  const kcalCeiling = targets.kcal * 1.08
  let produceGrams = 0

  const mealLoad = (meal: MealName, key: keyof Macros) => macrosOf(meals.get(meal)!, foods)[key]

  /** Adds up to one portion; returns true if anything was added. */
  const addPortion = (s: Stock, balanceBy: keyof Macros, maxPortions: number): boolean => {
    if (s.used >= s.food.portionG * maxPortions) return false
    let grams = Math.min(Math.round(s.food.portionG / 10) * 10, floor10(s.left))
    const kcalPerG = s.food.per100g.kcal / 100
    while (grams >= 10 && totals.kcal + grams * kcalPerG > kcalCeiling) grams = floor10(grams / 2)
    if (grams < 10) return false

    const fit = MEAL_FIT[s.food.id] ?? DEFAULT_FIT
    const meal = [...fit].sort((a, b) => mealLoad(a, balanceBy) - mealLoad(b, balanceBy))[0]
    const lines = meals.get(meal)!
    const existing = lines.find((l) => l.foodId === s.food.id)
    if (existing) existing.grams += grams
    else lines.push({ foodId: s.food.id, label: s.food.name, grams })

    s.left -= grams
    s.used += grams
    const k = grams / 100
    totals.kcal += s.food.per100g.kcal * k
    totals.protein += s.food.per100g.protein * k
    totals.fat += s.food.per100g.fat * k
    totals.carbs += s.food.per100g.carbs * k
    if (s.food.category === 'produce') produceGrams += grams
    return true
  }

  const byPriority = (list: Stock[], score: (s: Stock) => number) =>
    [...list].sort((a, b) => Number(b.soon) - Number(a.soon) || score(b) - score(a) || a.food.id.localeCompare(b.food.id))

  /** Round-robin one portion per candidate per pass until `done()` or nothing more fits. */
  const fill = (cands: Stock[], done: () => boolean, balanceBy: keyof Macros, maxPortions: number) => {
    let added = true
    while (!done() && added) {
      added = false
      for (const s of cands) {
        if (done()) break
        added = addPortion(s, balanceBy, maxPortions) || added
      }
    }
  }

  const all = [...stock.values()]
  const proteinDensity = (s: Stock) => s.food.per100g.protein / Math.max(1, s.food.per100g.kcal)

  const proteinFoods = byPriority(
    all.filter((s) => isProteinSource(s.food)),
    proteinDensity,
  )
  fill(proteinFoods, () => totals.protein >= targets.proteinG * 0.95, 'protein', 2)

  const produce = byPriority(
    all.filter((s) => s.food.category === 'produce'),
    (s) => -s.food.per100g.kcal,
  )
  fill(produce, () => produceGrams >= MIN_PRODUCE_G, 'kcal', 2)

  const short = () => totals.kcal >= targets.kcal - 100
  fill(
    byPriority(
      all.filter((s) => s.food.category === 'carb'),
      (s) => s.food.per100g.protein,
    ),
    short,
    'kcal',
    3,
  )
  fill(
    byPriority(
      all.filter((s) => s.food.category === 'fat' || (s.food.category === 'dairy' && !isProteinSource(s.food))),
      () => 0,
    ),
    short,
    'kcal',
    3,
  )
  if (totals.kcal < targets.kcal - 250) {
    fill(
      byPriority(
        all.filter((s) => s.food.category === 'snack'),
        () => 0,
      ),
      short,
      'kcal',
      1,
    )
  }

  const planMeals: Meal[] = MEALS.map((name) => ({ name, lines: meals.get(name)!, steps: stepsFor(meals.get(name)!, foods) })).filter(
    (m) => m.lines.length > 0,
  )

  return {
    source: 'local',
    meals: planMeals,
    totals,
    targets,
    gaps: findGaps(totals, produceGrams, targets, profile, foods),
    unmatched,
  }
}

export function produceGramsOf(lines: PlanLine[], foods: FoodMap): number {
  return lines.filter((l) => foods.get(l.foodId)?.category === 'produce').reduce((a, l) => a + l.grams, 0)
}

const COOKED_PROTEIN = new Set(['chicken_breast', 'chicken_thigh', 'beef_mince', 'pork_loin', 'salmon', 'prawns', 'sausages', 'tofu', 'tempeh'])
const BOILED_CARB = new Set(['rice', 'pasta', 'potato', 'sweet_potato'])
const RAW_VEG = new Set(['lettuce', 'cucumber', 'tomato', 'spinach', 'carrot', 'capsicum'])

function names(lines: PlanLine[]): string {
  const n = lines.map((l) => l.label.toLowerCase())
  return n.length <= 1 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`
}

/** Short, generic cooking steps so the plan reads like something you can actually make. */
export function stepsFor(lines: PlanLine[], foods: FoodMap): string[] {
  const steps: string[] = []
  const by = (pred: (l: PlanLine, f: Food) => boolean) =>
    lines.filter((l) => {
      const f = foods.get(l.foodId)
      return f !== undefined && pred(l, f)
    })

  const carbs = by((l) => BOILED_CARB.has(l.foodId))
  if (carbs.length) steps.push(`Cook the ${names(carbs)} (boil or microwave until tender).`)
  const cooked = by((l) => COOKED_PROTEIN.has(l.foodId))
  if (cooked.length) steps.push(`Season and pan-fry or bake the ${names(cooked)} until cooked through.`)
  if (lines.some((l) => l.foodId === 'eggs')) steps.push('Scramble, poach or boil the eggs.')
  if (lines.some((l) => l.foodId === 'oats')) steps.push('Microwave the oats with water or milk for 2 minutes.')
  const veg = by((l, f) => f.category === 'produce' && !MEAL_FIT[l.foodId]?.includes('Breakfast') && !RAW_VEG.has(l.foodId))
  if (veg.length) steps.push(`Steam or stir-fry the ${names(veg)}.`)
  const raw = by((l) => RAW_VEG.has(l.foodId))
  if (raw.length) steps.push(`Chop the ${names(raw)} and serve fresh.`)
  if (!steps.length) steps.push('Assemble and enjoy — no cooking needed.')
  return steps
}
