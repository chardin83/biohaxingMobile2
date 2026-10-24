import type { FoodColor } from './foodColor';
import type { NutritionComposition } from './nutritionProfile';

export type FoodServing = { grams: number; labelKey?: string };

export type FoodNutrientProfile = NutritionComposition & {
  sulfurRichVegetable?: boolean;
  vegetableColor?: FoodColor;
  /** Canonical plant identity, shared by preparations of the same plant. */
  plantName?: string;
  defaultServings: FoodServing[];
};
