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

export type EssentialAminoAcidType = typeof ESSENTIAL_AMINO_ACID_KEYS[number];
export type OtherAminoAcidType = typeof OTHER_AMINO_ACID_KEYS[number];
export type AminoAcidType = typeof ALL_AMINO_ACID_KEYS[number];

export const isAminoAcidTargetTag = (tag: string): boolean =>
  ALL_AMINO_ACID_KEYS.includes(tag as AminoAcidType);


