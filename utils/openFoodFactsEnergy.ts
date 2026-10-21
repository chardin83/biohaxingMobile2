type EnergyNutriments = {
  'energy-kcal_100g'?: number;
  'energy-kj_100g'?: number;
  'energy_100g'?: number;
};

const isEnergyValue = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value) && value >= 0;

export function hasEnergyConflict(kcal: number | undefined, kj: number | undefined): boolean {
  if (!isEnergyValue(kcal) || !isEnergyValue(kj)) return false;
  const convertedKcal = kj / 4.184;
  return Math.abs(kcal - convertedKcal) > Math.max(5, convertedKcal * 0.05);
}

export function getOpenFoodFactsCalories(nutriments: EnergyNutriments): number | undefined {
  const kcal = nutriments['energy-kcal_100g'];
  if (isEnergyValue(kcal)) return kcal;
  // Conversion is only a fallback when no valid kcal value was supplied.
  const kj = nutriments.energy_100g ?? nutriments['energy-kj_100g'];
  return isEnergyValue(kj) ? kj / 4.184 : undefined;
}
