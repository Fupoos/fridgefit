import type { Food, GroceryProduct } from '../types'

/** Small fixture table for unit tests (values rounded, for tests only). */
export const TEST_FOODS: Food[] = [
  { id: 'chicken_breast', name: 'Chicken breast', category: 'protein', ultraProcessed: false, portionG: 150, per100g: { kcal: 120, protein: 22.5, fat: 2.6, carbs: 0 }, tags: ['meat'], fdcId: 1 },
  { id: 'eggs', name: 'Eggs', category: 'protein', ultraProcessed: false, portionG: 100, per100g: { kcal: 143, protein: 12.6, fat: 9.5, carbs: 0.7 }, tags: ['egg'], fdcId: 2 },
  { id: 'tofu', name: 'Tofu', category: 'protein', ultraProcessed: false, portionG: 150, per100g: { kcal: 144, protein: 17.3, fat: 8.7, carbs: 2.8 }, tags: ['soy'], fdcId: 3 },
  { id: 'greek_yogurt', name: 'Greek yoghurt', category: 'dairy', ultraProcessed: false, portionG: 170, per100g: { kcal: 73, protein: 10, fat: 1.9, carbs: 3.9 }, tags: ['dairy'], fdcId: 4 },
  { id: 'broccoli', name: 'Broccoli', category: 'produce', ultraProcessed: false, portionG: 100, per100g: { kcal: 34, protein: 2.8, fat: 0.4, carbs: 6.6 }, tags: [], fdcId: 5 },
  { id: 'banana', name: 'Banana', category: 'produce', ultraProcessed: false, portionG: 120, per100g: { kcal: 89, protein: 1.1, fat: 0.3, carbs: 22.8 }, tags: [], fdcId: 6 },
  { id: 'spinach', name: 'Spinach', category: 'produce', ultraProcessed: false, portionG: 60, per100g: { kcal: 23, protein: 2.9, fat: 0.4, carbs: 3.6 }, tags: [], fdcId: 7 },
  { id: 'rice', name: 'White rice (dry)', category: 'carb', ultraProcessed: false, portionG: 75, per100g: { kcal: 365, protein: 7.1, fat: 0.7, carbs: 80 }, tags: [], fdcId: 8 },
  { id: 'oats', name: 'Rolled oats', category: 'carb', ultraProcessed: false, portionG: 50, per100g: { kcal: 379, protein: 13.2, fat: 6.5, carbs: 67.7 }, tags: ['gluten'], fdcId: 9 },
  { id: 'olive_oil', name: 'Olive oil', category: 'fat', ultraProcessed: false, portionG: 10, per100g: { kcal: 884, protein: 0, fat: 100, carbs: 0 }, tags: [], fdcId: 10 },
  { id: 'peanut_butter', name: 'Peanut butter', category: 'fat', ultraProcessed: false, portionG: 20, per100g: { kcal: 588, protein: 25, fat: 50, carbs: 20 }, tags: ['nuts'], fdcId: 11 },
  { id: 'chips', name: 'Chips', category: 'snack', ultraProcessed: true, portionG: 30, per100g: { kcal: 536, protein: 7, fat: 35, carbs: 53 }, tags: [], fdcId: 12 },
  { id: 'beer', name: 'Beer', category: 'drink', ultraProcessed: false, portionG: 375, per100g: { kcal: 43, protein: 0.5, fat: 0, carbs: 3.6 }, tags: ['alcohol', 'gluten'], fdcId: 13 },
  { id: 'tuna_can', name: 'Tuna (canned)', category: 'protein', ultraProcessed: false, portionG: 95, per100g: { kcal: 116, protein: 25.5, fat: 0.8, carbs: 0 }, tags: ['seafood'], fdcId: 14 },
  { id: 'lentils_can', name: 'Lentils (canned)', category: 'protein', ultraProcessed: false, portionG: 130, per100g: { kcal: 116, protein: 9, fat: 0.4, carbs: 20 }, tags: [], fdcId: 15 },
  { id: 'milk', name: 'Milk', category: 'dairy', ultraProcessed: false, portionG: 250, per100g: { kcal: 60, protein: 3.3, fat: 3.2, carbs: 4.6 }, tags: ['dairy'], fdcId: 17 },
  { id: 'frozen_veg', name: 'Frozen mixed veg', category: 'produce', ultraProcessed: false, portionG: 150, per100g: { kcal: 64, protein: 2.9, fat: 0.5, carbs: 13 }, tags: [], fdcId: 16 },
]

export const TEST_FOOD_MAP = new Map(TEST_FOODS.map((f) => [f.id, f]))


const p = (id: string, foodId: string, store: GroceryProduct['store'], packGrams: number, priceAUD: number | null): GroceryProduct => ({
  id,
  foodId,
  store,
  productName: id,
  packSize: `${packGrams} g`,
  packGrams,
  priceAUD,
  unitPriceText: '',
  url: 'https://example.test/' + id,
  checkedOn: '2026-10-18',
})

/** Fixture catalogue for unit tests (prices are made up). */
export const TEST_CATALOG: GroceryProduct[] = [
  p('chicken-1kg', 'chicken_breast', 'Coles', 1000, 13),
  p('chicken-500g-premium', 'chicken_breast', 'Woolworths', 500, 11),
  p('eggs-12', 'eggs', 'ALDI', 700, 6),
  p('tuna-95g', 'tuna_can', 'Woolworths', 95, 1.5),
  p('lentils-400g', 'lentils_can', 'ALDI', 250, 1),
  p('tofu-450g', 'tofu', 'Coles', 450, 3.5),
  p('yogurt-1kg', 'greek_yogurt', 'Woolworths', 1000, 6),
  p('broccoli-each', 'broccoli', 'Coles', 350, 2.5),
  p('frozen-veg-1kg', 'frozen_veg', 'ALDI', 1000, 3),
  p('bananas-1kg', 'banana', 'Woolworths', 1000, 4),
  p('rice-1kg', 'rice', 'ALDI', 1000, 2),
  p('oats-1kg', 'oats', 'Coles', 1000, 2.5),
  p('pb-375g', 'peanut_butter', 'ALDI', 375, 3),
  p('milk-2l', 'milk', 'ALDI', 2000, 3.1),
  p('mystery-unpriced', 'chicken_breast', 'Coles', 1000, null),
]
