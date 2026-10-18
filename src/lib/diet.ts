import type { Diet, Food, FoodTag, Profile } from '../types'

const EXCLUDED_BY_DIET: Record<Diet, FoodTag[]> = {
  any: [],
  'no-pork': ['pork'],
  pescatarian: ['meat'],
  vegetarian: ['meat', 'seafood'],
  vegan: ['meat', 'seafood', 'dairy', 'egg'],
}

export function allowedFood(food: Food, p: Pick<Profile, 'diet' | 'allergies'>): boolean {
  const blocked = new Set<FoodTag>([...EXCLUDED_BY_DIET[p.diet], ...p.allergies])
  return !food.tags.some((t) => blocked.has(t))
}

/**
 * Meat, fish, eggs, legumes and soy always count; dairy only with at least 8 g protein
 * per 100 kcal (yoghurt, cottage cheese, skim milk — not full-cream milk or cheese).
 */
export function isProteinSource(food: Food): boolean {
  if (food.category === 'protein') return true
  return food.category === 'dairy' && food.per100g.protein / Math.max(1, food.per100g.kcal) >= 0.08
}
