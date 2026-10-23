/** GI is dimensionless and may exceed 100; missing or invalid data stays unknown. */
export const normalizeGlycemicIndex = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;

/** Carbohydrate-weighted estimate using only entries with known GI and positive carbs. */
export function getWeightedGlycemicIndex(entries: readonly { glycemicIndex?: number; carbohydrates: number }[]): number | undefined {
  let weighted = 0;
  let carbohydrates = 0;
  for (const entry of entries) {
    const gi = normalizeGlycemicIndex(entry.glycemicIndex);
    if (gi === undefined || !Number.isFinite(entry.carbohydrates) || entry.carbohydrates <= 0) continue;
    weighted += gi * entry.carbohydrates;
    carbohydrates += entry.carbohydrates;
  }
  return carbohydrates > 0 ? weighted / carbohydrates : undefined;
}
