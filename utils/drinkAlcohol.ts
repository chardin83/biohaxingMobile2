import { ALCOHOL_TYPES } from '@/services/gptServices';
import type { BarcodeProduct } from '@/services/openFoodFacts';

export function getAlcoholPercent(product: BarcodeProduct): number | undefined {
  if (product.alcoholPercent !== undefined) return product.alcoholPercent;
  if (product.nutrition.alcoholGramsPer100g !== undefined && product.nutrition.alcoholGramsPer100g > 0) return product.nutrition.alcoholGramsPer100g / 0.789;
  if (!ALCOHOL_TYPES.some(type => type === product.drinkType)) return undefined;
  if (product.drinkType === 'beer') return 5;
  if (product.drinkType === 'red_wine') return 12.5;
  if (product.drinkType === 'white_wine') return 12;
  return 40;
}

export function withAlcoholPercent(product: BarcodeProduct, percent: number): BarcodeProduct {
  const previousGrams = product.composition?.alcoholGrams ?? product.nutrition.alcoholGramsPer100g ?? 0;
  const alcoholGrams = percent * 0.789;
  const calorieDelta = (alcoholGrams - previousGrams) * 7;
  return {
    ...product,
    alcoholPercent: percent,
    nutrition: { ...product.nutrition, alcoholGramsPer100g: alcoholGrams, caloriesPer100g: Math.max(0, (product.nutrition.caloriesPer100g ?? 0) + calorieDelta) },
    ...(product.composition && { composition: { ...product.composition, alcoholGrams, calories: Math.max(0, product.composition.calories + calorieDelta) } }),
  };
}

export function hasAlcohol(drink: { type?: string; alcoholPercent?: number }): boolean {
  return drink.alcoholPercent === undefined
    ? ALCOHOL_TYPES.some(type => type === drink.type)
    : drink.alcoholPercent > 0;
}
