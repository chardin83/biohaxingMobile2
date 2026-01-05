import { supplementIds } from "./supplementIds";

type SupplementReference = {
    id: string;
};



export type TipArea = {
  id: string;
  descriptionKey: string;
};

export type Information = {
    text: string;
    author: string;
};

export type Tip = {
  id: string;
  level?: number;
  xp?: number;
  areas: TipArea[];
  title: string;
  supplements?: SupplementReference[];
  analyzePrompt?: string;
  startPrompt?: string;
  information?: Information;
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
    supplements: [{ id: "multivitamin_general" }],
    startPrompt: "nutritional_support_vitality.startPrompt",
    information: {
      text: "nutritional_support_vitality.information.text",
      author: "Christina",
    },
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
    supplements: [{ id: "vitamin_d" }],
    startPrompt: "vitamin_d.startPrompt",
    information: {
      text: "vitamin_d.information.text",
      author: "Christina",
    },
  },
  {
    id: "vitamin_mineral_balance",
    level: 6,
    xp: 1300,
    areas: [{ id: "energy", descriptionKey: "vitamin_mineral_balance.description" }],
    title: "vitamin_mineral_balance.title",
    supplements: [{ id: "vitamin_d" }],
    startPrompt: "vitamin_mineral_balance.startPrompt",
    information: {
      text: "vitamin_mineral_balance.information.text",
      author: "Christina",
    },
  },
  {
    id: "mitochondrial_nutrients_coq10",
    level: 2,
    xp: 500,
    areas: [
      { id: "energy", descriptionKey: "mitochondrial_nutrients_coq10.areas.energy" },
      { id: "immuneSupport", descriptionKey: "mitochondrial_nutrients_coq10.areas.immuneSupport" }
    ],
    title: "mitochondrial_nutrients_coq10.title",
    analyzePrompt: "mitochondrial_nutrients_coq10.analyzePrompt",
    information: {
      text: "mitochondrial_nutrients_coq10.information.text",
      author: "Christina",
    },
  },
  {
    id: "cellular_energy_nad",
    level: 2,
    xp: 500,
    areas: [
      { id: "energy", descriptionKey: "cellular_energy_nad.description" },
      { id: "immuneSupport", descriptionKey: "cellular_energy_nad.description" }
    ],
    title: "cellular_energy_nad.title",
    information: {
      text: "cellular_energy_nad.information.text",
      author: "Christina",
    },
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
    supplements: [{ id: "magnesium" }],
  },
  {
    id: "calm_alertness_ltheanine",
    level: 2,
    xp: 500,
    areas: [{ id: "focus", descriptionKey: "calm_alertness_ltheanine.description" }],
    title: "calm_alertness_ltheanine.title",
  },
  {
    id: "neurotransmitter_ltyrosine",
    level: 3,
    xp: 700,
    areas: [{ id: "focus", descriptionKey: "neurotransmitter_ltyrosine.description" }],
    title: "neurotransmitter_ltyrosine.title",
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
    information: {
      text: "maintain_hydration.information.text",
      author: "Christina",
    },
  },
  {
    id: "vitamin_c_immunity",
    level: 2,
    xp: 500,
    areas: [{ id: "immuneSupport", descriptionKey: "vitamin_c_immunity.description" }],
    title: "vitamin_c_immunity.title",
  },
  {
    id: "echinacea_herbs",
    level: 3,
    xp: 700,
    areas: [{ id: "immuneSupport", descriptionKey: "echinacea_herbs.description" }],
    title: "echinacea_herbs.title",
  },
  {
    id: "calming_glycine",
    level: 2,
    xp: 500,
    areas: [{ id: "nervousSystem", descriptionKey: "calming_glycine.description" }],
    title: "calming_glycine.title",
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
    information: {
      text: "breathwork_parasympathetic.information.text",
      author: "Christina",
    },
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
    information: {
      text: "sleep_optimization_recovery.information.text",
      author: "Christina",
    },
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
    information: {
      text: "sunlight_circadian.information.text",
      author: "Christina",
    },
  },
  {
    id: "cold_exposure_ans",
    level: 2,
    xp: 0,
    areas: [{ id: "nervousSystem", descriptionKey: "cold_exposure_ans.description" }],
    title: "cold_exposure_ans.title",
    information: {
      text: "cold_exposure_ans.information.text",
      author: "Christina",
    },
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
    information: {
      text: "meditation_mindfulness.information.text",
      author: "Christina",
    },
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
    information: {
      text: "nature_parasympathetic.information.text",
      author: "Christina",
    },
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
    information: {
      text: "hrv_recovery_monitoring.information.text",
      author: "Christina",
    },
  },
  {
    id: "social_connection_vagal",
    level: 2,
    xp: 0,
    areas: [{ id: "nervousSystem", descriptionKey: "social_connection_vagal.description" }],
    title: "social_connection_vagal.title",
    information: {
      text: "social_connection_vagal.information.text",
      author: "Christina",
    },
  },
  {
    id: "calming_music_waves",
    level: 1,
    xp: 0,
    areas: [{ id: "nervousSystem", descriptionKey: "calming_music_waves.description" }],
    title: "calming_music_waves.title",
    information: {
      text: "calming_music_waves.information.text",
      author: "Christina",
    },
  },
  {
    id: "adaptogenic_herbs",
    level: 3,
    xp: 0,
    areas: [{ id: "nervousSystem", descriptionKey: "adaptogenic_herbs.description" }],
    title: "adaptogenic_herbs.title",
    information: {
      text: "adaptogenic_herbs.information.text",
      author: "Christina",
    },
  },
  {
    id: "neuromuscular_training",
    level: 1,
    xp: 0,
    areas: [{ id: "musclePerformance", descriptionKey: "neuromuscular_training.description" }],
    title: "neuromuscular_training.title",
    supplements: [],
  },
  {
    id: "creatine_atp_strength",
    level: 2,
    xp: 500,
    areas: [{ id: "musclePerformance", descriptionKey: "creatine_atp_strength.description" }],
    title: "creatine_atp_strength.title",
    supplements: [{ id: "creatine_atp_strength" }],
    information: {
      text: "creatine_atp_strength.information.text",
      author: "Christina",
    },
  },
  {
    id: "betaalanine_endurance",
    level: 3,
    xp: 700,
    areas: [{ id: "musclePerformance", descriptionKey: "betaalanine_endurance.description" }],
    title: "betaalanine_endurance.title",
    supplements: [],
    information: {
      text: "betaalanine_endurance.information.text",
      author: "Christina",
    },
  },
  {
    id: "shilajit_performance",
    level: 4,
    xp: 900,
    areas: [{ id: "musclePerformance", descriptionKey: "shilajit_performance.description" }],
    title: "shilajit_performance.title",
    supplements: [],
    information: {
      text: "shilajit_performance.information.text",
      author: "Christina",
    },
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
    information: {
      text: "hiit_vo2max.information.text",
      author: "Christina",
    },
  },
  {
    id: "running_volume_aerobic",
    level: 3,
    xp: 700,
    areas: [{ id: "cardioFitness", descriptionKey: "running_volume_aerobic.description" }],
    title: "running_volume_aerobic.title",
    supplements: [],
    analyzePrompt: "running_volume_aerobic.analyzePrompt",
    information: {
      text: "running_volume_aerobic.information.text",
      author: "Christina",
    },
  }
];
