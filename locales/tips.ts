import { supplementIds } from "./supplementIds";

type SupplementReference = {
  id: string;
};

export type TipArea = {
  id: string;
  descriptionKey: string;
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
};

export const tips: Tip[] = [
  {
    id: "nutritional_support_vitality",
    level: 1,
    xp: 300,
    areas: [
      { id: "energy", descriptionKey: "nutritional_support_vitality.areas.energy" }
    ],
    title: "nutritional_support_vitality.title",
    descriptionKey: "nutritional_support_vitality.description",
    supplements: [{ id: "multivitamin_general" }],
    startPrompt: "nutritional_support_vitality.startPrompt",
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
    supplements: [{ id: "vitamin_d" }],
    startPrompt: "vitamin_d.startPrompt",
  },
  {
    id: "vitamin_mineral_balance",
    level: 6,
    xp: 1300,
    areas: [{ id: "energy", descriptionKey: "vitamin_mineral_balance.description" }],
    title: "vitamin_mineral_balance.title",
    descriptionKey: "vitamin_mineral_balance.description",
    supplements: [{ id: "vitamin_d" }],
    startPrompt: "vitamin_mineral_balance.startPrompt",
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
    analyzePrompt: "mitochondrial_nutrients_coq10.analyzePrompt",
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
  },
  {
    id: "sleep_timing_circadian",
    level: 2,
    xp: 500,
    areas: [
      { id: "sleepQuality", descriptionKey: "sleep_timing_circadian.description" },
      { id: "immuneSupport", descriptionKey: "sleep_timing_circadian.description" },
      { id: "energy", descriptionKey: "sleep_timing_circadian.description" }
    ],
    title: "sleep_timing_circadian.title",
    descriptionKey: "sleep_timing_circadian.description",
  },
  {
    id: "sleep_magnesium_hormonal",
    level: 3,
    xp: 700,
    areas: [
      { id: "sleepQuality", descriptionKey: "sleep_magnesium_hormonal.description" },
      { id: "immuneSupport", descriptionKey: "sleep_magnesium_hormonal.description" },
      { id: "energy", descriptionKey: "sleep_magnesium_hormonal.description" }
    ],
    title: "sleep_magnesium_hormonal.title",
    descriptionKey: "sleep_magnesium_hormonal.description",
    supplements: [{ id: "magnesium" }],
  },
  {
    id: "calm_alertness_ltheanine",
    level: 2,
    xp: 500,
    areas: [{ id: "focus", descriptionKey: "calm_alertness_ltheanine.description" }],
    title: "calm_alertness_ltheanine.title",
    descriptionKey: "calm_alertness_ltheanine.description",
  },
  {
    id: "neurotransmitter_ltyrosine",
    level: 3,
    xp: 700,
    areas: [{ id: "focus", descriptionKey: "neurotransmitter_ltyrosine.description" }],
    title: "neurotransmitter_ltyrosine.title",
    descriptionKey: "neurotransmitter_ltyrosine.description",
  },
  {
    id: "maintain_hydration",
    level: 1,
    xp: 300,
    areas: [
      { id: "immuneSupport", descriptionKey: "maintain_hydration.description" },
      { id: "energy", descriptionKey: "maintain_hydration.description" },
      { id: "cardioFitness", descriptionKey: "maintain_hydration.description" }
    ],
    title: "maintain_hydration.title",
    descriptionKey: "maintain_hydration.description",
  },
  {
    id: "vitamin_c_immunity",
    level: 2,
    xp: 500,
    areas: [{ id: "immuneSupport", descriptionKey: "vitamin_c_immunity.description" }],
    title: "vitamin_c_immunity.title",
    descriptionKey: "vitamin_c_immunity.description",
  },
  {
    id: "echinacea_herbs",
    level: 3,
    xp: 700,
    areas: [{ id: "immuneSupport", descriptionKey: "echinacea_herbs.description" }],
    title: "echinacea_herbs.title",
    descriptionKey: "echinacea_herbs.description",
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
    supplements: [{ id: "glycine" }],
  },
  {
    id: "neuropeptide_semax",
    level: 3,
    xp: 700,
    areas: [{ id: "nervousSystem", descriptionKey: "neuropeptide_semax.description" }],
    title: "neuropeptide_semax.title",
  },
  {
    id: "breathwork_parasympathetic",
    level: 1,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "breathwork_parasympathetic.description" },
      { id: "immuneSupport", descriptionKey: "breathwork_parasympathetic.description" },
      { id: "energy", descriptionKey: "breathwork_parasympathetic.description" }
    ],
    title: "breathwork_parasympathetic.title",
  },
  {
    id: "sleep_optimization_recovery",
    level: 1,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "sleep_optimization_recovery.description" },
      { id: "immuneSupport", descriptionKey: "sleep_optimization_recovery.description" },
      { id: "energy", descriptionKey: "sleep_optimization_recovery.description" },
      { id: "cardioFitness", descriptionKey: "sleep_optimization_recovery.description" },
      { id: "sleepQuality", descriptionKey: "sleep_optimization_recovery.description" }
    ],
    title: "sleep_optimization_recovery.title",
  },
  {
    id: "sunlight_circadian",
    level: 1,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "sunlight_circadian.description" },
      { id: "immuneSupport", descriptionKey: "sunlight_circadian.description" }
    ],
    title: "sunlight_circadian.title",
  },
  {
    id: "cold_exposure_ans",
    level: 2,
    xp: 0,
    areas: [{ id: "nervousSystem", descriptionKey: "cold_exposure_ans.description" }],
    title: "cold_exposure_ans.title",
  },
  {
    id: "meditation_mindfulness",
    level: 2,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "meditation_mindfulness.description" },
      { id: "immuneSupport", descriptionKey: "meditation_mindfulness.description" },
      { id: "energy", descriptionKey: "meditation_mindfulness.description" }
    ],
    title: "meditation_mindfulness.title",
  },
  {
    id: "nature_parasympathetic",
    level: 2,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "nature_parasympathetic.description" },
      { id: "immuneSupport", descriptionKey: "nature_parasympathetic.description" },
      { id: "energy", descriptionKey: "nature_parasympathetic.description" }
    ],
    title: "nature_parasympathetic.title",
  },
  {
    id: "hrv_recovery_monitoring",
    level: 3,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "hrv_recovery_monitoring.description" },
      { id: "immuneSupport", descriptionKey: "hrv_recovery_monitoring.description" },
      { id: "energy", descriptionKey: "hrv_recovery_monitoring.description" },
      { id: "cardioFitness", descriptionKey: "hrv_recovery_monitoring.description" },
      { id: "musclePerformance", descriptionKey: "hrv_recovery_monitoring.description" }
    ],
    title: "hrv_recovery_monitoring.title",
  },
  {
    id: "social_connection_vagal",
    level: 2,
    xp: 0,
    areas: [{ id: "nervousSystem", descriptionKey: "social_connection_vagal.description" }],
    title: "social_connection_vagal.title",
  },
  {
    id: "calming_music_waves",
    level: 1,
    xp: 0,
    areas: [{ id: "nervousSystem", descriptionKey: "calming_music_waves.description" }],
    title: "calming_music_waves.title",
  },
  {
    id: "adaptogenic_herbs",
    level: 3,
    xp: 0,
    areas: [{ id: "nervousSystem", descriptionKey: "adaptogenic_herbs.description" }],
    title: "adaptogenic_herbs.title",
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
  },
  {
    id: "creatine_atp_strength",
    level: 2,
    xp: 500,
    areas: [{ id: "musclePerformance", descriptionKey: "creatine_atp_strength.description" }],
    title: "creatine_atp_strength.title",
    supplements: [{ id: "creatine_atp_strength" }],
  },
  {
    id: "betaalanine_endurance",
    level: 3,
    xp: 700,
    areas: [{ id: "musclePerformance", descriptionKey: "betaalanine_endurance.description" }],
    title: "betaalanine_endurance.title",
    supplements: [],
  },
  {
    id: "shilajit_performance",
    level: 4,
    xp: 900,
    areas: [{ id: "musclePerformance", descriptionKey: "shilajit_performance.description" }],
    title: "shilajit_performance.title",
    supplements: [],
  },
  {
    id: "probiotics_microbiota",
    level: 1,
    xp: 300,
    areas: [
      { id: "digestiveHealth", descriptionKey: "probiotics_microbiota.description" },
      { id: "immuneSupport", descriptionKey: "probiotics_microbiota.description" }
    ],
    title: "probiotics_microbiota.title",
    supplements: [],
  },
  {
    id: "fiber_microbiome",
    level: 2,
    xp: 500,
    areas: [
      { id: "digestiveHealth", descriptionKey: "fiber_microbiome.description" },
      { id: "immuneSupport", descriptionKey: "fiber_microbiome.description" }
    ],
    title: "fiber_microbiome.title",
    supplements: [],
  },
  {
    id: "milk_thistle_liver",
    level: 3,
    xp: 700,
    areas: [
      { id: "digestiveHealth", descriptionKey: "milk_thistle_liver.description" },
      { id: "immuneSupport", descriptionKey: "milk_thistle_liver.description" }
    ],
    title: "milk_thistle_liver.title",
    supplements: [],
  },
  {
    id: "hiit_vo2max",
    level: 2,
    xp: 500,
    areas: [{ id: "cardioFitness", descriptionKey: "hiit_vo2max.description" }],
    title: "hiit_vo2max.title",
    supplements: [],
    analyzePrompt: "hiit_vo2max.analyzePrompt",
  },
  {
    id: "running_volume_aerobic",
    level: 3,
    xp: 700,
    areas: [{ id: "cardioFitness", descriptionKey: "running_volume_aerobic.description" }],
    title: "running_volume_aerobic.title",
    supplements: [],
    analyzePrompt: "running_volume_aerobic.analyzePrompt",
  },
  {
    id: "ashwagandha_adaptogen",
    level: 3,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "ashwagandha_adaptogen.areas.nervousSystem" },
      { id: "energy", descriptionKey: "ashwagandha_adaptogen.areas.energy" },
      { id: "immuneSupport", descriptionKey: "ashwagandha_adaptogen.areas.immuneSupport" }
    ],
    title: "ashwagandha_adaptogen.title",
    descriptionKey: "ashwagandha_adaptogen.description",
    supplements: [],
  },
  {
    id: "rhodiola_adaptogen",
    level: 3,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "rhodiola_adaptogen.areas.nervousSystem" },
      { id: "energy", descriptionKey: "rhodiola_adaptogen.areas.energy" },
      { id: "focus", descriptionKey: "rhodiola_adaptogen.areas.focus" }
    ],
    title: "rhodiola_adaptogen.title",
    descriptionKey: "rhodiola_adaptogen.description",
    supplements: [],
  },
  {
    id: "holy_basil_adaptogen",
    level: 3,
    xp: 0,
    areas: [
      { id: "nervousSystem", descriptionKey: "holy_basil_adaptogen.areas.nervousSystem" },
      { id: "immuneSupport", descriptionKey: "holy_basil_adaptogen.areas.immuneSupport" }
    ],
    title: "holy_basil_adaptogen.title",
    descriptionKey: "holy_basil_adaptogen.description",
    supplements: [],
  },
  {
    id: "cordyceps_adaptogen",
    level: 3,
    xp: 0,
    areas: [
      { id: "energy", descriptionKey: "cordyceps_adaptogen.areas.energy" },
      { id: "cardioFitness", descriptionKey: "cordyceps_adaptogen.areas.cardioFitness" },
      { id: "immuneSupport", descriptionKey: "cordyceps_adaptogen.areas.immuneSupport" }
    ],
    title: "cordyceps_adaptogen.title",
    descriptionKey: "cordyceps_adaptogen.description",
    supplements: [],
  },
];
