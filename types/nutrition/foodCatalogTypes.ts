import type { FoodColor } from './foodColor';
import type { NutritionComposition } from './nutritionProfile';

export type FoodServing = { grams: number; labelKey?: string };

export type FoodNutrientProfile = NutritionComposition & {
  sulfurRichVegetable?: boolean;
  vegetableColor?: FoodColor;
  defaultServings: FoodServing[];
};
