export const VITAMIN_TYPE_KEYS = [
  'vitamins_total',
  'vitamin_a',
  'vitamin_c',
  'vitamin_d',
  'vitamin_e',
  'vitamin_k',
  'vitamin_b1',
  'vitamin_b2',
  'vitamin_b3',
  'vitamin_b5',
  'vitamin_b6',
  'vitamin_b7',
  'vitamin_b9',
  'vitamin_b12',
] as const;

export type VitaminType = (typeof VITAMIN_TYPE_KEYS)[number];

export const isVitaminTargetTag = (tag: string): tag is VitaminType =>
  VITAMIN_TYPE_KEYS.includes(tag as VitaminType);

export const VITAMIN_DISPLAY_UNITS: Record<VitaminType, string> = {
  vitamins_total: 'mg',
  vitamin_a: 'mg',
  vitamin_c: 'mg',
  vitamin_d: 'μg',
  vitamin_e: 'mg',
  vitamin_k: 'mg',
  vitamin_b1: 'mg',
  vitamin_b2: 'mg',
  vitamin_b3: 'mg',
  vitamin_b5: 'mg',
  vitamin_b6: 'mg',
  vitamin_b7: 'mg',
  vitamin_b9: 'μg',
  vitamin_b12: 'μg',
};
