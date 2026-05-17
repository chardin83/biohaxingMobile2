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

export type MineralType = (typeof MINERAL_TYPE_KEYS)[number];

export const isMineralTargetTag = (tag: string): tag is MineralType =>
  MINERAL_TYPE_KEYS.includes(tag as MineralType);

export const MINERAL_DISPLAY_UNITS: Record<MineralType, string> = {
  minerals_total: 'mg',
  sodium: 'mg',
  potassium: 'mg',
  magnesium: 'mg',
  calcium: 'mg',
  iron: 'mg',
  zinc: 'mg',
  selenium: 'μg',
  iodine: 'μg',
  phosphorus: 'mg',
  copper: 'mg',
  manganese: 'mg',
};
