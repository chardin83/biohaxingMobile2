export const FIBER_TYPE_KEYS = [
  'fiber_total',
  'fiber_gel_forming',
  'fiber_non_gel_forming',
  'fiber_fermentable',
] as const;

export type FiberTypeKey = typeof FIBER_TYPE_KEYS[number];
