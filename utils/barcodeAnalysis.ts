import type { NutritionData } from '@/app/context/storage/nutrition/nutritionTypes';
import type { BarcodeAnalysisContext, BarcodeEnrichmentInput, KnownBarcodeNutrition } from '@/types/nutrition/barcodeAnalysis';
import type { AiEstimatedNutrient } from '@/types/nutrition/nutrientProvenance';

import { hasEnergyConflict } from './openFoodFactsEnergy';

/** Keep missing or conflicting label values unlocked; declared zero and manual corrections remain authoritative. */
export function buildBarcodeEnrichmentInput({ product, amount, productType }: BarcodeAnalysisContext): BarcodeEnrichmentInput {
  const knownNutritionPer100: KnownBarcodeNutrition = {};
  const energyConflict = hasEnergyConflict(product.nutrition.caloriesPer100g, product.nutrition.energyKjPer100g);
  const values = {
    calories: product.nutrition.caloriesPer100g,
    protein: product.nutrition.proteinPer100g,
    carbohydrates: product.nutrition.carbohydratesPer100g,
    fat: product.nutrition.fatPer100g,
    fiber: product.nutrition.fiberPer100g,
    caffeineMg: product.nutrition.caffeineMgPer100g,
    alcoholGrams: product.nutrition.alcoholGramsPer100g,
  };
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) knownNutritionPer100[key as keyof KnownBarcodeNutrition] = value;
  }
  return {
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    ingredientsText: product.ingredientsText,
    amount,
    productType,
    unit: productType === 'drink' ? 'ml' : 'g',
    knownNutritionPer100,
    // Explicitly request review of contradictory data, rather than presenting it as missing.
    ...(energyConflict && { energyReview: { kcalPer100: product.nutrition.caloriesPer100g!, kjPer100: product.nutrition.energyKjPer100g! } }),
  };
}

/** Track AI provenance independently of the displayed amount or rounding. */
export function getAiEstimatedBarcodeNutrients(context: BarcodeAnalysisContext, analysis: NutritionData): AiEstimatedNutrient[] {
  const input = buildBarcodeEnrichmentInput(context);
  const keys: AiEstimatedNutrient[] = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'caffeineMg', 'alcoholGrams'];
  return keys.filter(key => {
    const value = analysis[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) return false;
    if (key === 'calories' && input.energyReview) return true;
    return input.knownNutritionPer100[key] === undefined;
  });
}
