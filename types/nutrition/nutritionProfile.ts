import { type AminoAcidType } from '@/constants/aminoAcids';
import { type FiberSubtype, type FiberType } from '@/constants/fiber';
import { type MineralType } from '@/constants/minerals';
import { type PolyphenolType } from '@/constants/polyphenols';
import { type VitaminType } from '@/constants/vitamins';
import { type MicrobiomeSupportEntry } from '@/types/microbiome';

export type NutritionComposition = {
  // Stored per 100g edible portion.
  // Unit conventions:
  // - calories: kcal
  // - protein/carbohydrates/fat/fiber/fiberByType/fiberSubtypeTotals: grams
  // - vitaminsByType/mineralsByType/aminoAcidsByType: milligrams (mg)
  //   Example: vitamin_a: 0.0035 means 0.0035 mg (= 3.5 mcg)
  // - polyphenolByType: milligrams (mg)
  protein: number;
  calories: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  fiberByType?: Partial<Record<FiberType, number>>;
  fiberSubtypeTotals?: Partial<Record<FiberSubtype, number>>;
  polyphenolByType?: Partial<Record<PolyphenolType, number>>;
  vitaminsByType?: Partial<Record<VitaminType, number>>;
  aminoAcidsByType?: Partial<Record<AminoAcidType, number>>;
  mineralsByType?: Partial<Record<MineralType, number>>;
  microbiomeSupport?: MicrobiomeSupportEntry[];
};
