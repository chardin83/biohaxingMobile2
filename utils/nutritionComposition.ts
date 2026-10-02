import type { NutritionComposition } from '@/types/nutrition/nutritionProfile';

const scaleRecord = <T extends string>(record: Partial<Record<T, number>> | undefined, factor: number) =>
  record && (Object.fromEntries(Object.entries(record).map(([key, value]) => [key, (value as number) * factor])) as Partial<Record<T, number>>);

// Scales a per-100g composition to the given amount (factor = amount / 100).
export const scaleNutritionComposition = (composition: NutritionComposition, factor: number): NutritionComposition => {
  const round1 = (value: number) => Math.round(value * 10) / 10;

  return {
    ...composition,
    calories: Math.round(composition.calories * factor),
    protein: round1(composition.protein * factor),
    carbohydrates: round1(composition.carbohydrates * factor),
    fat: round1(composition.fat * factor),
    fiber: round1(composition.fiber * factor),
    fiberByType: scaleRecord(composition.fiberByType, factor),
    fiberSubtypeTotals: scaleRecord(composition.fiberSubtypeTotals, factor),
    polyphenolByType: scaleRecord(composition.polyphenolByType, factor),
    vitaminsByType: scaleRecord(composition.vitaminsByType, factor),
    aminoAcidsByType: scaleRecord(composition.aminoAcidsByType, factor),
    mineralsByType: scaleRecord(composition.mineralsByType, factor),
  };
};
