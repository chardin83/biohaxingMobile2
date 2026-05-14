export const POLYPHENOL_TYPE_KEYS = [
  'polyphenols_total',
  'phenolic_acids',
  'flavonoids_total',
  'flavonoids',
  'anthocyanins',
  'catechins',
  'flavanols',
  'flavonols',
  'quercetin',
  'ellagitannins',
  'lignans',
] as const;

export type PolyphenolType = typeof POLYPHENOL_TYPE_KEYS[number];

export const isPolyphenolTargetTag = (tag: string): tag is PolyphenolType =>
  POLYPHENOL_TYPE_KEYS.includes(tag as PolyphenolType);
