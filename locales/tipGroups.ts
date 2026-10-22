export const tipGroupIds = [
  'breathwork_parasympathetic',
  'sleep_optimization_recovery',
  'adaptogenic_herbs',
  'medicinal_mushrooms',
  'probiotics_microbiota',
  'fiber_microbiome',
  'sulfate',
] as const;

export type TipGroupId = (typeof tipGroupIds)[number];
