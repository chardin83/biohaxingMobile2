export const tipGroupIds = [
  'breathwork_parasympathetic',
  'sleep_optimization_recovery',
  'adaptogenic_herbs',
  'medicinal_mushrooms',
  'probiotics_microbiota',
  'fiber_microbiome',
  'sulfate',
  'amino_acids',
  'light_infrared',
  'light_sleep',
  'nitric_oxide',
] as const;

export type TipGroupId = (typeof tipGroupIds)[number];
