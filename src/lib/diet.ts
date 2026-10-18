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
