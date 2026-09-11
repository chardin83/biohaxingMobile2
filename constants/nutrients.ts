export const NUTRIENT_TYPE_KEYS = [
  'caffeine',
] as const;

export type NutrientType = (typeof NUTRIENT_TYPE_KEYS)[number];

export const isNutrientTargetTag = (tag: string): tag is NutrientType =>
  NUTRIENT_TYPE_KEYS.includes(tag as NutrientType);

export const NUTRIENT_DISPLAY_UNITS: Record<NutrientType, string> = {
  caffeine: 'mg',
};
