import type { MineralType } from '@/constants/minerals';
import type { VitaminType } from '@/constants/vitamins';
import type { BarcodeProduct, BarcodeProductType } from '@/services/openFoodFacts';

export type KnownBarcodeNutrition = Partial<Record<'calories' | 'protein' | 'carbohydrates' | 'fat' | 'fiber' | 'caffeineMg' | 'alcoholGrams' | 'glycemicIndex', number>>;

export type BarcodeEnrichmentInput = {
  barcode: string;
  name: string;
  brand?: string;
  ingredientsText?: string;
  amount: number;
  unit: 'g' | 'ml';
  productType: BarcodeProductType;
  knownNutritionPer100: KnownBarcodeNutrition;
  knownVitaminsMgPer100?: Partial<Record<VitaminType, number>>;
  knownMineralsMgPer100?: Partial<Record<MineralType, number>>;
  energyReview?: { kcalPer100: number; kjPer100: number };
};

export type BarcodeAnalysisContext = {
  product: BarcodeProduct;
  amount: number;
  productType: BarcodeProductType;
};
