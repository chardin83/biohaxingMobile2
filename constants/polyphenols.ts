export const POLYPHENOL_TYPE_KEYS = [
  'polyphenols_total',
  'flavonoids_total',
  'flavonoids',
  'anthocyanins',
  'catechins',
  'flavanols',
  'flavonols',
  'quercetin',
  'ellagitannins',
] as const;

export type PolyphenolTypeKey = typeof POLYPHENOL_TYPE_KEYS[number];
