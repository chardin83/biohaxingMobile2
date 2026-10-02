import type { ImageSourcePropType } from 'react-native';

import type { MealEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import type { BarcodeProduct } from '@/services/openFoodFacts';
import { FOOD_IMAGES, FOOD_NUTRIENT_PROFILES } from '@/types/nutrition/foodCatalog';

export type FoodKey = keyof typeof FOOD_NUTRIENT_PROFILES;

export const FOOD_KEYS = Object.keys(FOOD_NUTRIENT_PROFILES) as FoodKey[];

export const getFoodProduct = (key: FoodKey, name: string): BarcodeProduct => {
  const { defaultServings, ...composition } = FOOD_NUTRIENT_PROFILES[key];

  return {
    barcode: '',
    name,
    quantityValue: defaultServings[1]?.grams ?? defaultServings[0]?.grams ?? 100,
    quantityUnit: 'g',
    productType: 'food',
    fromCatalog: true,
    image: FOOD_IMAGES[key] as ImageSourcePropType | undefined,
    composition,
    servings: defaultServings,
    nutrition: {},
  };
};

// A logged meal is treated as 100 % of its own nutrition so the amount can be scaled in percent.
export const getMealProduct = (meal: MealEntry): BarcodeProduct => {
  const composition: Record<string, unknown> = { ...meal };
  delete composition.id;
  delete composition.recordedAt;
  delete composition.type;
  delete composition.name;

  return {
    barcode: '',
    name: meal.name,
    quantityValue: 100,
    quantityUnit: '%',
    productType: 'food',
    fromCatalog: true,
    sourceMealId: meal.id,
    composition: composition as NonNullable<BarcodeProduct['composition']>,
    nutrition: {},
  };
};
