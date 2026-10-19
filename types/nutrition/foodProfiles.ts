import { USDA_FOOD_NUTRIENT_PROFILES } from './foodCatalog';
import { FOOD_SUPPLEMENTARY_PROFILES } from './foodCatalogSupplementary';
import type { FoodNutrientProfile } from './foodCatalogTypes';
import { FOOD_IMAGES } from './foodImages';

export type { FoodNutrientProfile, FoodServing } from './foodCatalogTypes';
export { FOOD_IMAGES };
export type FoodKey = keyof typeof FOOD_SUPPLEMENTARY_PROFILES;
export type FoodImageSourceMap = Partial<Record<FoodKey, ReturnType<typeof require>>>;

// Consumers use this combined view; source data stays separate in the two files.
export const FOOD_NUTRIENT_PROFILES = Object.fromEntries(
  Object.entries(FOOD_SUPPLEMENTARY_PROFILES).map(([key, supplementary]) => {
    const usda: Partial<FoodNutrientProfile> = USDA_FOOD_NUTRIENT_PROFILES[key as keyof typeof USDA_FOOD_NUTRIENT_PROFILES] ?? {};
    const extra: Partial<FoodNutrientProfile> = supplementary;
    return [key, {
      ...extra,
      ...usda,
      fiberByType: { ...extra.fiberByType, ...usda.fiberByType },
      mineralsByType: { ...extra.mineralsByType, ...usda.mineralsByType },
      vitaminsByType: { ...extra.vitaminsByType, ...usda.vitaminsByType },
      aminoAcidsByType: { ...extra.aminoAcidsByType, ...usda.aminoAcidsByType },
    }];
  })
) as Record<FoodKey, FoodNutrientProfile>;
