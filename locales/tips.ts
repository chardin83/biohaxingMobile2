// Removed unused supplementIds import

type SupplementReference = {
  id: string;
};

export type TipArea = {
  id: string;
  descriptionKey: string;
};

export type TrainingRelation =
  | "anytime"
  | "preWorkout"
  | "postWorkout"
  | "avoidPreWorkout"
  | "avoidPostWorkout"
  | "avoidNearWorkout"; // generellt “inte nära pass” (t.ex. ±3–6h)

export type DayPart = "morning" | "midday" | "afternoon" | "evening" | "night";

export type TimeOfDayRule =
  | "anytime"
  | "avoidLateEvening" // koffein
  | "avoidNight"; // ännu striktare om du vill

export type TipPlanCategory = "supplement" | "training" | "nutrition";

export type TipNutritionFood = {
  key: string;
  detailsKey?: string; // Optional override when detail uses a separate translation key
};

export type Tip = {
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
  planCategory?: TipPlanCategory; // Markerar övergripande plan-kategori
  planCategoryOptions?: TipPlanCategory[]; // Tillåt användarval mellan kategorier
  nutritionFoods?: TipNutritionFood[]; // Rekommenderade livsmedel för nutritionstips
};

export const tips: Tip[] = [
    {
    id: "eat_colorful_veggies",
    level: 1,
    xp: 300,
    areas: [
      { id: "digestiveHealth", descriptionKey: "eat_colorful_veggies.areas.digestiveHealth" },
      { id: "immuneSupport", descriptionKey: "eat_colorful_veggies.areas.immuneSupport" }
    ],
    title: "eat_colorful_veggies.title",
    descriptionKey: "eat_colorful_veggies.description",
    trainingRelation: "anytime",
    preferredDayParts: ["midday", "evening"],
    timeRule: "anytime",
    planCategory: "nutrition",
    nutritionFoods: [
      { key: "redVeggies" },
      { key: "orangeVeggies" },
      { key: "yellowVeggies" },
      { key: "greenVeggies" },
      { key: "bluePurpleVeggies" }
    ],
  },
  {
    id: "intermittent_fasting_12h",
    level: 1,
    xp: 300,
    areas: [
      { id: "energy", descriptionKey: "intermittent_fasting_12h.areas.energy" },
      { id: "digestiveHealth", descriptionKey: "intermittent_fasting_12h.areas.digestiveHealth" }
    ],
    title: "intermittent_fasting_12h.title",
    descriptionKey: "intermittent_fasting_12h.description",
    trainingRelation: "anytime",
    preferredDayParts: ["evening", "night"],
    timeRule: "anytime",
    planCategory: "nutrition",
  },
  {
    id: "intermittent_fasting_16_8",
    level: 2,
    xp: 500,
    areas: [
      { id: "energy", descriptionKey: "intermittent_fasting_16_8.areas.energy" },
      { id: "digestiveHealth", descriptionKey: "intermittent_fasting_16_8.areas.digestiveHealth" }
    ],
    title: "intermittent_fasting_16_8.title",
    descriptionKey: "intermittent_fasting_16_8.description",
    trainingRelation: "anytime",
    preferredDayParts: ["evening", "night"],
    timeRule: "anytime",
    planCategory: "nutrition",
  },
{
    id: "multivitamin_general",
    level: 1,
    xp: 300,
    areas: [
      { id: "energy", descriptionKey: "multivitamin_general.areas.energy" },
      { id: "immuneSupport", descriptionKey: "multivitamin_general.areas.immuneSupport" }
    ],
    title: "multivitamin_general.title",
    descriptionKey: "multivitamin_general.description",
    supplements: [{ id: "multivitamin" }],
    startPrompt: "multivitamin_general.startPrompt",
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
  },
  {
    id: "vitamin_d",
    level: 3,
    xp: 700,
    areas: [
      { id: "energy", descriptionKey: "vitamin_d.areas.energy" },
      { id: "immuneSupport", descriptionKey: "vitamin_d.areas.immuneSupport" },
      { id: "musclePerformance", descriptionKey: "vitamin_d.areas.musclePerformance" },
      { id: "nervousSystem", descriptionKey: "vitamin_d.areas.nervousSystem" }
    ],
    title: "vitamin_d.title",
    descriptionKey: "vitamin_d.description",
    supplements: [
      { id: "vitaminD" },
      { id: "vitaminDWithK2" },
      { id: "codLiverOil" },
      { id: "vitaminK2" },
      { id: "magnesiumGlycinate" }
    ],
    startPrompt: "vitamin_d.startPrompt",
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
    planCategoryOptions: ["nutrition"],
    nutritionFoods: [
      { key: "fattyFish" },
      { key: "eggYolks" },
      { key: "fortifiedDairy" },
      { key: "mushrooms" },
    ],
  },
  {
    id: "vitamin_e_antioxidant_support",
    level: 2,
    xp: 500,
    areas: [
      { id: "immuneSupport", descriptionKey: "vitamin_e_antioxidant_support.areas.immuneSupport" },
      { id: "cardioFitness", descriptionKey: "vitamin_e_antioxidant_support.areas.cardioFitness" },
      { id: "energy", descriptionKey: "vitamin_e_antioxidant_support.areas.energy" }
    ],
    title: "vitamin_e_antioxidant_support.title",
    descriptionKey: "vitamin_e_antioxidant_support.description",
    supplements: [
      { id: "vitaminE" },
      { id: "vitaminEMixedTocopherols" },
      { id: "vitaminETocotrienols" },
      { id: "codLiverOil" },
      { id: "astaxanthin" }
    ],
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "evening"],
    timeRule: "anytime",
  },
  {
    id: "coq10",
    level: 2,
    xp: 500,
    areas: [
      { id: "energy", descriptionKey: "mitochondrial_nutrients_coq10.areas.energy" },
      { id: "immuneSupport", descriptionKey: "mitochondrial_nutrients_coq10.areas.immuneSupport" }
    ],
    title: "mitochondrial_nutrients_coq10.title",
    descriptionKey: "mitochondrial_nutrients_coq10.description",
    supplements: [{ id: "coenzymeQ10" }],
    analyzePrompt: "mitochondrial_nutrients_coq10.analyzePrompt",
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
    planCategoryOptions: ["nutrition"],
    nutritionFoods: [
      { key: "organMeats" },
      { key: "fattyFish" },
      { key: "beef" },
      { key: "spinach" },
      { key: "broccoli" },
    ],
  },
  {
    id: "cellular_energy_nad",
    level: 2,
    xp: 500,
    areas: [
      { id: "energy", descriptionKey: "cellular_energy_nad.areas.energy" },
      { id: "immuneSupport", descriptionKey: "cellular_energy_nad.areas.immuneSupport" },
      { id: "nervousSystem", descriptionKey: "cellular_energy_nad.areas.nervousSystem" }
    ],
    title: "cellular_energy_nad.title",
    descriptionKey: "cellular_energy_nad.description",
    supplements: [
      { id: "nad" },
      { id: "nmn" },
      { id: "nr" },
      { id: "niacin" }
    ],
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
  },
  {
    id: "sleep_timing_circadian",
    level: 2,
    xp: 500,
    areas: [
      { id: "sleepQuality", descriptionKey: "sleep_timing_circadian.areas.sleepQuality" },
      { id: "immuneSupport", descriptionKey: "sleep_timing_circadian.areas.immuneSupport" },
      { id: "energy", descriptionKey: "sleep_timing_circadian.areas.energy" }
    ],
    title: "sleep_timing_circadian.title",
    descriptionKey: "sleep_timing_circadian.description",
    trainingRelation: "anytime",
    preferredDayParts: ["evening"],
    timeRule: "anytime",
  },
  {
    id: "magnesium",
    level: 3,
    xp: 700,
    areas: [
      { id: "sleepQuality", descriptionKey: "magnesium.areas.sleepQuality" },
      { id: "nervousSystem", descriptionKey: "magnesium.areas.nervousSystem" },
      { id: "energy", descriptionKey: "magnesium.areas.energy" }
    ],
    title: "magnesium.title",
    descriptionKey: "magnesium.description",
    supplements: [
      { id: "magnesium" },
      { id: "magnesiumGlycinate" },
      { id: "magnesiumCitrate" },
      { id: "magnesiumMalate" },
      { id: "magnesiumThreonate" }
    ],
    trainingRelation: "anytime",
    preferredDayParts: ["evening", "night"],
    timeRule: "anytime",
    planCategoryOptions: ["nutrition"],
    nutritionFoods: [
      { key: "leafyGreens" },
      { key: "pumpkinSeeds" },
      { key: "almonds" },
      { key: "darkChocolate" },
      { key: "blackBeans" },
      { key: "avocado" },
    ],
  },
  {
    id: "zinc_comprehensive_support",
    level: 3,
    xp: 700,
    areas: [
      { id: "immuneSupport", descriptionKey: "zinc_comprehensive_support.areas.immuneSupport" },
      { id: "nervousSystem", descriptionKey: "zinc_comprehensive_support.areas.nervousSystem" },
      { id: "energy", descriptionKey: "zinc_comprehensive_support.areas.energy" }
    ],
    title: "zinc_comprehensive_support.title",
    descriptionKey: "zinc_comprehensive_support.description",
    supplements: [
      { id: "zinc" },
      { id: "zincPicolinate" },
      { id: "zincBisglycinate" },
      { id: "zincCitrate" }
    ],
    trainingRelation: "anytime",
    preferredDayParts: ["evening"],
    timeRule: "anytime",
    planCategoryOptions: ["nutrition"],
    nutritionFoods: [
      { key: "oysters" },
      { key: "beef" },
      { key: "pumpkinSeeds" },
      { key: "chickpeas" },
      { key: "cashews" },
    ],
  },
  {
    id: "selenium_thyroid_antioxidant",
    level: 2,
    xp: 500,
    areas: [
      { id: "immuneSupport", descriptionKey: "selenium_thyroid_antioxidant.areas.immuneSupport" },
      { id: "energy", descriptionKey: "selenium_thyroid_antioxidant.areas.energy" },
      { id: "nervousSystem", descriptionKey: "selenium_thyroid_antioxidant.areas.nervousSystem" }
    ],
    title: "selenium_thyroid_antioxidant.title",
    descriptionKey: "selenium_thyroid_antioxidant.description",
    supplements: [{ id: "selenium" }],
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
    planCategoryOptions: ["nutrition"],
    nutritionFoods: [
      { key: "brazilNuts" },
      { key: "sardines" },
      { key: "eggs" },
      { key: "shiitakeMushrooms" },
      { key: "sunflowerSeeds" },
    ],
  },
  {
    id: "iodine_thyroid_balance",
    level: 2,
    xp: 500,
    areas: [
      { id: "energy", descriptionKey: "iodine_thyroid_balance.areas.energy" },
      { id: "immuneSupport", descriptionKey: "iodine_thyroid_balance.areas.immuneSupport" },
      { id: "nervousSystem", descriptionKey: "iodine_thyroid_balance.areas.nervousSystem" }
    ],
    title: "iodine_thyroid_balance.title",
    descriptionKey: "iodine_thyroid_balance.description",
    supplements: [{ id: "kelp" }],
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
    planCategoryOptions: ["nutrition"],
    nutritionFoods: [
      { key: "seaweed" },
      { key: "iodizedSalt" },
      { key: "dairy" },
      { key: "eggs" },
      { key: "cod" },
    ],
  },
  {
    id: "calm_alertness_ltheanine",
    level: 2,
    xp: 500,
    areas: [{ id: "focus", descriptionKey: "calm_alertness_ltheanine.areas.focus" }],
    title: "calm_alertness_ltheanine.title",
    descriptionKey: "calm_alertness_ltheanine.description",
    supplements: [{ id: "lTheanine" }],
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
  },
  {
    id: "neurotransmitter_ltyrosine",
    level: 3,
    xp: 700,
    areas: [{ id: "focus", descriptionKey: "neurotransmitter_ltyrosine.areas.focus" }],
    title: "neurotransmitter_ltyrosine.title",
    descriptionKey: "neurotransmitter_ltyrosine.description",
    supplements: [{ id: "lTyrosine" }],
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
  },
  {
    id: "maintain_hydration",
    level: 1,
    xp: 300,
    areas: [
      { id: "immuneSupport", descriptionKey: "maintain_hydration.areas.immuneSupport" },
      { id: "energy", descriptionKey: "maintain_hydration.areas.energy" },
      { id: "cardioFitness", descriptionKey: "maintain_hydration.areas.cardioFitness" }
    ],
    title: "maintain_hydration.title",
    descriptionKey: "maintain_hydration.description",
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday", "afternoon", "evening"],
    timeRule: "anytime",
    planCategory: "nutrition",
  },
  {
    id: "vitamin_c_immunity",
    level: 2,
    xp: 500,
    areas: [{ id: "immuneSupport", descriptionKey: "vitamin_c_immunity.areas.immuneSupport" }],
    title: "vitamin_c_immunity.title",
    descriptionKey: "vitamin_c_immunity.description",
    supplements: [{ id: "vitaminC" }],
    trainingRelation: "anytime",
    preferredDayParts: ["midday", "afternoon"],
    timeRule: "anytime",
    nutritionFoods: [
      { key: "citrusFruits" },
      { key: "berries" },
      { key: "bellPeppers" },
      { key: "kiwi" },
      { key: "fermentedCabbage" },
    ],
  },
  {
    id: "echinacea_herbs",
    level: 3,
    xp: 700,
    areas: [{ id: "immuneSupport", descriptionKey: "echinacea_herbs.areas.immuneSupport" }],
    title: "echinacea_herbs.title",
    descriptionKey: "echinacea_herbs.description",
    supplements: [{ id: "echinacea" }],
    trainingRelation: "anytime",
    preferredDayParts: ["midday", "afternoon"],
    timeRule: "anytime",
  },
  {
    id: "calming_glycine",
    level: 2,
    xp: 500,
    areas: [
      { id: "nervousSystem", descriptionKey: "calming_glycine.areas.nervousSystem" },
      { id: "sleepQuality", descriptionKey: "calming_glycine.areas.sleepQuality" },
      { id: "immuneSupport", descriptionKey: "calming_glycine.areas.immuneSupport" }
    ],
    title: "calming_glycine.title",
    descriptionKey: "calming_glycine.description",
    supplements: [{ id: "glycin" }],
    trainingRelation: "anytime",
    preferredDayParts: ["evening", "night"],
    timeRule: "anytime",
    planCategoryOptions: ["nutrition"],
    nutritionFoods: [
      { key: "boneBroth" },
      { key: "collagenCuts" },
      { key: "skinOnPoultry" },
      { key: "porkRinds" },
      { key: "legumes" },
    ],
  },
  {
    id: "breathwork_parasympathetic",
    level: 1,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "breathwork_parasympathetic.areas.nervousSystem" },
      { id: "immuneSupport", descriptionKey: "breathwork_parasympathetic.areas.immuneSupport" },
      { id: "energy", descriptionKey: "breathwork_parasympathetic.areas.energy" }
    ],
    title: "breathwork_parasympathetic.title",
    descriptionKey: "breathwork_parasympathetic.description",
    isParent: true,
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday", "afternoon", "evening"],
    timeRule: "anytime",
  },
  {
    id: "box_breathing",
    level: 1,
    xp: 0,
    parentId: "breathwork_parasympathetic",
    areas: [
      { id: "nervousSystem", descriptionKey: "box_breathing.areas.nervousSystem" },
      { id: "immuneSupport", descriptionKey: "box_breathing.areas.immuneSupport" }
    ],
    title: "box_breathing.title",
    descriptionKey: "box_breathing.description",
    supplements: [],
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday", "afternoon"],
    timeRule: "anytime",
  },
  {
    id: "4_7_8_breathing",
    level: 1,
    xp: 0,
    parentId: "breathwork_parasympathetic",
    areas: [
      { id: "nervousSystem", descriptionKey: "4_7_8_breathing.areas.nervousSystem" },
      { id: "sleepQuality", descriptionKey: "4_7_8_breathing.areas.sleepQuality" }
    ],
    title: "4_7_8_breathing.title",
    descriptionKey: "4_7_8_breathing.description",
    supplements: [],
    trainingRelation: "anytime",
    preferredDayParts: ["evening", "night"],
    timeRule: "anytime",
  },
  {
    id: "alternate_nostril_breathing",
    level: 2,
    xp: 0,
    parentId: "breathwork_parasympathetic",
    areas: [
      { id: "nervousSystem", descriptionKey: "alternate_nostril_breathing.areas.nervousSystem" },
      { id: "focus", descriptionKey: "alternate_nostril_breathing.areas.focus" }
    ],
    title: "alternate_nostril_breathing.title",
    descriptionKey: "alternate_nostril_breathing.description",
    supplements: [],
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
  },
  {
    id: "diaphragmatic_breathing",
    level: 1,
    xp: 0,
    parentId: "breathwork_parasympathetic",
    areas: [
      { id: "nervousSystem", descriptionKey: "diaphragmatic_breathing.areas.nervousSystem" },
      { id: "energy", descriptionKey: "diaphragmatic_breathing.areas.energy" }
    ],
    title: "diaphragmatic_breathing.title",
    descriptionKey: "diaphragmatic_breathing.description",
    supplements: [],
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday", "afternoon"],
    timeRule: "anytime",
  },
  {
    id: "sleep_optimization_recovery",
    level: 1,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "sleep_optimization_recovery.areas.nervousSystem" },
      { id: "immuneSupport", descriptionKey: "sleep_optimization_recovery.areas.immuneSupport" },
      { id: "energy", descriptionKey: "sleep_optimization_recovery.areas.energy" },
      { id: "cardioFitness", descriptionKey: "sleep_optimization_recovery.areas.cardioFitness" },
      { id: "sleepQuality", descriptionKey: "sleep_optimization_recovery.areas.sleepQuality" }
    ],
    title: "sleep_optimization_recovery.title",
    descriptionKey: "sleep_optimization_recovery.description",
    isParent: true,
    trainingRelation: "anytime",
    preferredDayParts: ["evening"],
    timeRule: "anytime",
  },
  {
    id: "sleep_duration_consistency",
    level: 1,
    xp: 0,
    parentId: "sleep_optimization_recovery",
    areas: [
      { id: "sleepQuality", descriptionKey: "sleep_duration_consistency.areas.sleepQuality" },
      { id: "energy", descriptionKey: "sleep_duration_consistency.areas.energy" }
    ],
    title: "sleep_duration_consistency.title",
    descriptionKey: "sleep_duration_consistency.description",
    supplements: [],
    trainingRelation: "anytime",
    preferredDayParts: ["evening", "night"],
    timeRule: "anytime",
  },
  {
    id: "sleep_environment_optimization",
    level: 1,
    xp: 0,
    parentId: "sleep_optimization_recovery",
    areas: [
      { id: "sleepQuality", descriptionKey: "sleep_environment_optimization.areas.sleepQuality" },
      { id: "nervousSystem", descriptionKey: "sleep_environment_optimization.areas.nervousSystem" }
    ],
    title: "sleep_environment_optimization.title",
    descriptionKey: "sleep_environment_optimization.description",
    supplements: [],
    trainingRelation: "anytime",
    preferredDayParts: ["evening", "night"],
    timeRule: "anytime",
  },
  {
    id: "sleep_hygiene_practices",
    level: 1,
    xp: 0,
    parentId: "sleep_optimization_recovery",
    areas: [
      { id: "sleepQuality", descriptionKey: "sleep_hygiene_practices.areas.sleepQuality" },
      { id: "immuneSupport", descriptionKey: "sleep_hygiene_practices.areas.immuneSupport" }
    ],
    title: "sleep_hygiene_practices.title",
    descriptionKey: "sleep_hygiene_practices.description",
    supplements: [],
    trainingRelation: "anytime",
    preferredDayParts: ["evening"],
    timeRule: "anytime",
  },
  {
    id: "pre_sleep_wind_down",
    level: 1,
    xp: 0,
    parentId: "sleep_optimization_recovery",
    areas: [
      { id: "sleepQuality", descriptionKey: "pre_sleep_wind_down.areas.sleepQuality" },
      { id: "nervousSystem", descriptionKey: "pre_sleep_wind_down.areas.nervousSystem" }
    ],
    title: "pre_sleep_wind_down.title",
    descriptionKey: "pre_sleep_wind_down.description",
    supplements: [],
    trainingRelation: "anytime",
    preferredDayParts: ["evening", "night"],
    timeRule: "anytime",
  },
  {
    id: "sunlight_circadian",
    level: 1,
    xp: 0,
    areas: [
      { id: "sleepQuality", descriptionKey: "sunlight_circadian.areas.sleepQuality" },
      { id: "nervousSystem", descriptionKey: "sunlight_circadian.areas.nervousSystem" },
      { id: "energy", descriptionKey: "sunlight_circadian.areas.energy" },
      { id: "immuneSupport", descriptionKey: "sunlight_circadian.areas.immuneSupport" }
    ],
    title: "sunlight_circadian.title",
    descriptionKey: "sunlight_circadian.description",
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
  },
  {
    id: "cold_exposure_ans",
    level: 2,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "cold_exposure_ans.areas.nervousSystem" },
      { id: "immuneSupport", descriptionKey: "cold_exposure_ans.areas.immuneSupport" },
      { id: "energy", descriptionKey: "cold_exposure_ans.areas.energy" }
    ],
    title: "cold_exposure_ans.title",
    descriptionKey: "cold_exposure_ans.description",
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
  },
  {
    id: "meditation_mindfulness",
    level: 2,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "meditation_mindfulness.areas.nervousSystem" },
      { id: "immuneSupport", descriptionKey: "meditation_mindfulness.areas.immuneSupport" },
      { id: "focus", descriptionKey: "meditation_mindfulness.areas.focus" }
    ],
    title: "meditation_mindfulness.title",
    descriptionKey: "meditation_mindfulness.description",
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday", "evening"],
    timeRule: "anytime",
  },
  {
    id: "nature_parasympathetic",
    level: 2,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "nature_parasympathetic.areas.nervousSystem" },
      { id: "immuneSupport", descriptionKey: "nature_parasympathetic.areas.immuneSupport" },
      { id: "energy", descriptionKey: "nature_parasympathetic.areas.energy" }
    ],
    title: "nature_parasympathetic.title",
    descriptionKey: "nature_parasympathetic.description",
    trainingRelation: "anytime",
    preferredDayParts: ["midday", "afternoon"],
    timeRule: "anytime",
  },
  {
    id: "hrv_recovery_monitoring",
    level: 3,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "hrv_recovery_monitoring.areas.nervousSystem" },
      { id: "immuneSupport", descriptionKey: "hrv_recovery_monitoring.areas.immuneSupport" },
      { id: "energy", descriptionKey: "hrv_recovery_monitoring.areas.energy" },
      { id: "cardioFitness", descriptionKey: "hrv_recovery_monitoring.areas.cardioFitness" },
      { id: "musclePerformance", descriptionKey: "hrv_recovery_monitoring.areas.musclePerformance" }
    ],
    title: "hrv_recovery_monitoring.title",
    descriptionKey: "hrv_recovery_monitoring.description",
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
  },
  {
    id: "social_connection_vagal",
    level: 2,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "social_connection_vagal.areas.nervousSystem" },
      { id: "immuneSupport", descriptionKey: "social_connection_vagal.areas.immuneSupport" },
      { id: "energy", descriptionKey: "social_connection_vagal.areas.energy" }
    ],
    title: "social_connection_vagal.title",
    descriptionKey: "social_connection_vagal.description",
    trainingRelation: "anytime",
    preferredDayParts: ["afternoon", "evening"],
    timeRule: "anytime",
    planCategory: "nutrition",
  },
  {
    id: "calming_music_waves",
    level: 1,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "calming_music_waves.areas.nervousSystem" },
      { id: "sleepQuality", descriptionKey: "calming_music_waves.areas.sleepQuality" },
      { id: "focus", descriptionKey: "calming_music_waves.areas.focus" }
    ],
    title: "calming_music_waves.title",
    descriptionKey: "calming_music_waves.description",
    trainingRelation: "anytime",
    preferredDayParts: ["evening", "night"],
    timeRule: "anytime",
  },
  {
    id: "adaptogenic_herbs",
    level: 3,
    xp: 0,
    areas: [{ id: "nervousSystem", descriptionKey: "adaptogenic_herbs.areas.nervousSystem" }],
    title: "adaptogenic_herbs.title",
    descriptionKey: "adaptogenic_herbs.description",
    isParent: true,
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
  },
  {
    id: "neuromuscular_training",
    level: 1,
    xp: 0,
    areas: [
      { id: "musclePerformance", descriptionKey: "neuromuscular_training.areas.musclePerformance" },
      { id: "cardioFitness", descriptionKey: "neuromuscular_training.areas.cardioFitness" },
      { id: "nervousSystem", descriptionKey: "neuromuscular_training.areas.nervousSystem" }
    ],
    title: "neuromuscular_training.title",
    descriptionKey: "neuromuscular_training.description",
    supplements: [],
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
    planCategory: "training",
  },
  {
    id: "creatine_atp_strength",
    level: 2,
    xp: 500,
    areas: [
      { id: "musclePerformance", descriptionKey: "creatine_atp_strength.areas.musclePerformance" },
      { id: "energy", descriptionKey: "creatine_atp_strength.areas.energy" },
      { id: "cardioFitness", descriptionKey: "creatine_atp_strength.areas.cardioFitness" },
      { id: "focus", descriptionKey: "creatine_atp_strength.areas.focus" }
    ],
    title: "creatine_atp_strength.title",
    descriptionKey: "creatine_atp_strength.description",
    supplements: [{ id: "creatine" }],
    trainingRelation: "anytime",
    preferredDayParts: ["midday", "afternoon"],
    timeRule: "anytime",
  },
  {
    id: "betaalanine_endurance",
    level: 3,
    xp: 700,
    areas: [
      { id: "musclePerformance", descriptionKey: "betaalanine_endurance.areas.musclePerformance" },
      { id: "cardioFitness", descriptionKey: "betaalanine_endurance.areas.cardioFitness" }
    ],
    title: "betaalanine_endurance.title",
    descriptionKey: "betaalanine_endurance.description",
    supplements: [{ id: "betaAlanine" }],
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
  },
  {
    id: "shilajit_performance",
    level: 4,
    xp: 900,
    areas: [
      { id: "musclePerformance", descriptionKey: "shilajit_performance.areas.musclePerformance" },
      { id: "energy", descriptionKey: "shilajit_performance.areas.energy" },
      { id: "cardioFitness", descriptionKey: "shilajit_performance.areas.cardioFitness" }
    ],
    title: "shilajit_performance.title",
    descriptionKey: "shilajit_performance.description",
    supplements: [{ id: "shilajit" }],
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
  },
  {
    id: "probiotics_microbiota",
    level: 1,
    xp: 300,
    areas: [
      { id: "digestiveHealth", descriptionKey: "probiotics_microbiota.areas.digestiveHealth" },
      { id: "immuneSupport", descriptionKey: "probiotics_microbiota.areas.immuneSupport" }
    ],
    title: "probiotics_microbiota.title",
    descriptionKey: "probiotics_microbiota.description",
    supplements: [{ id: "probiotics" }],
    trainingRelation: "anytime",
    preferredDayParts: ["afternoon"],
    timeRule: "anytime",
    planCategory: "nutrition",
    nutritionFoods: [
      { key: "yogurt" },
      { key: "kefir" },
      { key: "sauerkraut" },
      { key: "kimchi" },
      { key: "miso" },
    ],
  },
  {
    id: "fiber_microbiome",
    level: 2,
    xp: 500,
    areas: [
      { id: "digestiveHealth", descriptionKey: "fiber_microbiome.areas.digestiveHealth" },
      { id: "immuneSupport", descriptionKey: "fiber_microbiome.areas.immuneSupport" }
    ],
    title: "fiber_microbiome.title",
    descriptionKey: "fiber_microbiome.description",
    trainingRelation: "anytime",
    preferredDayParts: ["afternoon", "evening"],
    timeRule: "anytime",
    planCategory: "nutrition",
    nutritionFoods: [
      { key: "oats" },
      { key: "legumes" },
      { key: "chiaSeeds" },
      { key: "berries" },
      { key: "cruciferousVeg" },
    ],
  },
  {
    id: "milk_thistle_liver",
    level: 3,
    xp: 700,
    areas: [
      { id: "digestiveHealth", descriptionKey: "milk_thistle_liver.areas.digestiveHealth" },
      { id: "immuneSupport", descriptionKey: "milk_thistle_liver.areas.immuneSupport" }
    ],
    title: "milk_thistle_liver.title",
    descriptionKey: "milk_thistle_liver.description",
    supplements: [{ id: "milkThistle" }],
    trainingRelation: "anytime",
    preferredDayParts: ["afternoon"],
    timeRule: "anytime",
  },
  {
    id: "hiit_vo2max",
    level: 2,
    xp: 500,
    areas: [
      { id: "cardioFitness", descriptionKey: "hiit_vo2max.areas.cardioFitness" },
      { id: "energy", descriptionKey: "hiit_vo2max.areas.energy" }
    ],
    title: "hiit_vo2max.title",
    descriptionKey: "hiit_vo2max.description",
    analyzePrompt: "hiit_vo2max.analyzePrompt",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
    planCategory: "training",
  },
  {
    id: "running_volume_aerobic",
    level: 3,
    xp: 700,
    areas: [
      { id: "cardioFitness", descriptionKey: "running_volume_aerobic.areas.cardioFitness" },
      { id: "energy", descriptionKey: "running_volume_aerobic.areas.energy" }
    ],
    title: "running_volume_aerobic.title",
    descriptionKey: "running_volume_aerobic.description",
    analyzePrompt: "running_volume_aerobic.analyzePrompt",
    preferredDayParts: ["morning", "midday", "afternoon"],
    timeRule: "anytime",
    planCategory: "training",
  },
  {
    id: "ashwagandha_adaptogen",
    level: 3,
    xp: 0,
    parentId: "adaptogenic_herbs",
    areas: [
      { id: "nervousSystem", descriptionKey: "ashwagandha_adaptogen.areas.nervousSystem" },
      { id: "energy", descriptionKey: "ashwagandha_adaptogen.areas.energy" },
      { id: "immuneSupport", descriptionKey: "ashwagandha_adaptogen.areas.immuneSupport" }
    ],
    title: "ashwagandha_adaptogen.title",
    descriptionKey: "ashwagandha_adaptogen.description",
    supplements: [{ id: "ashwagandha" }],
    trainingRelation: "anytime",
    preferredDayParts: ["evening"],
    timeRule: "anytime",
  },
  {
    id: "rhodiola_adaptogen",
    level: 3,
    xp: 0,
    parentId: "adaptogenic_herbs",
    areas: [
      { id: "nervousSystem", descriptionKey: "rhodiola_adaptogen.areas.nervousSystem" },
      { id: "energy", descriptionKey: "rhodiola_adaptogen.areas.energy" },
      { id: "focus", descriptionKey: "rhodiola_adaptogen.areas.focus" }
    ],
    title: "rhodiola_adaptogen.title",
    descriptionKey: "rhodiola_adaptogen.description",
    supplements: [{ id: "rhodiolaRosea" }],
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
  },
  {
    id: "holy_basil_adaptogen",
    level: 3,
    xp: 0,
    parentId: "adaptogenic_herbs",
    areas: [
      { id: "nervousSystem", descriptionKey: "holy_basil_adaptogen.areas.nervousSystem" },
      { id: "immuneSupport", descriptionKey: "holy_basil_adaptogen.areas.immuneSupport" }
    ],
    title: "holy_basil_adaptogen.title",
    descriptionKey: "holy_basil_adaptogen.description",
    supplements: [{ id: "holyBasil" }],
    trainingRelation: "anytime",
    preferredDayParts: ["evening"],
    timeRule: "anytime",
  },
  {
    id: "cordyceps_adaptogen",
    level: 3,
    xp: 0,
    parentId: "adaptogenic_herbs",
    areas: [
      { id: "energy", descriptionKey: "cordyceps_adaptogen.areas.energy" },
      { id: "cardioFitness", descriptionKey: "cordyceps_adaptogen.areas.cardioFitness" },
      { id: "immuneSupport", descriptionKey: "cordyceps_adaptogen.areas.immuneSupport" }
    ],
    title: "cordyceps_adaptogen.title",
    descriptionKey: "cordyceps_adaptogen.description",
    supplements: [{ id: "cordyceps" }],
    trainingRelation: "anytime",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
  },

  // --- Running / performance tips (added) ---
  {
    id: "zone2_mitochondrial_base",
    level: 2,
    xp: 500,
    areas: [
      { id: "cardioFitness", descriptionKey: "zone2_mitochondrial_base.areas.cardioFitness" },
      { id: "energy", descriptionKey: "zone2_mitochondrial_base.areas.energy" }
    ],
    title: "zone2_mitochondrial_base.title",
    descriptionKey: "zone2_mitochondrial_base.description",
    analyzePrompt: "zone2_mitochondrial_base.analyzePrompt",
    preferredDayParts: ["morning", "midday", "afternoon"],
    timeRule: "anytime",
    planCategory: "training",
  },
  {
    id: "fasted_aerobic_training",
    level: 3,
    xp: 700,
    areas: [
      { id: "energy", descriptionKey: "fasted_aerobic_training.areas.energy" },
      { id: "cardioFitness", descriptionKey: "fasted_aerobic_training.areas.cardioFitness" }
    ],
    title: "fasted_aerobic_training.title",
    descriptionKey: "fasted_aerobic_training.description",
    preferredDayParts: ["morning"],
    timeRule: "anytime",
    planCategory: "training",
  },
  {
    id: "lactate_threshold_training",
    level: 3,
    xp: 700,
    areas: [
      { id: "cardioFitness", descriptionKey: "lactate_threshold_training.areas.cardioFitness" },
      { id: "energy", descriptionKey: "lactate_threshold_training.areas.energy" }
    ],
    title: "lactate_threshold_training.title",
    descriptionKey: "lactate_threshold_training.description",
    analyzePrompt: "lactate_threshold_training.analyzePrompt",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
    planCategory: "training",
  },
  {
    id: "running_economy_drills",
    level: 2,
    xp: 500,
    areas: [
      { id: "musclePerformance", descriptionKey: "running_economy_drills.areas.musclePerformance" },
      { id: "nervousSystem", descriptionKey: "running_economy_drills.areas.nervousSystem" },
      { id: "cardioFitness", descriptionKey: "running_economy_drills.areas.cardioFitness" }
    ],
    title: "running_economy_drills.title",
    descriptionKey: "running_economy_drills.description",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
    planCategory: "training",
  },
  {
    id: "stride_frequency_optimization",
    level: 3,
    xp: 700,
    areas: [
      { id: "musclePerformance", descriptionKey: "stride_frequency_optimization.areas.musclePerformance" },
      { id: "nervousSystem", descriptionKey: "stride_frequency_optimization.areas.nervousSystem" },
      { id: "energy", descriptionKey: "stride_frequency_optimization.areas.energy" }
    ],
    title: "stride_frequency_optimization.title",
    descriptionKey: "stride_frequency_optimization.description",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
    planCategory: "training",
  },
  {
    id: "caffeine_endurance_performance",
    level: 2,
    xp: 500,
    areas: [
      { id: "energy", descriptionKey: "caffeine_endurance_performance.areas.energy" },
      { id: "focus", descriptionKey: "caffeine_endurance_performance.areas.focus" },
      { id: "cardioFitness", descriptionKey: "caffeine_endurance_performance.areas.cardioFitness" }
    ],
    title: "caffeine_endurance_performance.title",
    descriptionKey: "caffeine_endurance_performance.description",
    supplements: [{ id: "caffeine" }],
    trainingRelation: "preWorkout",
    preferredDayParts: ["morning", "midday"],
    timeRule: "avoidLateEvening",
  },
  {
    id: "nitrate_no_efficiency",
    level: 3,
    xp: 700,
    areas: [
      { id: "cardioFitness", descriptionKey: "nitrate_no_efficiency.areas.cardioFitness" },
      { id: "energy", descriptionKey: "nitrate_no_efficiency.areas.energy" }
    ],
    title: "nitrate_no_efficiency.title",
    descriptionKey: "nitrate_no_efficiency.description",
    supplements: [{ id: "beetrootExtract" }],
    trainingRelation: "preWorkout",
    preferredDayParts: ["morning", "midday"],
    timeRule: "anytime",
  },
  {
    id: "l_carnitine_fat_transport",
    level: 3,
    xp: 700,
    areas: [
      { id: "energy", descriptionKey: "l_carnitine_fat_transport.areas.energy" },
      { id: "cardioFitness", descriptionKey: "l_carnitine_fat_transport.areas.cardioFitness" }
    ],
    title: "l_carnitine_fat_transport.title",
    descriptionKey: "l_carnitine_fat_transport.description",
    supplements: [{ id: "lCarnitine" }],
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "midday", "afternoon"],
    timeRule: "anytime",
  },
  {
    id: "astaxanthin_recovery_antioxidant",
    level: 3,
    xp: 700,
    areas: [
      { id: "musclePerformance", descriptionKey: "astaxanthin_recovery_antioxidant.areas.musclePerformance" },
      { id: "energy", descriptionKey: "astaxanthin_recovery_antioxidant.areas.energy" },
      { id: "cardioFitness", descriptionKey: "astaxanthin_recovery_antioxidant.areas.cardioFitness" }
    ],
    title: "astaxanthin_recovery_antioxidant.title",
    descriptionKey: "astaxanthin_recovery_antioxidant.description",
    supplements: [
      { id: "astaxanthin" },
      { id: "vitaminETocotrienols" },
      { id: "vitaminEMixedTocopherols" },
      { id: "vitaminE" }
    ],
    trainingRelation: "avoidNearWorkout",
    preferredDayParts: ["evening"],
    timeRule: "anytime",
    analyzePrompt: "astaxanthin_recovery_antioxidant.analyzePrompt",
  },
  {
    id: "brown_fat_cool_home",
    level: 1,
    xp: 300,
    areas: [
      { id: "energy", descriptionKey: "brown_fat_cool_home.areas.energy" }
    ],
    title: "brown_fat_cool_home.title",
    descriptionKey: "brown_fat_cool_home.description",
    trainingRelation: "anytime",
    preferredDayParts: ["morning", "evening"],
    timeRule: "anytime",
    planCategory: "nutrition"
  }
];
