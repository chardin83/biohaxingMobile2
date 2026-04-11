import { PlanCategory } from '@/types/planCategory';

type SupplementReference = {
  id: string;
};

export type TipArea = {
  id: string;
  descriptionKey: string;
};

export type TrainingRelation =
  | 'anytime'
  | 'preWorkout'
  | 'postWorkout'
  | 'avoidPreWorkout'
  | 'avoidPostWorkout'
  | 'avoidNearWorkout'; // generellt “inte nära pass” (t.ex. ±3–6h)

export type DayPart = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

export type TimeOfDayRule =
  | 'anytime'
  | 'avoidLateEvening' // koffein
  | 'avoidNight'; // ännu striktare om du vill

export type EvidenceConfidence = 'high' | 'medium' | 'low';

export type TargetPeriod = 'daily' | 'weekly';

export type FiberType =
  | 'fiber_total'
  | 'fiber_gel_forming'
  | 'fiber_non_gel_forming'
  | 'fiber_fermentable';

export type FiberCategory = Exclude<FiberType, 'fiber_total'>;

export type FiberSubtype =
  | 'beta_glucans'
  | 'pectin'
  | 'psyllium'
  | 'mucilage'
  | 'cellulose'
  | 'hemicellulose'
  | 'lignin'
  | 'arabinoxylan'
  | 'resistant_starch'
  | 'inulin'
  | 'fructooligosaccharides'
  | 'galactooligosaccharides'
  | 'pectic_oligosaccharides';

export const FIBER_SUBTYPE_LABELS: Record<FiberSubtype, string> = {
  beta_glucans: 'Beta-glukaner',
  pectin: 'Pektin',
  psyllium: 'Psyllium',
  mucilage: 'Slemfibrer (mucilage)',
  cellulose: 'Cellulosa',
  hemicellulose: 'Hemicellulosa',
  lignin: 'Lignin',
  arabinoxylan: 'Arabinoxylan',
  resistant_starch: 'Resistent stärkelse',
  inulin: 'Inulin',
  fructooligosaccharides: 'Fruktooligosackarider (FOS)',
  galactooligosaccharides: 'Galaktooligosackarider (GOS)',
  pectic_oligosaccharides: 'Pektiska oligosackarider',
};

// Canonical mapping: vilka fibertyper som hör till respektive kategori.
export const FIBER_CATEGORY_SUBTYPES: Record<FiberCategory, FiberSubtype[]> = {
  fiber_gel_forming: ['beta_glucans', 'pectin', 'psyllium', 'mucilage'],
  fiber_non_gel_forming: ['cellulose', 'hemicellulose', 'lignin', 'arabinoxylan'],
  fiber_fermentable: [
    'resistant_starch',
    'inulin',
    'fructooligosaccharides',
    'galactooligosaccharides',
    'pectic_oligosaccharides',
    'beta_glucans',
    'pectin',
    'mucilage',
  ],
};

export type PolyphenolType =
  | 'polyphenols_total'
  | 'flavonoids_total'
  | 'flavonoids' // parent category marker when exact subclass is unknown
  | 'anthocyanins'
  | 'catechins'
  | 'flavanols'
  | 'flavonols'
  | 'quercetin'
  | 'ellagitannins';

export type MineralType =
  | 'minerals_total'
  | 'sodium'
  | 'potassium'
  | 'magnesium'
  | 'calcium'
  | 'iron'
  | 'zinc'
  | 'selenium'
  | 'iodine'
  | 'phosphorus'
  | 'copper'
  | 'manganese';

export type VitaminType =
  | 'vitamins_total'
  | 'vitamin_a'
  | 'vitamin_c'
  | 'vitamin_d'
  | 'vitamin_e'
  | 'vitamin_k'
  | 'vitamin_b1'
  | 'vitamin_b2'
  | 'vitamin_b3'
  | 'vitamin_b5'
  | 'vitamin_b6'
  | 'vitamin_b7'
  | 'vitamin_b9'
  | 'vitamin_b12';

export type AminoAcidType =
  | 'histidine'
  | 'isoleucine'
  | 'leucine'
  | 'lysine'
  | 'methionine'
  | 'phenylalanine'
  | 'threonine'
  | 'tryptophan'
  | 'valine'
  | 'arginine'
  | 'cysteine'
  | 'glutamine'
  | 'glycine'
  | 'proline'
  | 'tyrosine';

export type NutrientTag = FiberType | PolyphenolType | MineralType | VitaminType | AminoAcidType;

type BaseTarget<TUnit extends string> = {
  amount: number;
  unit: TUnit;
};

type WeightedTarget = {
  sourceBackedWeight?: number; // Default 1.0 when omitted
  inferredWeight?: number; // Default 0.7 when omitted
};

export type FiberTarget = {
  tag: FiberType;
} & BaseTarget<'g'> & WeightedTarget;

export type PolyphenolTarget = {
  tag: PolyphenolType;
} & BaseTarget<'mg'> & WeightedTarget;

export type MineralTarget = {
  tag: MineralType;
} & BaseTarget<'mg'> & WeightedTarget;

export type VitaminTarget = {
  tag: VitaminType;
} & BaseTarget<'mg'> & WeightedTarget;

export type AminoAcidTarget = {
  tag: AminoAcidType;
} & BaseTarget<'mg'> & WeightedTarget;

export type TrackingTarget = {
  trackingKey: string; // e.g., 'unique_plants', 'vegetable_colors', 'fish_meals', 'fatty_fish_meals'
  // Optional dynamic guidance sent to AI for this key
  aiInstruction?: string; // Optional dynamic guidance sent to AI for this key
} & BaseTarget<'items' | 'count'>;

export type TipNutritionFood = {
  key: string;
  detailsKey?: string; // Optional override when detail uses a separate translation key
  nutrientTags?: NutrientTag[];
  fiberSubtypes?: FiberSubtype[];
  microbiomeSupport?: string[];
  sourceRefs?: string[];
  defaultConfidence?: EvidenceConfidence;
};

type TipBase = {
  id: string;
  level?: number;
  xp?: number;
  areas: TipArea[];
  title: string;
  descriptionKey: string; // Kopplar till översättningsfilen
  supplements?: SupplementReference[];
  analyzePrompt?: string;
  startPrompt?: string;
  parentId?: string; // Ny egenskap för att länka till förälder
  isParent?: boolean; // Markera om detta är en överordnad kategori

  trainingRelation?: TrainingRelation; // (kopplat till workout)
  preferredDayParts?: DayPart[]; // (när på dagen det passar)
  timeRule?: TimeOfDayRule; // (tidsrestriktioner)
  planCategory?: PlanCategory[]; // Markerar övergripande plan-kategori
  nutritionFoods?: TipNutritionFood[]; // Rekommenderade livsmedel för nutritionstips
  bodyParts?: string[]; // Rekommenderade delar av kroppen för detta tip
  microbiomeIds?: string[]; // Koppling till microbiome-bakterier
};

type TipWithoutTargets = {
  targetPeriod?: never;
  fiberTargets?: never;
  polyphenolTargets?: never;
  mineralTargets?: never;
  vitaminTargets?: never;
  aminoAcidTargets?: never;
  trackingTargets?: never;
};

type TipWithTargets = {
  targetPeriod: TargetPeriod;
  fiberTargets?: FiberTarget[]; // Fibermål som används för plan-uppföljning
  polyphenolTargets?: PolyphenolTarget[]; // Polyfenolmål som används för plan-uppföljning
  mineralTargets?: MineralTarget[]; // Mineralmål som används för plan-uppföljning
  vitaminTargets?: VitaminTarget[]; // Vitaminmål som används för plan-uppföljning
  aminoAcidTargets?: AminoAcidTarget[]; // Aminosyramål som används för plan-uppföljning
  trackingTargets?: TrackingTarget[]; // Flexibla tracking-mål (växter, färger, fisk, etc.)
};

export type Tip = TipBase & (TipWithoutTargets | TipWithTargets);

const rawTips: Tip[] = [
  // Lågkolhydratkost
  {
    id: 'low_carb_diet',
    level: 4,
    xp: 800,
    areas: [
      { id: 'energy', descriptionKey: 'low_carb_diet.areas.energy' },
      { id: 'digestiveHealth', descriptionKey: 'low_carb_diet.areas.digestiveHealth' }
    ],
    title: 'low_carb_diet.title',
    descriptionKey: 'low_carb_diet.description',
    trainingRelation: 'anytime',
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    nutritionFoods: [
      { key: 'leafyGreens' },
      { key: 'meat' },
      { key: 'eggs' },
      { key: 'cheese' },
      { key: 'nuts' }
    ],
    bodyParts: ['digestiveSystem', 'cells'],
  },
  // Ketogen kost
  {
    id: 'ketogenic_diet',
    level: 8,
    xp: 1200,
    areas: [
      { id: 'energy', descriptionKey: 'ketogenic_diet.areas.energy' },
      { id: 'mind', descriptionKey: 'ketogenic_diet.areas.mind' },
      { id: 'digestiveHealth', descriptionKey: 'ketogenic_diet.areas.digestiveHealth' }
    ],
    title: 'ketogenic_diet.title',
    descriptionKey: 'ketogenic_diet.description',
    trainingRelation: 'anytime',
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    nutritionFoods: [
      { key: 'avocado' },
      { key: 'coconutOil' },
      { key: 'fattyFish' },
      { key: 'eggs' },
      { key: 'cheese' }
    ],
    bodyParts: ['brain', 'cells'],
  },
    {
      id: 'berberine',
      level: 7,
      xp: 500,
      areas: [
        { id: 'digestiveHealth', descriptionKey: 'berberine.areas.digestiveHealth' },
        { id: 'cardioFitness', descriptionKey: 'berberine.areas.cardioFitness' },
        { id: 'energy', descriptionKey: 'berberine.areas.energy' }
      ],
      title: 'berberine.title',
      descriptionKey: 'berberine.description',
      supplements: [{ id: 'berberine' }],
      trainingRelation: 'anytime',
      preferredDayParts: ['morning', 'midday'],
      timeRule: 'anytime',
      planCategory: ['supplement'],
      nutritionFoods: [ { key: 'barberry' } ],
      bodyParts: ['digestiveSystem', 'cells'],
    },
  {
    id: 'urolithin_a',
    level: 9,
    xp: 500,
    areas: [
      { id: 'energy', descriptionKey: 'urolithin_a.areas.energy' },
    ],
    title: 'urolithin_a.title',
    descriptionKey: 'urolithin_a.description',
    supplements: [{ id: 'urolithinA' }, { id: 'pomegranateExtract' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['muscles', 'cells'],
    nutritionFoods: [
      { key: 'pomegranate' },
      { key: 'walnuts' },
      { key: 'strawberries' },
      { key: 'raspberries' }
    ],
    microbiomeIds: ['Gordonibacter'],
  },
  {
    id: 'eat_pomegranate',
    level: 2,
    xp: 300,
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'eat_pomegranate.areas.digestiveHealth' },
      { id: 'energy', descriptionKey: 'eat_pomegranate.areas.energy' },
    ],
    title: 'eat_pomegranate.title',
    descriptionKey: 'eat_pomegranate.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    nutritionFoods: [
      {
        key: 'pomegranate',
        nutrientTags: ['ellagitannins', 'flavonoids_total', 'polyphenols_total'],
        microbiomeSupport: ['Akkermansia', 'Gordonibacter'],
        sourceRefs: ['Phenol-Explorer', 'USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'pomegranateJuice',
        nutrientTags: ['ellagitannins', 'flavonoids_total', 'polyphenols_total'],
        microbiomeSupport: ['Akkermansia', 'Gordonibacter'],
        sourceRefs: ['Phenol-Explorer'],
        defaultConfidence: 'medium',
      },
    ],
    bodyParts: ['digestiveSystem', 'cells'],
    microbiomeIds: ['Akkermansia', 'Gordonibacter'],
  },
  {
    id: 'intermittent_fasting_12h',
    level: 2,
    xp: 300,
    areas: [
      { id: 'energy', descriptionKey: 'intermittent_fasting_12h.areas.energy' },
      { id: 'digestiveHealth', descriptionKey: 'intermittent_fasting_12h.areas.digestiveHealth' },
    ],
    title: 'intermittent_fasting_12h.title',
    descriptionKey: 'intermittent_fasting_12h.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['evening', 'night'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    bodyParts: ['digestiveSystem'],
  },
  {
    id: 'intermittent_fasting_16_8',
    level: 4,
    xp: 500,
    areas: [
      { id: 'energy', descriptionKey: 'intermittent_fasting_16_8.areas.energy' },
      { id: 'digestiveHealth', descriptionKey: 'intermittent_fasting_16_8.areas.digestiveHealth' },
    ],
    title: 'intermittent_fasting_16_8.title',
    descriptionKey: 'intermittent_fasting_16_8.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['evening', 'night'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    bodyParts: ['digestiveSystem'],
    microbiomeIds: ['Akkermansia'],
  },
  {
    id: 'multivitamin_general',
    level: 5,
    xp: 300,
    areas: [
      { id: 'energy', descriptionKey: 'multivitamin_general.areas.energy' },
      { id: 'immuneSupport', descriptionKey: 'multivitamin_general.areas.immuneSupport' },
    ],
    title: 'multivitamin_general.title',
    descriptionKey: 'multivitamin_general.description',
    supplements: [{ id: 'multivitamin' }],
    startPrompt: 'multivitamin_general.startPrompt',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    bodyParts: ['immuneSystem'],
  },
  {
    id: 'vitamin_d',
    level: 4,
    xp: 700,
    areas: [
      { id: 'energy', descriptionKey: 'vitamin_d.areas.energy' },
      { id: 'immuneSupport', descriptionKey: 'vitamin_d.areas.immuneSupport' },
      { id: 'strength', descriptionKey: 'vitamin_d.areas.strength' },
      { id: 'nervousSystem', descriptionKey: 'vitamin_d.areas.nervousSystem' },
    ],
    title: 'vitamin_d.title',
    descriptionKey: 'vitamin_d.description',
    supplements: [
      { id: 'vitaminD' },
      { id: 'vitaminDWithK2' },
      { id: 'codLiverOil' },
      { id: 'vitaminK2' },
      { id: 'magnesiumGlycinate' },
    ],
    startPrompt: 'vitamin_d.startPrompt',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    nutritionFoods: [{ key: 'fattyFish' }, { key: 'eggYolks' }, { key: 'fortifiedDairy' }, { key: 'mushrooms' }],
    bodyParts: ['immuneSystem', 'muscles', 'nervousSystem', 'bones'],
  },
  {
    id: 'vitamin_e_antioxidant_support',
    level: 9,
    xp: 500,
    areas: [
      { id: 'immuneSupport', descriptionKey: 'vitamin_e_antioxidant_support.areas.immuneSupport' },
      { id: 'cardioFitness', descriptionKey: 'vitamin_e_antioxidant_support.areas.cardioFitness' },
      { id: 'energy', descriptionKey: 'vitamin_e_antioxidant_support.areas.energy' },
    ],
    title: 'vitamin_e_antioxidant_support.title',
    descriptionKey: 'vitamin_e_antioxidant_support.description',
    supplements: [
      { id: 'vitaminE' },
      { id: 'vitaminEMixedTocopherols' },
      { id: 'vitaminETocotrienols' },
      { id: 'codLiverOil' },
      { id: 'astaxanthin' },
    ],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'evening'],
    timeRule: 'anytime',
    planCategory: ['supplement'],   
    bodyParts: ['immuneSystem', 'skin'],
  },
  {
    id: 'coq10',
    level: 7,
    xp: 500,
    areas: [
      { id: 'energy', descriptionKey: 'coq10.areas.energy' },
      { id: 'immuneSupport', descriptionKey: 'coq10.areas.immuneSupport' },
    ],
    title: 'coq10.title',
    descriptionKey: 'coq10.description',
    supplements: [{ id: 'coenzymeQ10' }],
    analyzePrompt: 'coq10.analyzePrompt',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['nutrition', 'supplement'],
    nutritionFoods: [
      { key: 'organMeats' },
      { key: 'fattyFish' },
      { key: 'beef' },
      { key: 'spinach' },
      { key: 'broccoli' },
    ],
    bodyParts: ['heart', 'muscles'],
  },
  {
    id: 'cellular_energy_nad',
    level: 9,
    xp: 500,
    areas: [
      { id: 'energy', descriptionKey: 'cellular_energy_nad.areas.energy' },
      { id: 'immuneSupport', descriptionKey: 'cellular_energy_nad.areas.immuneSupport' },
      { id: 'nervousSystem', descriptionKey: 'cellular_energy_nad.areas.nervousSystem' },
    ],
    title: 'cellular_energy_nad.title',
    descriptionKey: 'cellular_energy_nad.description',
    supplements: [{ id: 'nad' }, { id: 'nmn' }, { id: 'nr' }, { id: 'niacin' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['nervousSystem', 'muscles'],
  },
  {
    id: 'sleep_timing_circadian',
    level: 1,
    xp: 500,
    areas: [
      { id: 'sleepQuality', descriptionKey: 'sleep_timing_circadian.areas.sleepQuality' },
      { id: 'immuneSupport', descriptionKey: 'sleep_timing_circadian.areas.immuneSupport' },
      { id: 'energy', descriptionKey: 'sleep_timing_circadian.areas.energy' },
      { id: 'longevity', descriptionKey: 'sleep_timing_circadian.areas.longevity' },
    ],
    title: 'sleep_timing_circadian.title',
    descriptionKey: 'sleep_timing_circadian.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['evening'],
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'magnesium',
    level: 4,
    xp: 700,
    areas: [
      { id: 'sleepQuality', descriptionKey: 'magnesium.areas.sleepQuality' },
      { id: 'nervousSystem', descriptionKey: 'magnesium.areas.nervousSystem' },
      { id: 'energy', descriptionKey: 'magnesium.areas.energy' },
    ],
    title: 'magnesium.title',
    descriptionKey: 'magnesium.description',
    supplements: [
      { id: 'magnesium' },
      { id: 'magnesiumGlycinate' },
      { id: 'magnesiumCitrate' },
      { id: 'magnesiumMalate' },
      { id: 'magnesiumThreonate' },
    ],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening', 'night'],
    timeRule: 'anytime',
    planCategory: ['nutrition','supplement'],
    targetPeriod: 'daily',
    mineralTargets: [
      { tag: 'magnesium', amount: 320, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.7 },
    ],
    nutritionFoods: [
      { key: 'leafyGreens' },
      { key: 'pumpkinSeeds' },
      { key: 'almonds' },
      { key: 'darkChocolate' },
      { key: 'blackBeans' },
      { key: 'avocado' },
    ],
    bodyParts: ['muscles', 'nervousSystem', 'bones'],
  },
  {
    id: 'zinc_comprehensive_support',
    level: 5,
    xp: 700,
    areas: [
      { id: 'immuneSupport', descriptionKey: 'zinc_comprehensive_support.areas.immuneSupport' },
      { id: 'nervousSystem', descriptionKey: 'zinc_comprehensive_support.areas.nervousSystem' },
      { id: 'energy', descriptionKey: 'zinc_comprehensive_support.areas.energy' },
    ],
    title: 'zinc_comprehensive_support.title',
    descriptionKey: 'zinc_comprehensive_support.description',
    supplements: [{ id: 'zinc' }, { id: 'zincPicolinate' }, { id: 'zincBisglycinate' }, { id: 'zincCitrate' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening'],
    timeRule: 'anytime',
    planCategory: ['nutrition','supplement'],
    nutritionFoods: [
      { key: 'oysters' },
      { key: 'beef' },
      { key: 'pumpkinSeeds' },
      { key: 'chickpeas' },
      { key: 'cashews' },
    ],
    bodyParts: ['immuneSystem', 'skin'],
  },
  {
    id: 'selenium_thyroid_antioxidant',
    level: 5,
    xp: 500,
    areas: [
      { id: 'immuneSupport', descriptionKey: 'selenium_thyroid_antioxidant.areas.immuneSupport' },
      { id: 'energy', descriptionKey: 'selenium_thyroid_antioxidant.areas.energy' },
      { id: 'nervousSystem', descriptionKey: 'selenium_thyroid_antioxidant.areas.nervousSystem' },
    ],
    title: 'selenium_thyroid_antioxidant.title',
    descriptionKey: 'selenium_thyroid_antioxidant.description',
    supplements: [{ id: 'selenium' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['nutrition','supplement'],
    nutritionFoods: [
      { key: 'brazilNuts' },
      { key: 'sardines' },
      { key: 'eggs' },
      { key: 'shiitakeMushrooms' },
      { key: 'sunflowerSeeds' },
    ],
    bodyParts: ['thyroid', 'immuneSystem', 'hair'],
  },
  {
    id: 'iodine_thyroid_balance',
    level: 5,
    xp: 500,
    areas: [
      { id: 'energy', descriptionKey: 'iodine_thyroid_balance.areas.energy' },
      { id: 'immuneSupport', descriptionKey: 'iodine_thyroid_balance.areas.immuneSupport' },
      { id: 'nervousSystem', descriptionKey: 'iodine_thyroid_balance.areas.nervousSystem' },
    ],
    title: 'iodine_thyroid_balance.title',
    descriptionKey: 'iodine_thyroid_balance.description',
    supplements: [{ id: 'kelp' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['nutrition','supplement'],
    nutritionFoods: [{ key: 'seaweed' }, { key: 'iodizedSalt' }, { key: 'dairy' }, { key: 'eggs' }, { key: 'cod' }],
    bodyParts: ['thyroid', 'hair'],
  },
  {
    id: 'calm_alertness_ltheanine',
    level: 6,
    xp: 500,
    areas: [{ id: 'mind', descriptionKey: 'calm_alertness_ltheanine.areas.mind' }],
    title: 'calm_alertness_ltheanine.title',
    descriptionKey: 'calm_alertness_ltheanine.description',
    supplements: [{ id: 'lTheanine' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'neurotransmitter_ltyrosine',
    level: 7,
    xp: 700,
    areas: [{ id: 'mind', descriptionKey: 'neurotransmitter_ltyrosine.areas.mind' }],
    title: 'neurotransmitter_ltyrosine.title',
    descriptionKey: 'neurotransmitter_ltyrosine.description',
    supplements: [{ id: 'lTyrosine' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'maintain_hydration',
    level: 1,
    xp: 300,
    areas: [
      { id: 'immuneSupport', descriptionKey: 'maintain_hydration.areas.immuneSupport' },
      { id: 'energy', descriptionKey: 'maintain_hydration.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'maintain_hydration.areas.cardioFitness' },
    ],
    title: 'maintain_hydration.title',
    descriptionKey: 'maintain_hydration.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'afternoon', 'evening'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    bodyParts: ['kidneys'],
  },
  {
    id: 'electrolytes_balance',
    level: 2,
    xp: 400,
    areas: [
      { id: 'energy', descriptionKey: 'electrolytes_balance.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'electrolytes_balance.areas.cardioFitness' },
      { id: 'nervousSystem', descriptionKey: 'electrolytes_balance.areas.nervousSystem' },
    ],
    title: 'electrolytes_balance.title',
    descriptionKey: 'electrolytes_balance.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    nutritionFoods: [
      { key: 'mineralWater' },
      { key: 'coconutWater' },
      { key: 'potatoes' },
      { key: 'saltedMeals' },
    ],
    bodyParts: ['muscles', 'nervousSystem', 'kidneys'],
  },
  {
    id: 'dental_health_basics',
    level: 1,
    xp: 300,
    areas: [
      { id: 'immuneSupport', descriptionKey: 'dental_health_basics.areas.immuneSupport' },
      { id: 'digestiveHealth', descriptionKey: 'dental_health_basics.areas.digestiveHealth' },
    ],
    title: 'dental_health_basics.title',
    descriptionKey: 'dental_health_basics.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'evening'],
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['teeth'],
  },
  {
    id: 'vitamin_c_immunity',
    level: 2,
    xp: 500,
    areas: [{ id: 'immuneSupport', descriptionKey: 'vitamin_c_immunity.areas.immuneSupport' }],
    title: 'vitamin_c_immunity.title',
    descriptionKey: 'vitamin_c_immunity.description',
    supplements: [{ id: 'vitaminC' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['midday', 'afternoon'],
    timeRule: 'anytime',
    nutritionFoods: [
      { key: 'citrusFruits' },
      { key: 'berries' },
      { key: 'bellPeppers' },
      { key: 'kiwi' },
      { key: 'fermentedCabbage' },
    ],
    planCategory: ['nutrition','supplement'],
    bodyParts: ['immuneSystem', 'skin'],
  },
  {
    id: 'echinacea_herbs',
    level: 6,
    xp: 700,
    areas: [{ id: 'immuneSupport', descriptionKey: 'echinacea_herbs.areas.immuneSupport' }],
    title: 'echinacea_herbs.title',
    descriptionKey: 'echinacea_herbs.description',
    supplements: [{ id: 'echinacea' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['immuneSystem'],
  },
  {
    id: 'calming_glycine',
    level: 6,
    xp: 500,
    areas: [
      { id: 'nervousSystem', descriptionKey: 'calming_glycine.areas.nervousSystem' },
      { id: 'sleepQuality', descriptionKey: 'calming_glycine.areas.sleepQuality' },
      { id: 'immuneSupport', descriptionKey: 'calming_glycine.areas.immuneSupport' },
    ],
    title: 'calming_glycine.title',
    descriptionKey: 'calming_glycine.description',
    supplements: [{ id: 'glycine' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening', 'night'],
    timeRule: 'anytime',
    planCategory: ['nutrition','supplement'],
    targetPeriod: 'daily',
    aminoAcidTargets: [
      { tag: 'glycine', amount: 2000, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.6 },
    ],
    nutritionFoods: [
      { key: 'boneBroth', nutrientTags: ['glycine'] },
      { key: 'collagenCuts', nutrientTags: ['glycine'] },
      { key: 'skinOnPoultry', nutrientTags: ['glycine'] },
      { key: 'porkRinds', nutrientTags: ['glycine'] },
      { key: 'legumes', nutrientTags: ['glycine'] },
    ],
    bodyParts: ['nervousSystem', 'bloodVessels', 'bones' ],
  },
  {
    id: 'muscle_leucine',
    level: 7,
    xp: 600,
    areas: [
      { id: 'strength', descriptionKey: 'muscle_leucine.areas.strength' },
    ],
    title: 'muscle_leucine.title',
    descriptionKey: 'muscle_leucine.description',
    supplements: [{ id: 'leucine' }],
    trainingRelation: 'postWorkout',
    preferredDayParts: ['midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['nutrition', 'supplement'],
    targetPeriod: 'daily',
    aminoAcidTargets: [
      { tag: 'leucine', amount: 7000, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.5 },
    ],
    nutritionFoods: [
      { key: 'beef', nutrientTags: ['leucine'] },
      { key: 'chicken', nutrientTags: ['leucine'] },
      { key: 'fish', nutrientTags: ['leucine'] },
      { key: 'eggs', nutrientTags: ['leucine'] },
      { key: 'dairyProducts', nutrientTags: ['leucine'] },
      { key: 'wheyProtein', nutrientTags: ['leucine'] },
    ],
    bodyParts: ['muscles', 'bones'],
  },
  {
    id: 'bcaa_complex',
    level: 8,
    xp: 700,
    areas: [
      { id: 'strength', descriptionKey: 'bcaa_complex.areas.strength' },
      { id: 'cardioFitness', descriptionKey: 'bcaa_complex.areas.cardioFitness' },
    ],
    title: 'bcaa_complex.title',
    descriptionKey: 'bcaa_complex.description',
    supplements: [{ id: 'bcaa' }],
    trainingRelation: 'preWorkout',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['nutrition','supplement'],
    targetPeriod: 'weekly',
    aminoAcidTargets: [
      { tag: 'leucine', amount: 35000, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.7 },
      { tag: 'isoleucine', amount: 17500, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.6 },
      { tag: 'valine', amount: 17500, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.6 },
    ],
    bodyParts: ['muscles'],
  },
  {
    id: 'arginine_pump',
    level: 6,
    xp: 500,
    areas: [
      { id: 'cardioFitness', descriptionKey: 'arginine_pump.areas.cardioFitness' },
      { id: 'strength', descriptionKey: 'arginine_pump.areas.strength' },
    ],
    title: 'arginine_pump.title',
    descriptionKey: 'arginine_pump.description',
    supplements: [{ id: 'arginine' }],
    trainingRelation: 'preWorkout',
    preferredDayParts: ['midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['nutrition', 'supplement'],
    targetPeriod: 'daily',
    aminoAcidTargets: [
      { tag: 'arginine', amount: 5000, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.5 },
    ],
    nutritionFoods: [
      { key: 'pumpkinSeeds', nutrientTags: ['arginine'] },
      { key: 'sesameSeeds', nutrientTags: ['arginine'] },
      { key: 'almonds', nutrientTags: ['arginine'] },
      { key: 'pecans', nutrientTags: ['arginine'] },
      { key: 'watermelon', nutrientTags: ['arginine'] },
    ],
    bodyParts: ['bloodVessels', 'muscles'],
  },
  {
    id: 'whey_protein',
    level: 3,
    xp: 400,
    areas: [
      { id: 'strength', descriptionKey: 'whey_protein.areas.strength' },
      { id: 'cardioFitness', descriptionKey: 'whey_protein.areas.cardioFitness' },
    ],
    title: 'whey_protein.title',
    descriptionKey: 'whey_protein.description',
    supplements: [{ id: 'wheyProtein' }],
    trainingRelation: 'postWorkout',
    preferredDayParts: ['morning', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['nutrition', 'supplement'],
    targetPeriod: 'daily',
    aminoAcidTargets: [
      { tag: 'leucine', amount: 2500, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.6 },
    ],
    nutritionFoods: [
      { key: 'chickenBreast', nutrientTags: ['leucine'] },
      { key: 'tuna', nutrientTags: ['leucine'] },
      { key: 'eggs', nutrientTags: ['leucine'] },
      { key: 'greekYogurt', nutrientTags: ['leucine'] },
      { key: 'cottageCheese', nutrientTags: ['leucine'] },
    ],
    bodyParts: ['muscles'],
  },
  {
    id: 'homocysteine_methylation_cardio',
    level: 8,
    xp: 700,
    areas: [
      {
        id: 'cardioFitness',
        descriptionKey: 'homocysteine_methylation_cardio.areas.cardioFitness',
      },
      {
        id: 'longevity',
        descriptionKey: 'homocysteine_methylation_cardio.areas.longevity',
      },
    ],
    title: 'homocysteine_methylation_cardio.title',
    descriptionKey: 'homocysteine_methylation_cardio.description',
    supplements: [
      { id: 'tmg' },
      { id: 'folicAcid' },
      { id: 'vitaminB12' },
      { id: 'glycine' },
      { id: 'nac' },
      { id: 'greenTeaExtract' },
    ],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['nutrition', 'supplement'],
    targetPeriod: 'daily',
    vitaminTargets: [
      { tag: 'vitamin_b6', amount: 1.7, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.7 },
      { tag: 'vitamin_b9', amount: 0.4, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.7 },
      { tag: 'vitamin_b12', amount: 0.0024, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.7 },
    ],
    aminoAcidTargets: [
      { tag: 'glycine', amount: 3000, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.6 },
    ],
    nutritionFoods: [
      { key: 'beets' },
      { key: 'spinach' },
      { key: 'eggs' },
      { key: 'broccoli' },
      { key: 'salmon' },
      { key: 'greenTea' },
    ],
    bodyParts: ['bloodVessels', 'heart', 'liver'],
  },
    {
      id: 'collagen',
      level: 5,
      xp: 500,
      areas: [
        { id: 'strength', descriptionKey: 'collagen.areas.strength' },
      ],
      title: 'collagen.title',
      descriptionKey: 'collagen.description',
      supplements: [{ id: 'collagen' }],
      trainingRelation: 'anytime',
      preferredDayParts: ['morning', 'midday'],
      timeRule: 'anytime',
      planCategory: ['nutrition', 'supplement'],
      nutritionFoods: [
        { key: 'boneBroth' },
        { key: 'collagenCuts' },
        { key: 'skinOnPoultry' },
      ],
      bodyParts: ['joints', 'skin', 'bones'],
    },
    {
      id: 'citrulline_bloodflow_gut',
      level: 7,
      xp: 500,
      areas: [
        { id: 'digestiveHealth', descriptionKey: 'citrulline_bloodflow_gut.areas.digestiveHealth' },
        { id: 'cardioFitness', descriptionKey: 'citrulline_bloodflow_gut.areas.cardioFitness' },
      ],
      title: 'citrulline_bloodflow_gut.title',
      descriptionKey: 'citrulline_bloodflow_gut.description',
      supplements: [{ id: 'citrulline' }],
      trainingRelation: 'anytime',
      preferredDayParts: ['morning', 'midday'],
      timeRule: 'anytime',
      planCategory: ['supplement'],
      nutritionFoods: [
        { key: 'watermelon' },
        { key: 'cantaloupe' },
        { key: 'cucumber' },
      ],
      bodyParts: ['digestiveSystem', 'bloodVessels'],
    },
    {
      id: 'glutathione',
      level: 8,
      xp: 500,
      areas: [
        { id: 'immuneSupport', descriptionKey: 'glutathione.areas.immuneSupport' },
        { id: 'energy', descriptionKey: 'glutathione.areas.energy' },
      ],
      title: 'glutathione.title',
      descriptionKey: 'glutathione.description',
      supplements: [{ id: 'glutathione' }, { id: 'nac' }, { id: 'glycine' }, { id: 'glutamate' }],
      trainingRelation: 'anytime',
      preferredDayParts: ['morning', 'midday'],
      timeRule: 'anytime',
      planCategory: ['nutrition', 'supplement'],
      nutritionFoods: [
        { key: 'broccoli' },
        { key: 'avocado' },
        { key: 'spinach' },
      ],
      bodyParts: ['liver', 'immuneSystem', 'cells'],
    },
  {
    id: 'breathwork_parasympathetic',
    level: 2,
    xp: 0,
    areas: [
      { id: 'nervousSystem', descriptionKey: 'breathwork_parasympathetic.areas.nervousSystem' },
      { id: 'immuneSupport', descriptionKey: 'breathwork_parasympathetic.areas.immuneSupport' },
      { id: 'energy', descriptionKey: 'breathwork_parasympathetic.areas.energy' },
    ],
    title: 'breathwork_parasympathetic.title',
    descriptionKey: 'breathwork_parasympathetic.description',
    isParent: true,
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'afternoon', 'evening'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem', 'lungs'],
  },
  {
    id: 'box_breathing',
    level: 2,
    xp: 0,
    parentId: 'breathwork_parasympathetic',
    areas: [
      { id: 'nervousSystem', descriptionKey: 'box_breathing.areas.nervousSystem' },
      { id: 'immuneSupport', descriptionKey: 'box_breathing.areas.immuneSupport' },
    ],
    title: 'box_breathing.title',
    descriptionKey: 'box_breathing.description',
    supplements: [],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'afternoon'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem', 'lungs'],
  },
  {
    id: '4_7_8_breathing',
    level: 3,
    xp: 0,
    parentId: 'breathwork_parasympathetic',
    areas: [
      { id: 'nervousSystem', descriptionKey: '4_7_8_breathing.areas.nervousSystem' },
      { id: 'sleepQuality', descriptionKey: '4_7_8_breathing.areas.sleepQuality' },
    ],
    title: '4_7_8_breathing.title',
    descriptionKey: '4_7_8_breathing.description',
    supplements: [],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening', 'night'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem', 'lungs'],
  },
  {
    id: 'alternate_nostril_breathing',
    level: 3,
    xp: 0,
    parentId: 'breathwork_parasympathetic',
    areas: [
      { id: 'nervousSystem', descriptionKey: 'alternate_nostril_breathing.areas.nervousSystem' },
      { id: 'mind', descriptionKey: 'alternate_nostril_breathing.areas.mind' },
    ],
    title: 'alternate_nostril_breathing.title',
    descriptionKey: 'alternate_nostril_breathing.description',
    supplements: [],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem', 'lungs'],
  },
  {
    id: 'diaphragmatic_breathing',
    level: 2,
    xp: 0,
    parentId: 'breathwork_parasympathetic',
    areas: [
      { id: 'nervousSystem', descriptionKey: 'diaphragmatic_breathing.areas.nervousSystem' },
      { id: 'energy', descriptionKey: 'diaphragmatic_breathing.areas.energy' },
    ],
    title: 'diaphragmatic_breathing.title',
    descriptionKey: 'diaphragmatic_breathing.description',
    supplements: [],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'afternoon'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem', 'lungs'],
  },
  {
    id: 'sleep_optimization_recovery',
    level: 1,
    xp: 0,
    areas: [
      { id: 'nervousSystem', descriptionKey: 'sleep_optimization_recovery.areas.nervousSystem' },
      { id: 'immuneSupport', descriptionKey: 'sleep_optimization_recovery.areas.immuneSupport' },
      { id: 'energy', descriptionKey: 'sleep_optimization_recovery.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'sleep_optimization_recovery.areas.cardioFitness' },
      { id: 'sleepQuality', descriptionKey: 'sleep_optimization_recovery.areas.sleepQuality' },
    ],
    title: 'sleep_optimization_recovery.title',
    descriptionKey: 'sleep_optimization_recovery.description',
    isParent: true,
    trainingRelation: 'anytime',
    preferredDayParts: ['evening'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'sleep_duration_consistency',
    level: 1,
    xp: 0,
    parentId: 'sleep_optimization_recovery',
    areas: [
      { id: 'sleepQuality', descriptionKey: 'sleep_duration_consistency.areas.sleepQuality' },
      { id: 'energy', descriptionKey: 'sleep_duration_consistency.areas.energy' },
    ],
    title: 'sleep_duration_consistency.title',
    descriptionKey: 'sleep_duration_consistency.description',
    supplements: [],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening', 'night'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'sleep_environment_optimization',
    level: 1,
    xp: 0,
    parentId: 'sleep_optimization_recovery',
    areas: [
      { id: 'sleepQuality', descriptionKey: 'sleep_environment_optimization.areas.sleepQuality' },
      { id: 'nervousSystem', descriptionKey: 'sleep_environment_optimization.areas.nervousSystem' },
    ],
    title: 'sleep_environment_optimization.title',
    descriptionKey: 'sleep_environment_optimization.description',
    supplements: [],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening', 'night'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'sleep_hygiene_practices',
    level: 1,
    xp: 0,
    parentId: 'sleep_optimization_recovery',
    areas: [
      { id: 'sleepQuality', descriptionKey: 'sleep_hygiene_practices.areas.sleepQuality' },
      { id: 'immuneSupport', descriptionKey: 'sleep_hygiene_practices.areas.immuneSupport' },
    ],
    title: 'sleep_hygiene_practices.title',
    descriptionKey: 'sleep_hygiene_practices.description',
    supplements: [],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'pre_sleep_wind_down',
    level: 1,
    xp: 0,
    parentId: 'sleep_optimization_recovery',
    areas: [
      { id: 'sleepQuality', descriptionKey: 'pre_sleep_wind_down.areas.sleepQuality' },
      { id: 'nervousSystem', descriptionKey: 'pre_sleep_wind_down.areas.nervousSystem' },
    ],
    title: 'pre_sleep_wind_down.title',
    descriptionKey: 'pre_sleep_wind_down.description',
    supplements: [],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening', 'night'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'sunlight_circadian',
    level: 1,
    xp: 0,
    areas: [
      { id: 'sleepQuality', descriptionKey: 'sunlight_circadian.areas.sleepQuality' },
      { id: 'nervousSystem', descriptionKey: 'sunlight_circadian.areas.nervousSystem' },
      { id: 'energy', descriptionKey: 'sunlight_circadian.areas.energy' },
      { id: 'immuneSupport', descriptionKey: 'sunlight_circadian.areas.immuneSupport' },
    ],
    title: 'sunlight_circadian.title',
    descriptionKey: 'sunlight_circadian.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'cold_exposure_ans',
    level: 6,
    xp: 0,
    areas: [
      { id: 'nervousSystem', descriptionKey: 'cold_exposure_ans.areas.nervousSystem' },
      { id: 'immuneSupport', descriptionKey: 'cold_exposure_ans.areas.immuneSupport' },
      { id: 'energy', descriptionKey: 'cold_exposure_ans.areas.energy' },
    ],
    title: 'cold_exposure_ans.title',
    descriptionKey: 'cold_exposure_ans.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem', 'skin', 'fattyTissue' ],
  },
  {
    id: 'meditation_mindfulness',
    level: 2,
    xp: 0,
    areas: [
      { id: 'nervousSystem', descriptionKey: 'meditation_mindfulness.areas.nervousSystem' },
      { id: 'immuneSupport', descriptionKey: 'meditation_mindfulness.areas.immuneSupport' },
      { id: 'mind', descriptionKey: 'meditation_mindfulness.areas.mind' },
      { id: 'longevity', descriptionKey: 'meditation_mindfulness.areas.longevity' },
    ],
    title: 'meditation_mindfulness.title',
    descriptionKey: 'meditation_mindfulness.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'evening'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'ikigai_purpose_longevity',
    level: 2,
    xp: 0,
    areas: [
      { id: 'philosophy', descriptionKey: 'ikigai_purpose_longevity.areas.philosophy' },
      { id: 'mind', descriptionKey: 'ikigai_purpose_longevity.areas.mind' },
      { id: 'longevity', descriptionKey: 'ikigai_purpose_longevity.areas.longevity' },
    ],
    title: 'ikigai_purpose_longevity.title',
    descriptionKey: 'ikigai_purpose_longevity.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'evening'],
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['brain', 'nervousSystem'],
  },
  {
    id: 'stoic_dichotomy_control',
    level: 1,
    xp: 0,
    areas: [
      { id: 'philosophy', descriptionKey: 'stoic_dichotomy_control.areas.philosophy' },
      { id: 'nervousSystem', descriptionKey: 'stoic_dichotomy_control.areas.nervousSystem' },
    ],
    title: 'stoic_dichotomy_control.title',
    descriptionKey: 'stoic_dichotomy_control.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'evening'],
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['brain', 'nervousSystem'],
  },
  {
    id: 'memento_mori_priority',
    level: 2,
    xp: 0,
    areas: [
      { id: 'philosophy', descriptionKey: 'memento_mori_priority.areas.philosophy' },
      { id: 'longevity', descriptionKey: 'memento_mori_priority.areas.longevity' },
    ],
    title: 'memento_mori_priority.title',
    descriptionKey: 'memento_mori_priority.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'evening'],
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['brain'],
  },
  {
    id: 'virtue_before_mood',
    level: 1,
    xp: 0,
    areas: [
      { id: 'philosophy', descriptionKey: 'virtue_before_mood.areas.philosophy' },
      { id: 'mind', descriptionKey: 'virtue_before_mood.areas.mind' },
    ],
    title: 'virtue_before_mood.title',
    descriptionKey: 'virtue_before_mood.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['brain'],
  },
  {
    id: 'amor_fati_reframe',
    level: 3,
    xp: 0,
    areas: [
      { id: 'philosophy', descriptionKey: 'amor_fati_reframe.areas.philosophy' },
      { id: 'nervousSystem', descriptionKey: 'amor_fati_reframe.areas.nervousSystem' },
      { id: 'mind', descriptionKey: 'amor_fati_reframe.areas.mind' },
    ],
    title: 'amor_fati_reframe.title',
    descriptionKey: 'amor_fati_reframe.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['afternoon', 'evening'],
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['brain', 'nervousSystem'],
  },
  {
    id: 'philosophical_journaling',
    level: 2,
    xp: 0,
    areas: [
      { id: 'philosophy', descriptionKey: 'philosophical_journaling.areas.philosophy' },
      { id: 'mind', descriptionKey: 'philosophical_journaling.areas.mind' },
      { id: 'longevity', descriptionKey: 'philosophical_journaling.areas.longevity' },
    ],
    title: 'philosophical_journaling.title',
    descriptionKey: 'philosophical_journaling.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['evening'],
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['brain'],
  },
  {
    id: 'philosophical_walk',
    level: 1,
    xp: 0,
    areas: [
      { id: 'philosophy', descriptionKey: 'philosophical_walk.areas.philosophy' },
      { id: 'mind', descriptionKey: 'philosophical_walk.areas.mind' },
      { id: 'nervousSystem', descriptionKey: 'philosophical_walk.areas.nervousSystem' },
    ],
    title: 'philosophical_walk.title',
    descriptionKey: 'philosophical_walk.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['brain', 'nervousSystem'],
  },
  {
    id: 'nature_parasympathetic',
    level: 1,
    xp: 0,
    areas: [
      { id: 'nervousSystem', descriptionKey: 'nature_parasympathetic.areas.nervousSystem' },
      { id: 'immuneSupport', descriptionKey: 'nature_parasympathetic.areas.immuneSupport' },
      { id: 'energy', descriptionKey: 'nature_parasympathetic.areas.energy' },
    ],
    title: 'nature_parasympathetic.title',
    descriptionKey: 'nature_parasympathetic.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['midday', 'afternoon'],
    timeRule: 'anytime',
    bodyParts: ['heart','nervousSystem'],
  },
  {
    id: 'hrv_recovery_monitoring',
    level: 6,
    xp: 0,
    areas: [
      { id: 'nervousSystem', descriptionKey: 'hrv_recovery_monitoring.areas.nervousSystem' },
      { id: 'immuneSupport', descriptionKey: 'hrv_recovery_monitoring.areas.immuneSupport' },
      { id: 'energy', descriptionKey: 'hrv_recovery_monitoring.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'hrv_recovery_monitoring.areas.cardioFitness' },
      { id: 'strength', descriptionKey: 'hrv_recovery_monitoring.areas.strength' },
      { id: 'longevity', descriptionKey: 'hrv_recovery_monitoring.areas.longevity' },
    ],
    title: 'hrv_recovery_monitoring.title',
    descriptionKey: 'hrv_recovery_monitoring.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    bodyParts: ['heart','nervousSystem'],
  },
  {
    id: 'social_connection_vagal',
    level: 1,
    xp: 0,
    areas: [
      { id: 'nervousSystem', descriptionKey: 'social_connection_vagal.areas.nervousSystem' },
      { id: 'immuneSupport', descriptionKey: 'social_connection_vagal.areas.immuneSupport' },
      { id: 'energy', descriptionKey: 'social_connection_vagal.areas.energy' },
    ],
    title: 'social_connection_vagal.title',
    descriptionKey: 'social_connection_vagal.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['afternoon', 'evening'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'calming_music_waves',
    level: 1,
    xp: 0,
    areas: [
      { id: 'nervousSystem', descriptionKey: 'calming_music_waves.areas.nervousSystem' },
      { id: 'sleepQuality', descriptionKey: 'calming_music_waves.areas.sleepQuality' },
      { id: 'mind', descriptionKey: 'calming_music_waves.areas.mind' },
    ],
    title: 'calming_music_waves.title',
    descriptionKey: 'calming_music_waves.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['evening', 'night'],
    timeRule: 'anytime',
    bodyParts: ['nervousSystem'], 
  },
  {
    id: 'adaptogenic_herbs',
    level: 6,
    xp: 0,
    areas: [{ id: 'nervousSystem', descriptionKey: 'adaptogenic_herbs.areas.nervousSystem' }],
    title: 'adaptogenic_herbs.title',
    descriptionKey: 'adaptogenic_herbs.description',
    isParent: true,
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'medicinal_mushrooms',
    level: 7,
    xp: 0,
    areas: [
      { id: 'immuneSupport', descriptionKey: 'medicinal_mushrooms.areas.immuneSupport' },
      { id: 'mind', descriptionKey: 'medicinal_mushrooms.areas.mind' },
    ],
    title: 'medicinal_mushrooms.title',
    descriptionKey: 'medicinal_mushrooms.description',
    isParent: true,
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['immuneSystem', 'brain', 'nervousSystem'],
  },
  {
    id: 'neuromuscular_training',
    level: 2,
    xp: 0,
    areas: [
      { id: 'strength', descriptionKey: 'neuromuscular_training.areas.strength' },
      { id: 'cardioFitness', descriptionKey: 'neuromuscular_training.areas.cardioFitness' },
      { id: 'nervousSystem', descriptionKey: 'neuromuscular_training.areas.nervousSystem' },
    ],
    title: 'neuromuscular_training.title',
    descriptionKey: 'neuromuscular_training.description',
    supplements: [],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['muscles','nervousSystem'],
  },
  {
    id: 'creatine_atp_strength',
    level: 4,
    xp: 500,
    areas: [
      { id: 'strength', descriptionKey: 'creatine_atp_strength.areas.strength' },
      { id: 'energy', descriptionKey: 'creatine_atp_strength.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'creatine_atp_strength.areas.cardioFitness' },
      { id: 'mind', descriptionKey: 'creatine_atp_strength.areas.mind' },
    ],
    title: 'creatine_atp_strength.title',
    descriptionKey: 'creatine_atp_strength.description',
    supplements: [{ id: 'creatine' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['muscles','brain'],
  },
  {
    id: 'betaalanine_endurance',
    level: 6,
    xp: 700,
    areas: [
      { id: 'strength', descriptionKey: 'betaalanine_endurance.areas.strength' },
      { id: 'cardioFitness', descriptionKey: 'betaalanine_endurance.areas.cardioFitness' },
    ],
    title: 'betaalanine_endurance.title',
    descriptionKey: 'betaalanine_endurance.description',
    supplements: [{ id: 'betaAlanine' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['muscles'],
  },
  {
    id: 'shilajit_performance',
    level: 8,
    xp: 900,
    areas: [
      { id: 'strength', descriptionKey: 'shilajit_performance.areas.strength' },
      { id: 'energy', descriptionKey: 'shilajit_performance.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'shilajit_performance.areas.cardioFitness' },
    ],
    title: 'shilajit_performance.title',
    descriptionKey: 'shilajit_performance.description',
    supplements: [{ id: 'shilajit' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['muscles'],
  },
  {
    id: 'probiotics_microbiota',
    level: 2,
    xp: 300,
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'probiotics_microbiota.areas.digestiveHealth' },
      { id: 'immuneSupport', descriptionKey: 'probiotics_microbiota.areas.immuneSupport' },
    ],
    title: 'probiotics_microbiota.title',
    descriptionKey: 'probiotics_microbiota.description',
    isParent: true,
    supplements: [{ id: 'probiotics' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['afternoon'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    nutritionFoods: [{ key: 'yogurt' }, { key: 'kefir' }, { key: 'sauerkraut' }, { key: 'kimchi' }, { key: 'miso' }],
    bodyParts: ['digestiveSystem'],
    microbiomeIds: ['Lactobacillus', 'Bifidobacterium'],
  },
  {
    id: 'lactobacillus_reuteri',
    level: 2,
    xp: 500,
    parentId: 'probiotics_microbiota',
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'lactobacillus_reuteri.areas.digestiveHealth' },
      { id: 'immuneSupport', descriptionKey: 'lactobacillus_reuteri.areas.immuneSupport' },
    ],
    title: 'lactobacillus_reuteri.title',
    descriptionKey: 'lactobacillus_reuteri.description',
    supplements: [{ id: 'probiotics' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['afternoon'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['digestiveSystem', 'immuneSystem', 'teeth'],
    microbiomeIds: ['Lactobacillus'],
  },
  {
    id: 'fiber_microbiome',
    level: 1,
    xp: 300,
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'fiber_microbiome.areas.digestiveHealth' },
      { id: 'immuneSupport', descriptionKey: 'fiber_microbiome.areas.immuneSupport' },
      { id: 'longevity', descriptionKey: 'fiber_microbiome.areas.longevity' },
    ],
    title: 'fiber_microbiome.title',
    descriptionKey: 'fiber_microbiome.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['afternoon', 'evening'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    isParent: true,
    targetPeriod: 'daily',
    fiberTargets: [
      { tag: 'fiber_total', amount: 25, unit: 'g', sourceBackedWeight: 1, inferredWeight: 0.7 },
    ],
    nutritionFoods: [
      {
        key: 'oats',
        nutrientTags: ['fiber_total'],
        fiberSubtypes: ['beta_glucans', 'arabinoxylan'],
        microbiomeSupport: ['Roseburia', 'Faecalibacterium'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'legumes',
        nutrientTags: ['fiber_total'],
        fiberSubtypes: ['pectin', 'cellulose', 'hemicellulose'],
        microbiomeSupport: ['Akkermansia', 'Roseburia', 'Ruminococcus'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'chiaSeeds',
        nutrientTags: ['fiber_total'],
        fiberSubtypes: ['mucilage', 'cellulose'],
        microbiomeSupport: ['Faecalibacterium', 'Ruminococcus'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'berries',
        nutrientTags: ['fiber_total'],
        fiberSubtypes: ['pectin', 'cellulose'],
        microbiomeSupport: ['Akkermansia', 'Roseburia'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'cruciferousVeg',
        nutrientTags: ['fiber_total'],
        fiberSubtypes: ['cellulose', 'hemicellulose'],
        microbiomeSupport: ['Faecalibacterium', 'Ruminococcus'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'medium',
      },
    ],
    bodyParts: ['digestiveSystem'],
    microbiomeIds: ['Akkermansia', 'Roseburia', 'Faecalibacterium', 'Ruminococcus'],
  },
  {
    id: 'fiber_butyrate',
    level: 2,
    xp: 500,
    parentId: 'fiber_microbiome',
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'fiber_butyrate.areas.digestiveHealth' },
      { id: 'immuneSupport', descriptionKey: 'fiber_butyrate.areas.immuneSupport' },
      { id: 'longevity', descriptionKey: 'fiber_butyrate.areas.longevity' },
    ],
    title: 'fiber_butyrate.title',
    descriptionKey: 'fiber_butyrate.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['afternoon', 'evening'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    targetPeriod: 'daily',
    fiberTargets: [
      { tag: 'fiber_total', amount: 30, unit: 'g', sourceBackedWeight: 1, inferredWeight: 0.7 },
      { tag: 'fiber_fermentable', amount: 15, unit: 'g', sourceBackedWeight: 1, inferredWeight: 0.7 },
    ],
    nutritionFoods: [
      {
        key: 'oats',
        nutrientTags: ['fiber_total', 'fiber_fermentable'],
        fiberSubtypes: ['beta_glucans', 'resistant_starch'],
        microbiomeSupport: ['Roseburia', 'Faecalibacterium'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'legumes',
        nutrientTags: ['fiber_total', 'fiber_fermentable'],
        fiberSubtypes: ['resistant_starch', 'galactooligosaccharides', 'inulin'],
        microbiomeSupport: ['Roseburia', 'Faecalibacterium', 'Ruminococcus'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'greenBanana',
        nutrientTags: ['fiber_total', 'fiber_fermentable'],
        fiberSubtypes: ['resistant_starch'],
        microbiomeSupport: ['Faecalibacterium', 'Ruminococcus'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'chicoryRoot',
        nutrientTags: ['fiber_total', 'fiber_fermentable'],
        fiberSubtypes: ['inulin', 'fructooligosaccharides'],
        microbiomeSupport: ['Roseburia', 'Faecalibacterium'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'cookedCooledPotato',
        nutrientTags: ['fiber_total', 'fiber_fermentable'],
        fiberSubtypes: ['resistant_starch'],
        microbiomeSupport: ['Faecalibacterium', 'Ruminococcus'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'medium',
      },
    ],
    bodyParts: ['digestiveSystem'],
    microbiomeIds: ['Roseburia', 'Faecalibacterium', 'Ruminococcus'],
  },
  {
    id: 'fiber_gel_forming_focus',
    level: 3,
    xp: 500,
    parentId: 'fiber_microbiome',
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'fiber_gel_forming_focus.areas.digestiveHealth' },
      { id: 'immuneSupport', descriptionKey: 'fiber_gel_forming_focus.areas.immuneSupport' },
      { id: 'longevity', descriptionKey: 'fiber_gel_forming_focus.areas.longevity' },
    ],
    title: 'fiber_gel_forming_focus.title',
    descriptionKey: 'fiber_gel_forming_focus.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    targetPeriod: 'daily',
    fiberTargets: [
      { tag: 'fiber_total', amount: 30, unit: 'g', sourceBackedWeight: 1, inferredWeight: 0.7 },
      { tag: 'fiber_gel_forming', amount: 10, unit: 'g', sourceBackedWeight: 1, inferredWeight: 0.7 },
    ],
    nutritionFoods: [
      {
        key: 'oats',
        nutrientTags: ['fiber_total', 'fiber_gel_forming'],
        fiberSubtypes: ['beta_glucans'],
        microbiomeSupport: ['Roseburia', 'Faecalibacterium'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'psylliumHusk',
        nutrientTags: ['fiber_total', 'fiber_gel_forming'],
        fiberSubtypes: ['psyllium', 'mucilage'],
        microbiomeSupport: ['Faecalibacterium', 'Roseburia'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'chiaSeeds',
        nutrientTags: ['fiber_total', 'fiber_gel_forming'],
        fiberSubtypes: ['mucilage'],
        microbiomeSupport: ['Faecalibacterium', 'Ruminococcus'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'apples',
        nutrientTags: ['fiber_total', 'fiber_gel_forming'],
        fiberSubtypes: ['pectin'],
        microbiomeSupport: ['Akkermansia', 'Roseburia'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'okra',
        nutrientTags: ['fiber_total', 'fiber_gel_forming'],
        fiberSubtypes: ['mucilage', 'pectin'],
        microbiomeSupport: ['Faecalibacterium', 'Roseburia'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'medium',
      },
    ],
    bodyParts: ['digestiveSystem'],
    microbiomeIds: ['Roseburia', 'Faecalibacterium', 'Akkermansia'],
  },
  {
    id: 'fiber_non_gel_forming_focus',
    level: 3,
    xp: 500,
    parentId: 'fiber_microbiome',
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'fiber_non_gel_forming_focus.areas.digestiveHealth' },
      { id: 'immuneSupport', descriptionKey: 'fiber_non_gel_forming_focus.areas.immuneSupport' },
      { id: 'longevity', descriptionKey: 'fiber_non_gel_forming_focus.areas.longevity' },
    ],
    title: 'fiber_non_gel_forming_focus.title',
    descriptionKey: 'fiber_non_gel_forming_focus.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['midday', 'evening'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    targetPeriod: 'daily',
    fiberTargets: [
      { tag: 'fiber_total', amount: 30, unit: 'g', sourceBackedWeight: 1, inferredWeight: 0.7 },
      { tag: 'fiber_non_gel_forming', amount: 20, unit: 'g', sourceBackedWeight: 1, inferredWeight: 0.7 },
    ],
    nutritionFoods: [
      {
        key: 'wheatBran',
        nutrientTags: ['fiber_total', 'fiber_non_gel_forming'],
        fiberSubtypes: ['arabinoxylan', 'hemicellulose', 'cellulose'],
        microbiomeSupport: ['Ruminococcus', 'Faecalibacterium'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'cruciferousVeg',
        nutrientTags: ['fiber_total', 'fiber_non_gel_forming'],
        fiberSubtypes: ['cellulose', 'hemicellulose'],
        microbiomeSupport: ['Faecalibacterium', 'Ruminococcus'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'leafyGreens',
        nutrientTags: ['fiber_total', 'fiber_non_gel_forming'],
        fiberSubtypes: ['cellulose', 'hemicellulose'],
        microbiomeSupport: ['Ruminococcus', 'Faecalibacterium'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'nuts',
        nutrientTags: ['fiber_total', 'fiber_non_gel_forming'],
        fiberSubtypes: ['cellulose', 'lignin'],
        microbiomeSupport: ['Akkermansia', 'Ruminococcus'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'medium',
      },
      {
        key: 'wholeGrainRye',
        nutrientTags: ['fiber_total', 'fiber_non_gel_forming'],
        fiberSubtypes: ['arabinoxylan', 'cellulose', 'hemicellulose'],
        microbiomeSupport: ['Ruminococcus', 'Roseburia'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
    ],
    bodyParts: ['digestiveSystem'],
    microbiomeIds: ['Ruminococcus', 'Faecalibacterium', 'Roseburia'],
  },
  {
    id: 'plant_diversity_30_week',
    level: 2,
    xp: 450,
    parentId: 'fiber_microbiome',
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'plant_diversity_30_week.areas.digestiveHealth' },
      { id: 'immuneSupport', descriptionKey: 'plant_diversity_30_week.areas.immuneSupport' },
      { id: 'longevity', descriptionKey: 'plant_diversity_30_week.areas.longevity' },
    ],
    title: 'plant_diversity_30_week.title',
    descriptionKey: 'plant_diversity_30_week.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'evening'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    targetPeriod: 'weekly',
    nutritionFoods: [
      {
        key: 'legumes',
        nutrientTags: ['fiber_total', 'fiber_fermentable'],
        fiberSubtypes: ['resistant_starch', 'galactooligosaccharides'],
        microbiomeSupport: ['Roseburia', 'Faecalibacterium', 'Akkermansia'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'berries',
        nutrientTags: ['fiber_total', 'polyphenols_total', 'anthocyanins'],
        fiberSubtypes: ['pectin'],
        microbiomeSupport: ['Akkermansia', 'Roseburia'],
        sourceRefs: ['Phenol-Explorer', 'USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'leafyGreens',
        nutrientTags: ['fiber_total', 'fiber_non_gel_forming'],
        fiberSubtypes: ['cellulose', 'hemicellulose'],
        microbiomeSupport: ['Ruminococcus', 'Faecalibacterium'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'nuts',
        nutrientTags: ['fiber_total', 'polyphenols_total'],
        fiberSubtypes: ['cellulose', 'lignin'],
        microbiomeSupport: ['Akkermansia', 'Ruminococcus'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'medium',
      },
      {
        key: 'freshHerbs',
        nutrientTags: ['polyphenols_total', 'flavonoids_total'],
        microbiomeSupport: ['Akkermansia', 'Gordonibacter'],
        sourceRefs: ['Phenol-Explorer'],
        defaultConfidence: 'medium',
      },
    ],
    bodyParts: ['digestiveSystem', 'immuneSystem'],
    microbiomeIds: ['Akkermansia', 'Roseburia', 'Faecalibacterium', 'Ruminococcus', 'Gordonibacter'],
    trackingTargets: [
      {
        trackingKey: 'unique_plants',
        amount: 30,
        unit: 'items',
        aiInstruction: 'List distinct plant foods visible in the meal. Do not include animal foods or sauces.',
      },
      {
        trackingKey: 'vegetable_colors',
        amount: 6,
        unit: 'items',
        aiInstruction: 'Track only colors represented by visible vegetables. Never infer color from egg, pasta, dairy, meat, or dressing.',
      },
    ],
  },
  {
    id: 'fish_omega3_weekly',
    level: 2,
    xp: 400,
    areas: [
      { id: 'heartHealth', descriptionKey: 'fish_omega3_weekly.areas.heartHealth' },
      { id: 'brainHealth', descriptionKey: 'fish_omega3_weekly.areas.brainHealth' },
      { id: 'inflammation', descriptionKey: 'fish_omega3_weekly.areas.inflammation' },
    ],
    title: 'fish_omega3_weekly.title',
    descriptionKey: 'fish_omega3_weekly.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['midday', 'evening'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    targetPeriod: 'weekly',
    trackingTargets: [
      {
        trackingKey: 'fish_meals',
        amount: 3,
        unit: 'count',
        aiInstruction: 'Increment by 1 only when fish is clearly visible in the meal.',
      },
      {
        trackingKey: 'fatty_fish_meals',
        amount: 1,
        unit: 'count',
        aiInstruction: 'Increment by 1 only when fatty fish is clearly visible (e.g., salmon, mackerel, herring, sardine, trout).',
      },
    ],
    nutritionFoods: [
      {
        key: 'fattyFish',
        nutrientTags: ['fiber_total'],
        microbiomeSupport: ['Akkermansia', 'Roseburia'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'leanFish',
        nutrientTags: ['fiber_total'],
        microbiomeSupport: ['Faecalibacterium'],
        sourceRefs: ['USDA FoodData Central'],
        defaultConfidence: 'medium',
      },
    ],
    bodyParts: ['cardiovascularSystem', 'brain'],
    microbiomeIds: ['Akkermansia', 'Roseburia', 'Faecalibacterium'],
  },
  {
    id: 'polyphenol_microbiome',
    level: 2,
    xp: 400,
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'polyphenol_microbiome.areas.digestiveHealth' },
      { id: 'immuneSupport', descriptionKey: 'polyphenol_microbiome.areas.immuneSupport' },
      { id: 'longevity', descriptionKey: 'polyphenol_microbiome.areas.longevity' },
    ],
    title: 'polyphenol_microbiome.title',
    descriptionKey: 'polyphenol_microbiome.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    targetPeriod: 'daily',
    polyphenolTargets: [
      { tag: 'polyphenols_total', amount: 1000, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.5 },
      { tag: 'flavonoids_total', amount: 500, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.5 },
      { tag: 'anthocyanins', amount: 150, unit: 'mg', sourceBackedWeight: 1, inferredWeight: 0.6 },
    ],
    nutritionFoods: [
      {
        key: 'berries',
        nutrientTags: ['polyphenols_total', 'flavonoids_total', 'anthocyanins'],
        microbiomeSupport: ['Akkermansia', 'Gordonibacter'],
        sourceRefs: ['Phenol-Explorer', 'USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'darkChocolate',
        nutrientTags: ['polyphenols_total', 'flavonoids_total', 'catechins', 'flavanols'],
        microbiomeSupport: ['Akkermansia', 'Lactobacillus'],
        sourceRefs: ['Phenol-Explorer'],
        defaultConfidence: 'high',
      },
      {
        key: 'pomegranate',
        nutrientTags: ['polyphenols_total', 'ellagitannins', 'flavonoids_total'],
        microbiomeSupport: ['Akkermansia', 'Gordonibacter'],
        sourceRefs: ['Phenol-Explorer', 'USDA FoodData Central'],
        defaultConfidence: 'high',
      },
      {
        key: 'greenTea',
        nutrientTags: ['polyphenols_total', 'flavonoids_total', 'catechins'],
        microbiomeSupport: ['Akkermansia', 'Lactobacillus'],
        sourceRefs: ['Phenol-Explorer'],
        defaultConfidence: 'high',
      },
      {
        key: 'extraVirginOliveOil',
        nutrientTags: ['polyphenols_total'],
        microbiomeSupport: ['Akkermansia', 'Faecalibacterium'],
        sourceRefs: ['Phenol-Explorer'],
        defaultConfidence: 'medium',
      },
    ],
    bodyParts: ['digestiveSystem', 'cells'],
    microbiomeIds: ['Akkermansia', 'Gordonibacter', 'Lactobacillus'],
  },
  {
    id: 'milk_thistle_liver',
    level: 7,
    xp: 700,
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'milk_thistle_liver.areas.digestiveHealth' },
      { id: 'immuneSupport', descriptionKey: 'milk_thistle_liver.areas.immuneSupport' },
    ],
    title: 'milk_thistle_liver.title',
    descriptionKey: 'milk_thistle_liver.description',
    supplements: [{ id: 'milkThistle' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['afternoon'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['liver'],
  },
  {
    id: 'hiit_vo2max',
    level: 2,
    xp: 500,
    areas: [
      { id: 'cardioFitness', descriptionKey: 'hiit_vo2max.areas.cardioFitness' },
      { id: 'energy', descriptionKey: 'hiit_vo2max.areas.energy' },
      { id: 'longevity', descriptionKey: 'hiit_vo2max.areas.longevity' },
    ],
    title: 'hiit_vo2max.title',
    descriptionKey: 'hiit_vo2max.description',
    analyzePrompt: 'hiit_vo2max.analyzePrompt',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['heart','lungs','muscles'],
  },
  {
    id: 'vo2max_4x4_intervals',
    level: 3,
    xp: 600,
    areas: [
      { id: 'cardioFitness', descriptionKey: 'vo2max_4x4_intervals.areas.cardioFitness' },
      { id: 'energy', descriptionKey: 'vo2max_4x4_intervals.areas.energy' },
      { id: 'longevity', descriptionKey: 'vo2max_4x4_intervals.areas.longevity' },
    ],
    title: 'vo2max_4x4_intervals.title',
    descriptionKey: 'vo2max_4x4_intervals.description',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['heart', 'lungs', 'muscles'],
  },
  {
    id: 'vo2max_hill_intervals',
    level: 4,
    xp: 700,
    areas: [
      { id: 'cardioFitness', descriptionKey: 'vo2max_hill_intervals.areas.cardioFitness' },
      { id: 'strength', descriptionKey: 'vo2max_hill_intervals.areas.strength' },
      { id: 'longevity', descriptionKey: 'vo2max_hill_intervals.areas.longevity' },
    ],
    title: 'vo2max_hill_intervals.title',
    descriptionKey: 'vo2max_hill_intervals.description',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['heart', 'lungs', 'muscles', 'joints'],
  },
  {
    id: 'running_volume_aerobic',
    level: 3,
    xp: 700,
    areas: [
      { id: 'cardioFitness', descriptionKey: 'running_volume_aerobic.areas.cardioFitness' },
      { id: 'energy', descriptionKey: 'running_volume_aerobic.areas.energy' },
    ],
    title: 'running_volume_aerobic.title',
    descriptionKey: 'running_volume_aerobic.description',
    analyzePrompt: 'running_volume_aerobic.analyzePrompt',
    preferredDayParts: ['morning', 'midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['heart','lungs','muscles','joints'],
  },
  {
    id: 'ashwagandha_adaptogen',
    level: 6,
    xp: 0,
    parentId: 'adaptogenic_herbs',
    areas: [
      { id: 'nervousSystem', descriptionKey: 'ashwagandha_adaptogen.areas.nervousSystem' },
      { id: 'energy', descriptionKey: 'ashwagandha_adaptogen.areas.energy' },
      { id: 'immuneSupport', descriptionKey: 'ashwagandha_adaptogen.areas.immuneSupport' },
    ],
    title: 'ashwagandha_adaptogen.title',
    descriptionKey: 'ashwagandha_adaptogen.description',
    supplements: [{ id: 'ashwagandha' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'rhodiola_adaptogen',
    level: 7,
    xp: 0,
    parentId: 'adaptogenic_herbs',
    areas: [
      { id: 'nervousSystem', descriptionKey: 'rhodiola_adaptogen.areas.nervousSystem' },
      { id: 'energy', descriptionKey: 'rhodiola_adaptogen.areas.energy' },
      { id: 'mind', descriptionKey: 'rhodiola_adaptogen.areas.mind' },
    ],
    title: 'rhodiola_adaptogen.title',
    descriptionKey: 'rhodiola_adaptogen.description',
    supplements: [{ id: 'rhodiolaRosea' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'holy_basil_adaptogen',
    level: 7,
    xp: 0,
    parentId: 'adaptogenic_herbs',
    areas: [
      { id: 'nervousSystem', descriptionKey: 'holy_basil_adaptogen.areas.nervousSystem' },
      { id: 'immuneSupport', descriptionKey: 'holy_basil_adaptogen.areas.immuneSupport' },
    ],
    title: 'holy_basil_adaptogen.title',
    descriptionKey: 'holy_basil_adaptogen.description',
    supplements: [{ id: 'holyBasil' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['nervousSystem'],
  },
  {
    id: 'reishi_mushroom',
    level: 7,
    xp: 0,
    parentId: 'medicinal_mushrooms',
    areas: [
      { id: 'immuneSupport', descriptionKey: 'reishi_mushroom.areas.immuneSupport' },
      { id: 'nervousSystem', descriptionKey: 'reishi_mushroom.areas.nervousSystem' },
    ],
    title: 'reishi_mushroom.title',
    descriptionKey: 'reishi_mushroom.description',
    supplements: [{ id: 'reishi' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['evening'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['immuneSystem', 'nervousSystem'],
  },
  {
    id: 'lions_mane_mushroom',
    level: 8,
    xp: 0,
    parentId: 'medicinal_mushrooms',
    areas: [
      { id: 'mind', descriptionKey: 'lions_mane_mushroom.areas.mind' },
      { id: 'nervousSystem', descriptionKey: 'lions_mane_mushroom.areas.nervousSystem' },
    ],
    title: 'lions_mane_mushroom.title',
    descriptionKey: 'lions_mane_mushroom.description',
    supplements: [{ id: 'lionsMane' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['brain', 'nervousSystem'],
  },
  {
    id: 'chaga_mushroom',
    level: 8,
    xp: 0,
    parentId: 'medicinal_mushrooms',
    areas: [
      { id: 'immuneSupport', descriptionKey: 'chaga_mushroom.areas.immuneSupport' },
      { id: 'energy', descriptionKey: 'chaga_mushroom.areas.energy' },
    ],
    title: 'chaga_mushroom.title',
    descriptionKey: 'chaga_mushroom.description',
    supplements: [{ id: 'chaga' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['immuneSystem', 'cells'],
  },
  {
    id: 'cordyceps_adaptogen',
    level: 7,
    xp: 0,
    parentId: 'medicinal_mushrooms',
    areas: [
      { id: 'energy', descriptionKey: 'cordyceps_adaptogen.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'cordyceps_adaptogen.areas.cardioFitness' },
      { id: 'immuneSupport', descriptionKey: 'cordyceps_adaptogen.areas.immuneSupport' },
    ],
    title: 'cordyceps_adaptogen.title',
    descriptionKey: 'cordyceps_adaptogen.description',
    supplements: [{ id: 'cordyceps' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['nervousSystem'],
  },

  // --- Running / performance tips (added) ---
  {
    id: 'zone2_slow_running',
    level: 1,
    xp: 300,
    areas: [
      { id: 'cardioFitness', descriptionKey: 'zone2_slow_running.areas.cardioFitness' },
      { id: 'energy', descriptionKey: 'zone2_slow_running.areas.energy' },
    ],
    title: 'zone2_slow_running.title',
    descriptionKey: 'zone2_slow_running.description',
    preferredDayParts: ['morning', 'midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['heart','lungs','muscles'],
  },
  {
    id: 'zone2_mitochondrial_base',
    level: 3,
    xp: 500,
    areas: [
      { id: 'cardioFitness', descriptionKey: 'zone2_mitochondrial_base.areas.cardioFitness' },
      { id: 'energy', descriptionKey: 'zone2_mitochondrial_base.areas.energy' },
      { id: 'longevity', descriptionKey: 'zone2_mitochondrial_base.areas.longevity' },
    ],
    title: 'zone2_mitochondrial_base.title',
    descriptionKey: 'zone2_mitochondrial_base.description',
    analyzePrompt: 'zone2_mitochondrial_base.analyzePrompt',
    preferredDayParts: ['morning', 'midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['heart','lungs','muscles'],
  },
  {
    id: 'fascia_strength_whole_body_variation',
    level: 2,
    xp: 600,
    areas: [
      { id: 'longevity', descriptionKey: 'fascia_strength_whole_body_variation.areas.longevity' },
      { id: 'strength', descriptionKey: 'fascia_strength_whole_body_variation.areas.strength' },
      { id: 'nervousSystem', descriptionKey: 'fascia_strength_whole_body_variation.areas.nervousSystem' },
    ],
    title: 'fascia_strength_whole_body_variation.title',
    descriptionKey: 'fascia_strength_whole_body_variation.description',
    preferredDayParts: ['morning', 'midday', 'afternoon', 'evening'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['muscles', 'joints', 'bones', 'nervousSystem'],
  },
  {
    id: 'fasted_aerobic_training',
    level: 6,
    xp: 700,
    areas: [
      { id: 'energy', descriptionKey: 'fasted_aerobic_training.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'fasted_aerobic_training.areas.cardioFitness' },
    ],
    title: 'fasted_aerobic_training.title',
    descriptionKey: 'fasted_aerobic_training.description',
    preferredDayParts: ['morning'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['heart','lungs','muscles'],
  },
  {
    id: 'lactate_threshold_training',
    level: 5,
    xp: 700,
    areas: [
      { id: 'cardioFitness', descriptionKey: 'lactate_threshold_training.areas.cardioFitness' },
      { id: 'energy', descriptionKey: 'lactate_threshold_training.areas.energy' },
      { id: 'mind', descriptionKey: 'lactate_threshold_training.areas.mind' },
    ],
    title: 'lactate_threshold_training.title',
    descriptionKey: 'lactate_threshold_training.description',
    analyzePrompt: 'lactate_threshold_training.analyzePrompt',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['heart','muscles'],
  },
  {
    id: 'running_economy_drills',
    level: 4,
    xp: 500,
    areas: [
      { id: 'strength', descriptionKey: 'running_economy_drills.areas.strength' },
      { id: 'nervousSystem', descriptionKey: 'running_economy_drills.areas.nervousSystem' },
      { id: 'cardioFitness', descriptionKey: 'running_economy_drills.areas.cardioFitness' },
    ],
    title: 'running_economy_drills.title',
    descriptionKey: 'running_economy_drills.description',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['heart','muscles'],
  },
  {
    id: 'stride_frequency_optimization',
    level: 6,
    xp: 700,
    areas: [
      { id: 'strength', descriptionKey: 'stride_frequency_optimization.areas.strength' },
      { id: 'nervousSystem', descriptionKey: 'stride_frequency_optimization.areas.nervousSystem' },
      { id: 'energy', descriptionKey: 'stride_frequency_optimization.areas.energy' },
    ],
    title: 'stride_frequency_optimization.title',
    descriptionKey: 'stride_frequency_optimization.description',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['training'],
    bodyParts: ['heart','muscles'],
  },
  {
    id: 'caffeine',
    level: 4,
    xp: 500,
    areas: [
      { id: 'energy', descriptionKey: 'caffeine.areas.energy' },
      { id: 'mind', descriptionKey: 'caffeine.areas.mind' },
      { id: 'cardioFitness', descriptionKey: 'caffeine.areas.cardioFitness' },
    ],
    title: 'caffeine.title',
    descriptionKey: 'caffeine.description',
    supplements: [{ id: 'caffeine' }],
    trainingRelation: 'preWorkout',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'avoidLateEvening',
    planCategory: ['supplement'],
    bodyParts: ['nervousSystem','muscles'],
  },
  {
    id: 'nitrate_no_efficiency',
    level: 5,
    xp: 700,
    areas: [
      { id: 'cardioFitness', descriptionKey: 'nitrate_no_efficiency.areas.cardioFitness' },
      { id: 'energy', descriptionKey: 'nitrate_no_efficiency.areas.energy' },
    ],
    title: 'nitrate_no_efficiency.title',
    descriptionKey: 'nitrate_no_efficiency.description',
    supplements: [{ id: 'beetrootExtract' }],
    trainingRelation: 'preWorkout',
    preferredDayParts: ['morning', 'midday'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['heart','muscles'],
  },
  {
    id: 'l_carnitine_fat_transport',
    level: 8,
    xp: 700,
    areas: [
      { id: 'energy', descriptionKey: 'l_carnitine_fat_transport.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'l_carnitine_fat_transport.areas.cardioFitness' },
    ],
    title: 'l_carnitine_fat_transport.title',
    descriptionKey: 'l_carnitine_fat_transport.description',
    supplements: [{ id: 'lCarnitine' }],
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'midday', 'afternoon'],
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['heart','muscles'], 
  },
  {
    id: 'astaxanthin_recovery_antioxidant',
    level: 9,
    xp: 700,
    areas: [
      { id: 'strength', descriptionKey: 'astaxanthin_recovery_antioxidant.areas.strength' },
      { id: 'energy', descriptionKey: 'astaxanthin_recovery_antioxidant.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'astaxanthin_recovery_antioxidant.areas.cardioFitness' },
    ],
    title: 'astaxanthin_recovery_antioxidant.title',
    descriptionKey: 'astaxanthin_recovery_antioxidant.description',
    supplements: [
      { id: 'astaxanthin' },
      { id: 'vitaminETocotrienols' },
      { id: 'vitaminEMixedTocopherols' },
      { id: 'vitaminE' },
    ],
    trainingRelation: 'avoidNearWorkout',
    preferredDayParts: ['evening'],
    timeRule: 'anytime',
    analyzePrompt: 'astaxanthin_recovery_antioxidant.analyzePrompt',
    planCategory: ['supplement'],
    bodyParts: ['skin','muscles','eye'],     
  },
  {
    id: 'brown_fat_cool_home',
    level: 9,
    xp: 300,
    areas: [{ id: 'energy', descriptionKey: 'brown_fat_cool_home.areas.energy' }],
    title: 'brown_fat_cool_home.title',
    descriptionKey: 'brown_fat_cool_home.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'evening'],
    timeRule: 'anytime',
    bodyParts: ['fattyTissue' ], 
  },
  {
    id: 'avoid_flat_hard_shoes',
    level: 1,
    xp: 200,
    areas: [
      { id: 'strength', descriptionKey: 'avoid_flat_hard_shoes.areas.strength' },
      { id: 'nervousSystem', descriptionKey: 'avoid_flat_hard_shoes.areas.nervousSystem' },
    ],
    title: 'avoid_flat_hard_shoes.title',
    descriptionKey: 'avoid_flat_hard_shoes.description',
    trainingRelation: 'anytime',
    timeRule: 'anytime',
    bodyParts: ['feet', 'nervousSystem', 'joints', 'bones' ],
  },
  {
    id: 'eat_colorful_veggies',
    level: 1,
    xp: 300,
    areas: [
      { id: 'digestiveHealth', descriptionKey: 'eat_colorful_veggies.areas.digestiveHealth' },
      { id: 'immuneSupport', descriptionKey: 'eat_colorful_veggies.areas.immuneSupport' },
    ],
    title: 'eat_colorful_veggies.title',
    descriptionKey: 'eat_colorful_veggies.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['midday', 'evening'],
    timeRule: 'anytime',
    planCategory: ['nutrition'],
    nutritionFoods: [
      { key: 'redVeggies' },
      { key: 'orangeVeggies' },
      { key: 'yellowVeggies' },
      { key: 'greenVeggies' },
      { key: 'bluePurpleVeggies' },
    ],
    bodyParts: ['digestiveSystem' ],
  },
  {
    id: 'near_infrared_red_light',
    level: 10,
    xp: 500,
    areas: [
      { id: 'energy', descriptionKey: 'near_infrared_red_light.areas.energy' },
      { id: 'strength', descriptionKey: 'near_infrared_red_light.areas.strength' }
    ],
    title: 'near_infrared_red_light.title',
    descriptionKey: 'near_infrared_red_light.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'evening'],
    timeRule: 'anytime',
    bodyParts: ['skin','eye' ],
  },
  {
    id: 'far_infrared_light',
    level: 10,
    xp: 500,
    areas: [
      { id: 'energy', descriptionKey: 'far_infrared_light.areas.energy' },
      { id: 'strength', descriptionKey: 'far_infrared_light.areas.strength' }
    ],
    title: 'far_infrared_light.title',
    descriptionKey: 'far_infrared_light.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['morning', 'evening'],
    timeRule: 'anytime',
    bodyParts: ['skin','muscles' ],
  },
  {
    id: 'nasal_breathing_nitric_oxide',
    level: 1,
    xp: 300,
    areas: [
      { id: 'energy', descriptionKey: 'nasal_breathing_nitric_oxide.areas.energy' },
      { id: 'cardioFitness', descriptionKey: 'nasal_breathing_nitric_oxide.areas.cardioFitness' }
    ],
    title: 'nasal_breathing_nitric_oxide.title',
    descriptionKey: 'nasal_breathing_nitric_oxide.description',
    trainingRelation: 'anytime',
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['bloodVessels'],
  },
  {
    id: 'lutein_zeaxanthin_eye_health',
    level: 8,
    xp: 500,
    areas: [
      { id: 'energy', descriptionKey: 'lutein_zeaxanthin_eye_health.areas.energy' }
    ],
    title: 'lutein_zeaxanthin_eye_health.title',
    descriptionKey: 'lutein_zeaxanthin_eye_health.description',
    supplements: [{ id: 'lutein' }, { id: 'zeaxanthin' }],
    trainingRelation: 'anytime',
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['eye'],
  },
    {
    id: 'sulfate',
    level: 6,
    xp: 400,
     areas: [
        { id: 'digestiveHealth', descriptionKey: 'sulfate.areas.digestiveHealth' },
        { id: 'energy', descriptionKey: 'sulfate.areas.energy' }
      ],
    title: 'sulfate.title',
    descriptionKey: 'sulfate.description',
    isParent: true,
    nutritionFoods: [
      { key: 'garlic' },
      { key: 'onions' },
      { key: 'eggs' },
      { key: 'cruciferousVeg' },
      ],
    bodyParts: ['hair'],
  },
  {
    id: 'msm_joint_health',
    level: 6,
    xp: 500,
    areas: [
      { id: 'strength', descriptionKey: 'msm_joint_health.areas.strength' },
      { id: 'immuneSupport', descriptionKey: 'msm_joint_health.areas.recovery' },

    ],
    title: 'msm_joint_health.title',
    parentId: 'sulfate',
    descriptionKey: 'msm_joint_health.description',
    supplements: [{ id: 'msm' }],
    trainingRelation: 'anytime',
    timeRule: 'anytime',
    planCategory: ['supplement'],
    bodyParts: ['joints', 'digestiveSystem', 'hair', 'bones' ],
  },
  {
    id: 'blue_light_evening',
    level: 1,
    xp: 200,
    areas: [
      { id: 'sleepQuality', descriptionKey: 'blue_light_evening.areas.sleepQuality' }
    ],
    title: 'blue_light_evening.title',
    descriptionKey: 'blue_light_evening.description',
    trainingRelation: 'anytime',
    preferredDayParts: ['evening', 'night'],
    timeRule: 'anytime',
    planCategory: ['other'],
    bodyParts: ['nervousSystem'],
  },
];

export const tips: Tip[] = rawTips.map(tip => {
  // Om planCategory saknas, default till ['other']
  let planCategory: PlanCategory[] = tip.planCategory ?? ['other'];

  // Om tip har supplements och saknar 'supplement' i planCategory, lägg till det
  if (tip.supplements && tip.supplements.length > 0 && !planCategory.includes('supplement')) {
    planCategory = [...planCategory, 'supplement'];
  }

  return {
    ...tip,
    planCategory,
  };
});
