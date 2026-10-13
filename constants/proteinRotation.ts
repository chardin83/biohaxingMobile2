// WHO/FAO/UNU (2007), adult mean requirements; FAO (2013), Table 3.
// mg/kg/day, not mg/g protein. SAA and AAA are combined requirements.
export const WHO_ADULT_AMINO_ACID_TARGETS = [
  { tag: 'histidine', amount: 0, amountPerKg: 10, unit: 'mg' },
  { tag: 'isoleucine', amount: 0, amountPerKg: 20, unit: 'mg' },
  { tag: 'leucine', amount: 0, amountPerKg: 39, unit: 'mg' },
  { tag: 'lysine', amount: 0, amountPerKg: 30, unit: 'mg' },
  { tag: 'methionine', amount: 0, amountPerKg: 15, unit: 'mg', trackingKeys: ['methionine', 'cysteine'], labelKey: 'methionineCysteine' },
  { tag: 'phenylalanine', amount: 0, amountPerKg: 25, unit: 'mg', trackingKeys: ['phenylalanine', 'tyrosine'], labelKey: 'phenylalanineTyrosine' },
  { tag: 'threonine', amount: 0, amountPerKg: 15, unit: 'mg' },
  { tag: 'tryptophan', amount: 0, amountPerKg: 4, unit: 'mg' },
  { tag: 'valine', amount: 0, amountPerKg: 26, unit: 'mg' },
] as const;
