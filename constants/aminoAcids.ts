export const ESSENTIAL_AMINO_ACID_KEYS = [
  'histidine',
  'isoleucine',
  'leucine',
  'lysine',
  'methionine',
  'phenylalanine',
  'threonine',
  'tryptophan',
  'valine',
] as const;

export const OTHER_AMINO_ACID_KEYS = [
  'arginine',
  'cysteine',
  'glutamine',
  'glycine',
  'proline',
  'tyrosine',
] as const;

export const ALL_AMINO_ACID_KEYS = [
  ...ESSENTIAL_AMINO_ACID_KEYS,
  ...OTHER_AMINO_ACID_KEYS,
] as const;

export type EssentialAminoAcidKey = typeof ESSENTIAL_AMINO_ACID_KEYS[number];
export type OtherAminoAcidKey = typeof OTHER_AMINO_ACID_KEYS[number];
export type AminoAcidKey = typeof ALL_AMINO_ACID_KEYS[number];
