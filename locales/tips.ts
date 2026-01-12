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
      { id: "sleepQuality", descriptionKey: "sleep_timing_circadian.areas.sleepQuality" },
      { id: "immuneSupport", descriptionKey: "sleep_timing_circadian.areas.immuneSupport" },
      { id: "energy", descriptionKey: "sleep_timing_circadian.areas.energy" }
    ],
    title: "sleep_timing_circadian.title",
    descriptionKey: "sleep_timing_circadian.description",
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
    supplements: [{ id: "magnesium" }],
  },
  {
    id: "calm_alertness_ltheanine",
    level: 2,
    xp: 500,
    areas: [{ id: "focus", descriptionKey: "calm_alertness_ltheanine.areas.focus" }],
    title: "calm_alertness_ltheanine.title",
    descriptionKey: "calm_alertness_ltheanine.description",
    supplements: [{ id: "ltheanine" }],
  },
  {
    id: "neurotransmitter_ltyrosine",
    level: 3,
    xp: 700,
    areas: [{ id: "focus", descriptionKey: "neurotransmitter_ltyrosine.areas.focus" }],
    title: "neurotransmitter_ltyrosine.title",
    descriptionKey: "neurotransmitter_ltyrosine.description",
    supplements: [{ id: "ltyrosine" }],
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
  },
  {
    id: "vitamin_c_immunity",
    level: 2,
    xp: 500,
    areas: [{ id: "immuneSupport", descriptionKey: "vitamin_c_immunity.areas.immuneSupport" }],
    title: "vitamin_c_immunity.title",
    descriptionKey: "vitamin_c_immunity.description",
  },
  {
    id: "echinacea_herbs",
    level: 3,
    xp: 700,
    areas: [{ id: "immuneSupport", descriptionKey: "echinacea_herbs.areas.immuneSupport" }],
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
  },
  {
    id: "adaptogenic_herbs",
    level: 3,
    xp: 0,
    areas: [{ id: "nervousSystem", descriptionKey: "adaptogenic_herbs.areas.nervousSystem" }],
    title: "adaptogenic_herbs.title",
    descriptionKey: "adaptogenic_herbs.description",
    isParent: true,
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
    areas: [
      { id: "musclePerformance", descriptionKey: "creatine_atp_strength.areas.musclePerformance" },
      { id: "energy", descriptionKey: "creatine_atp_strength.areas.energy" },
      { id: "cardioFitness", descriptionKey: "creatine_atp_strength.areas.cardioFitness" },
      { id: "focus", descriptionKey: "creatine_atp_strength.areas.focus" }
    ],
    title: "creatine_atp_strength.title",
    descriptionKey: "creatine_atp_strength.description",
    supplements: [{ id: "creatine_atp_strength" }],
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
    supplements: [],
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
    supplements: [],
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
    supplements: [],
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
    supplements: [],
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
    supplements: [],
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
    supplements: [],
    analyzePrompt: "hiit_vo2max.analyzePrompt",
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
    supplements: [],
    analyzePrompt: "running_volume_aerobic.analyzePrompt",
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
    supplements: [],
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
    supplements: [],
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
    supplements: [],
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
    supplements: [],
  },
];
