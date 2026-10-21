import type { BarcodeProduct, BarcodeProductType } from '@/services/openFoodFacts';

export type KnownBarcodeNutrition = Partial<Record<'calories' | 'protein' | 'carbohydrates' | 'fat' | 'fiber' | 'caffeineMg' | 'alcoholGrams', number>>;

export type BarcodeEnrichmentInput = {
  barcode: string;
  name: string;
  brand?: string;
  ingredientsText?: string;
  amount: number;
  unit: 'g' | 'ml';
  knownNutritionPer100: KnownBarcodeNutrition;
};

export type BarcodeAnalysisContext = {
  product: BarcodeProduct;
  amount: number;
  productType: BarcodeProductType;
};
