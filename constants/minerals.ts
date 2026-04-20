export const MINERAL_TYPE_KEYS = [
  'minerals_total',
  'sodium',
  'potassium',
  'magnesium',
  'calcium',
  'iron',
  'zinc',
  'selenium',
  'iodine',
  'phosphorus',
  'copper',
  'manganese',
] as const;

export type MineralTypeKey = (typeof MINERAL_TYPE_KEYS)[number];
