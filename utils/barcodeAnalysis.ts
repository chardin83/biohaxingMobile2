import type { BarcodeAnalysisContext, BarcodeEnrichmentInput, KnownBarcodeNutrition } from '@/types/nutrition/barcodeAnalysis';

/** Keep missing label values absent; a declared zero is still authoritative. */
export function buildBarcodeEnrichmentInput({ product, amount, productType }: BarcodeAnalysisContext): BarcodeEnrichmentInput {
  const knownNutritionPer100: KnownBarcodeNutrition = {};
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
    unit: productType === 'drink' ? 'ml' : 'g',
    knownNutritionPer100,
  };
}
