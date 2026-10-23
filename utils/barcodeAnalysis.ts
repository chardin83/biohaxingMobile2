import type { NutritionData } from '@/app/context/storage/nutrition/nutritionTypes';
import { MINERAL_TYPE_KEYS } from '@/constants/minerals';
import { VITAMIN_TYPE_KEYS } from '@/constants/vitamins';
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
    glycemicIndex: product.nutrition.glycemicIndex ?? product.composition?.glycemicIndex,
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
    ...(product.nutrition.vitaminsMgPer100g && { knownVitaminsMgPer100: product.nutrition.vitaminsMgPer100g }),
    ...(product.nutrition.mineralsMgPer100g && { knownMineralsMgPer100: product.nutrition.mineralsMgPer100g }),
    // Explicitly request review of contradictory data, rather than presenting it as missing.
    ...(energyConflict && { energyReview: { kcalPer100: product.nutrition.caloriesPer100g!, kjPer100: product.nutrition.energyKjPer100g! } }),
  };
}

/** Track AI provenance independently of the displayed amount or rounding. */
export function getAiEstimatedBarcodeNutrients(context: BarcodeAnalysisContext, analysis: NutritionData): AiEstimatedNutrient[] {
  const input = buildBarcodeEnrichmentInput(context);
  const keys: AiEstimatedNutrient[] = ['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'caffeineMg', 'alcoholGrams', 'glycemicIndex'];
  return keys.filter(key => {
    const value = analysis[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) return false;
    if (key === 'calories' && input.energyReview) return true;
    return input.knownNutritionPer100[key] === undefined;
  });
}

function getEstimatedMicronutrientKeys<T extends string>(keys: readonly T[], reported: unknown, known?: Partial<Record<T, number>>): T[] {
  if (!reported || typeof reported !== 'object' || Array.isArray(reported)) return [];
  const values = reported as Record<string, unknown>;
  return keys.filter(key => typeof values[key] === 'number' && Number.isFinite(values[key]) && known?.[key] === undefined);
}

export function getAiEstimatedBarcodeMicronutrients(context: BarcodeAnalysisContext, reported?: { vitamins?: unknown; minerals?: unknown }) {
  return {
    aiEstimatedVitamins: getEstimatedMicronutrientKeys(
      VITAMIN_TYPE_KEYS.filter(key => key !== 'vitamins_total'),
      reported?.vitamins,
      context.product.nutrition.vitaminsMgPer100g
    ),
    aiEstimatedMinerals: getEstimatedMicronutrientKeys(
      MINERAL_TYPE_KEYS.filter(key => key !== 'minerals_total'),
      reported?.minerals,
      context.product.nutrition.mineralsMgPer100g
    ),
  };
}
