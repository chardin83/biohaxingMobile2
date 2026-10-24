/** GI is dimensionless and may exceed 100; missing or invalid data stays unknown. */
export const normalizeGlycemicIndex = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;

export type GlycemicIndexEntry = { glycemicIndex?: number; carbohydrates: number };

/** Missing GI stays in the coverage denominator; carbohydrate-free food is excluded. */
export function getGlycemicIndexSummary(entries: readonly GlycemicIndexEntry[]) {
  let weighted = 0;
  let knownCarbohydrates = 0;
  let totalCarbohydrates = 0;
  for (const entry of entries) {
    if (!Number.isFinite(entry.carbohydrates) || entry.carbohydrates <= 0) continue;
    totalCarbohydrates += entry.carbohydrates;
    const gi = normalizeGlycemicIndex(entry.glycemicIndex);
    if (gi === undefined) continue;
    knownCarbohydrates += entry.carbohydrates;
    weighted += gi * entry.carbohydrates;
  }
  return {
    glycemicIndex: knownCarbohydrates > 0 ? weighted / knownCarbohydrates : undefined,
    knownCarbohydrates,
    totalCarbohydrates,
    coverage: totalCarbohydrates > 0 ? knownCarbohydrates / totalCarbohydrates * 100 : undefined,
  };
}

/** Carbohydrate-weighted estimate using only entries with known GI and positive carbs. */
export function getWeightedGlycemicIndex(entries: readonly GlycemicIndexEntry[]): number | undefined {
  return getGlycemicIndexSummary(entries).glycemicIndex;
}

export type GlycemicIndexCoveragePoint = {
  date: string;
  knownCarbohydrates: number;
  totalCarbohydrates: number;
};

/** Weight period coverage by carbs, including days on which every GI is unknown. */
export function getGlycemicIndexCoverage(points: readonly GlycemicIndexCoveragePoint[], start: string, end: string): number | undefined {
  let known = 0;
  let total = 0;
  for (const point of points) {
    if (point.date < start || point.date > end) continue;
    known += point.knownCarbohydrates;
    total += point.totalCarbohydrates;
  }
  return total > 0 ? known / total * 100 : undefined;
}
