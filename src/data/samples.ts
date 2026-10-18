import type { FridgeItem } from '../types'

export interface DemoFridge {
  id: string
  name: string
  blurb: string
  /** What the (simulated) scanner returns — includes deliberate mistakes. */
  predicted: FridgeItem[]
  /** What is really in the illustration; correcting `predicted` to this creates labels. */
  actual: FridgeItem[]
  mistakes: string
}

const i = (foodId: string, label: string, grams: number, useWithinDays: number | null = null, confidence?: number): FridgeItem =>
  confidence === undefined ? { foodId, label, grams, useWithinDays } : { foodId, label, grams, useWithinDays, confidence }

export const DEMO_FRIDGES: DemoFridge[] = [
  {
    id: 'cut-week',
    name: 'Cut week',
    blurb: 'Meal-prep fridge of a student on a fat-loss phase',
    actual: [
      i('chicken_breast', 'Chicken breast', 1000, 3),
      i('eggs', 'Eggs (dozen)', 700),
      i('greek_yogurt', 'Greek yoghurt tub', 1000, 6),
      i('broccoli', 'Broccoli', 350, 4),
      i('spinach', 'Baby spinach bag', 120, 3),
      i('banana', 'Bananas', 600, 4),
      i('frozen_veg', 'Frozen mixed veg', 1000),
      i('rice', 'White rice', 1000),
      i('oats', 'Rolled oats', 750),
      i('olive_oil', 'Olive oil', 500),
    ],
    predicted: [
      i('chicken_breast', 'Chicken breast', 1000, 3, 0.93),
      i('eggs', 'Eggs (dozen)', 700, null, 0.97),
      i('milk', 'Milk carton?', 1000, 6, 0.48),
      i('broccoli', 'Broccoli', 350, 4, 0.9),
      i('banana', 'Bananas', 600, 4, 0.95),
      i('frozen_veg', 'Frozen mixed veg', 1000, null, 0.81),
      i('rice', 'White rice', 1000, null, 0.77),
      i('oats', 'Rolled oats', 750, null, 0.72),
      i('olive_oil', 'Olive oil', 500, null, 0.86),
    ],
    mistakes: 'The yoghurt tub was read as milk, and the bag of spinach behind it was missed.',
  },
  {
    id: 'budget-bulk',
    name: 'Budget bulk',
    blurb: 'Cheap calories and protein for a muscle-gain phase',
    actual: [
      i('chicken_thigh', 'Chicken thigh fillets', 1000, 2),
      i('eggs', 'Eggs (dozen)', 700),
      i('milk', 'Full-cream milk', 2000, 7),
      i('lentils_can', 'Canned lentils x3', 750),
      i('peanut_butter', 'Peanut butter', 375),
      i('cheddar', 'Cheddar block', 250),
      i('banana', 'Bananas', 1000, 4),
      i('frozen_veg', 'Frozen mixed veg', 1000),
      i('oats', 'Rolled oats', 1000),
      i('rice', 'White rice', 2000),
    ],
    predicted: [
      i('chicken_breast', 'Chicken fillets', 1000, 2, 0.62),
      i('eggs', 'Eggs (dozen)', 700, null, 0.96),
      i('milk', 'Full-cream milk', 2000, 7, 0.94),
      i('other', 'Tins (unknown)', 750, null, 0.4),
      i('peanut_butter', 'Peanut butter', 375, null, 0.88),
      i('cheddar', 'Cheddar block', 250, null, 0.83),
      i('banana', 'Bananas', 1000, 4, 0.95),
      i('frozen_veg', 'Frozen mixed veg', 1000, null, 0.8),
      i('oats', 'Rolled oats', 1000, null, 0.75),
      i('rice', 'White rice', 2000, null, 0.79),
    ],
    mistakes: 'Chicken thigh was read as breast, and the lentil tins were not recognised.',
  },
  {
    id: 'takeaway-week',
    name: 'Takeaway week',
    blurb: 'Exam-week fridge: drinks, snacks and leftovers',
    actual: [
      i('soft_drink', 'Cola bottle', 1250),
      i('energy_drink', 'Energy drinks x2', 500),
      i('beer', 'Beer x6', 2250),
      i('frozen_pizza', 'Frozen pizza', 400),
      i('chips', 'Potato chips', 170),
      i('ham', 'Sliced ham', 100, 2),
      i('cheddar', 'Cheddar slices', 150),
      i('eggs', 'Eggs (half dozen)', 350),
      i('carrot', 'One carrot', 80, 2),
      i('other', 'Leftover pad thai', 400, 1),
    ],
    predicted: [
      i('soft_drink', 'Cola bottle', 1250, null, 0.98),
      i('energy_drink', 'Energy drinks x2', 500, null, 0.9),
      i('beer', 'Beer x6', 2250, null, 0.97),
      i('frozen_pizza', 'Frozen pizza', 400, null, 0.85),
      i('chips', 'Potato chips', 170, null, 0.82),
      i('chicken_breast', 'Sliced meat', 100, 2, 0.51),
      i('cheddar', 'Cheddar slices', 150, null, 0.8),
      i('eggs', 'Eggs (half dozen)', 350, null, 0.93),
      i('other', 'Leftover pad thai', 400, 1, 0.66),
    ],
    mistakes: 'The ham was read as chicken, and the lone carrot in the crisper was missed.',
  },
]

export const DEMO_MAP = new Map(DEMO_FRIDGES.map((d) => [d.id, d]))
