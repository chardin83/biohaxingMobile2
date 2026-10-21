import type { MineralType } from '@/constants/minerals';
import type { VitaminType } from '@/constants/vitamins';

const VITAMIN_FIELDS: Partial<Record<VitaminType, string[]>> = {
  vitamin_a: ['vitamin-a'],
  vitamin_c: ['vitamin-c'],
  vitamin_d: ['vitamin-d'],
  vitamin_e: ['vitamin-e'],
  vitamin_k: ['vitamin-k'],
  vitamin_b1: ['vitamin-b1'],
  vitamin_b2: ['vitamin-b2'],
  vitamin_b3: ['vitamin-pp', 'vitamin-b3'],
  vitamin_b5: ['pantothenic-acid', 'vitamin-b5'],
  vitamin_b6: ['vitamin-b6'],
  vitamin_b7: ['biotin', 'vitamin-b7'],
  vitamin_b9: ['folates', 'folic-acid', 'vitamin-b9'],
  vitamin_b12: ['vitamin-b12'],
};
const MINERAL_FIELDS: Partial<Record<MineralType, string[]>> = {
  sodium: ['sodium'],
  potassium: ['potassium'],
  magnesium: ['magnesium'],
  calcium: ['calcium'],
  iron: ['iron'],
  zinc: ['zinc'],
  selenium: ['selenium'],
  iodine: ['iodine'],
  phosphorus: ['phosphorus'],
  copper: ['copper'],
  manganese: ['manganese'],
};

function readMilligrams<T extends string>(nutriments: Record<string, unknown>, fields: Partial<Record<T, string[]>>): Partial<Record<T, number>> | undefined {
  const result: Partial<Record<T, number>> = {};
  for (const [key, aliases] of Object.entries(fields) as [T, string[]][]) {
    for (const alias of aliases) {
      const value = nutriments[`${alias}_100g`];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) continue;
      // OFF normalizes mass nutrients to grams; Biohaxing stores all micronutrients in mg.
      result[key] = value * 1000;
      break;
    }
  }
  return Object.keys(result).length ? result : undefined;
}

export function getOpenFoodFactsMicronutrients(nutriments: Record<string, unknown>) {
  return {
    vitaminsMgPer100g: readMilligrams(nutriments, VITAMIN_FIELDS),
    mineralsMgPer100g: readMilligrams(nutriments, MINERAL_FIELDS),
  };
}

export function scaleBarcodeMicronutrients(
  product: {
    vitaminsMgPer100g?: Partial<Record<VitaminType, number>>;
    mineralsMgPer100g?: Partial<Record<MineralType, number>>;
  },
  factor: number
) {
  const scale = <T extends string>(values: Partial<Record<T, number>> | undefined) =>
    values && Object.fromEntries(Object.entries(values).map(([key, value]) => [key, (value as number) * factor]));
  return {
    ...(product.vitaminsMgPer100g && { vitaminsByType: scale(product.vitaminsMgPer100g) }),
    ...(product.mineralsMgPer100g && { mineralsByType: scale(product.mineralsMgPer100g) }),
  };
}
