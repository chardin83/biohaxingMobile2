export type MicrobiomeSupportEntry = {
  microbe: string;
  supportLevel: 'high' | 'medium' | 'low' | 'unknown';
  linkedNutrients: string[];
  likelyFoods: string[];
  rationale?: string;
};
