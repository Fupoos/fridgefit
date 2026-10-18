export type Goal = 'cut' | 'maintain' | 'bulk'
export type Sex = 'male' | 'female' | 'unspecified'
export type Activity = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'
export type Diet = 'any' | 'no-pork' | 'pescatarian' | 'vegetarian' | 'vegan'
export type Allergy = 'dairy' | 'egg' | 'nuts' | 'seafood' | 'gluten' | 'soy'

export interface Profile {
  age: number
  sex: Sex
  heightCm: number
  weightKg: number
  targetWeightKg: number
  goal: Goal
  activity: Activity
  trainingDays: number
  weeklyBudgetAud: number
  diet: Diet
  allergies: Allergy[]
}

export interface Macros {
  kcal: number
  protein: number
  fat: number
  carbs: number
}

export type FoodCategory = 'protein' | 'dairy' | 'produce' | 'carb' | 'fat' | 'snack' | 'drink'

/** Dietary tags used to filter foods against Profile.diet and Profile.allergies. */
export type FoodTag =
  | 'meat'
  | 'pork'
  | 'seafood'
  | 'dairy'
  | 'egg'
  | 'nuts'
  | 'gluten'
  | 'soy'
  | 'alcohol'

export interface Food {
  id: string
  name: string
  category: FoodCategory
  ultraProcessed: boolean
  portionG: number
  per100g: Macros
  tags: FoodTag[]
  fdcId: number
}

export interface FridgeItem {
  /** A Food id, or 'other' when the item is not in the local table. */
  foodId: string
  label: string
  /** Rough amount on hand in grams (user can edit). */
  grams: number
  /** Days until it should be eaten; null if unknown. */
  useWithinDays: number | null
  confidence?: number
}

export interface FridgeScan {
  id: string
  date: string
  source: 'demo' | 'gemini'
  sampleId?: string
  predicted: FridgeItem[]
  confirmed: FridgeItem[]
}

export interface Targets {
  bmr: number
  tdee: number
  kcal: number
  proteinG: number
  fatG: number
  carbsG: number
  floorKcal: number
  floorApplied: boolean
  goal: Goal
  expectedWeeklyChangeKg: number
}

export interface PlanLine {
  foodId: string
  label: string
  grams: number
}

export interface Meal {
  name: string
  lines: PlanLine[]
  steps: string[]
}

export interface Gap {
  nutrient: 'protein' | 'produce' | 'kcal'
  shortBy: number
  unit: 'g' | 'kcal'
  suggestions: string[]
}

export interface Plan {
  source: 'local' | 'gemini'
  meals: Meal[]
  totals: Macros
  targets: Targets
  gaps: Gap[]
  unmatched: string[]
}

export interface WeeklyLog {
  weekStart: string
  weightKg: number
  sessions: number
  avgStepsK: number
  avgSleepH: number
  expiredUnused: number
  restocks: number
  takeawayOrders: number
}

export type Label = 'on-track' | 'stalled' | 'too-fast'

export type Store = 'Woolworths' | 'Coles' | 'ALDI'

/** A product a Queensland shopper can buy, mapped to a Food for nutrition. */
export interface GroceryProduct {
  id: string
  foodId: string
  store: Store
  productName: string
  packSize: string
  packGrams: number
  /** Online shelf price when checked; null if it could not be verified. */
  priceAUD: number | null
  unitPriceText: string
  url: string
  checkedOn: string
}

export interface ShoppingLine {
  product: GroceryProduct
  packs: number
  cost: number
  reason: 'protein' | 'produce' | 'energy'
}

export interface ShoppingList {
  lines: ShoppingLine[]
  total: number
  budget: number
  /** Weekly amounts: what the targets need, what the fridge already covers, what the list adds. */
  need: { protein: number; produceG: number; kcal: number }
  have: { protein: number; produceG: number; kcal: number }
  added: { protein: number; produceG: number; kcal: number }
  unmet: Gap[]
}
