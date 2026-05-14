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
