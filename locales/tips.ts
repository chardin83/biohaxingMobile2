import { supplementIds } from "./supplementIds";

type SupplementReference = {
    id: string;
};

type TaskInfo = {
    description: string;
    warning?: string;
    duration: {
        amount: number;
        unit: "days" | "weeks" | "months" | "time";
    };
    tasks?: string[];
};

export type TipGoal = {
  id: string;
  description: string;
};

export type Information = {
    text: string;
    author: string;
};

export type Tip = {
  id: string;
  level?: number;
  xp?: number;
  goals: TipGoal[];
  title: string;
  taskInfo: TaskInfo;
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
    goals: [
      { id: "energy", description: "nutritional_support_vitality.description" }
    ],
    title: "nutritional_support_vitality.title",
    taskInfo: {
      description: "nutritional_support_vitality.description",
      duration: { amount: 6, unit: "days" },
    },
    supplements: [{ id: "multivitamin_general" }],
    startPrompt: "nutritional_support_vitality.startPrompt",
    information: {
      text: "nutritional_support_vitality.information.text",
      author: "Christina",
    },
  },
  {
    id: "vitamin_d_status_awareness",
    level: 3,
    xp: 700,
    goals: [
      { id: "energy", description: "vitamin_d_status_awareness.description" }
    ],
    title: "vitamin_d_status_awareness.title",
    taskInfo: {
      description: "vitamin_d_status_awareness.description",
      duration: { amount: 21, unit: "days" },
    },
    supplements: [{ id: "coenzymeQ10" }],
    startPrompt: "vitamin_d_status_awareness.startPrompt",
    information: {
      text: "vitamin_d_status_awareness.information.text",
      author: "Christina",
    },
  },
  {
    id: "vitamin_d_intake",
    level: 4,
    xp: 900,
    goals: [{ id: "energy", description: "vitamin_d_intake.description" }],
    title: "vitamin_d_intake.title",
    taskInfo: {
      description: "vitamin_d_intake.description",
      duration: { amount: 21, unit: "days" },
    },
    supplements: [{ id: "nad" }],
    startPrompt: "vitamin_d_intake.startPrompt",
    information: {
      text: "vitamin_d_intake.information.text",
      author: "Christina",
    },
  },
  {
    id: "vitamin_d_measurements",
    level: 5,
    xp: 1100,
    goals: [{ id: "energy", description: "vitamin_d_measurements.description" }],
    title: "vitamin_d_measurements.title",
    taskInfo: {
      description: "vitamin_d_measurements.description",
      duration: { amount: 21, unit: "days" },
    },
    supplements: [{ id: "vitamin_d" }],
    startPrompt: "vitamin_d_measurements.startPrompt",
    information: {
      text: "vitamin_d_measurements.information.text",
      author: "Christina",
    },
  },
  {
    id: "vitamin_mineral_balance",
    level: 6,
    xp: 1300,
    goals: [{ id: "energy", description: "vitamin_mineral_balance.description" }],
    title: "vitamin_mineral_balance.title",
    taskInfo: {
      description: "vitamin_mineral_balance.description",
      duration: { amount: 30, unit: "days" },
    },
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
    goals: [
      { id: "energy", description: "mitochondrial_nutrients_coq10.description" },
      { id: "immuneSupport", description: "mitochondrial_nutrients_coq10.description" }
    ],
    title: "mitochondrial_nutrients_coq10.title",
    taskInfo: {
      description: "mitochondrial_nutrients_coq10.description",
      duration: { amount: 3, unit: "days" },
    },
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
    goals: [
      { id: "energy", description: "cellular_energy_nad.description" },
      { id: "immuneSupport", description: "cellular_energy_nad.description" }
    ],
    title: "cellular_energy_nad.title",
    taskInfo: {
      description: "cellular_energy_nad.description",
      duration: { amount: 7, unit: "days" },
    },
    information: {
      text: "cellular_energy_nad.information.text",
      author: "Christina",
    },
  },
  {
    id: "sleep_timing_circadian",
    level: 2,
    xp: 500,
    goals: [
      { id: "sleepQuality", description: "sleep_timing_circadian.description" },
      { id: "immuneSupport", description: "sleep_timing_circadian.description" },
      { id: "energy", description: "sleep_timing_circadian.description" }
    ],
    title: "sleep_timing_circadian.title",
    taskInfo: {
      description: "sleep_timing_circadian.description",
      duration: { amount: 14, unit: "days" },
    },
    supplements: [{ id: "magnesium" }],
  },
  {
    id: "sleep_magnesium_hormonal",
    level: 3,
    xp: 700,
    goals: [
      { id: "sleepQuality", description: "sleep_magnesium_hormonal.description" },
      { id: "immuneSupport", description: "sleep_magnesium_hormonal.description" },
      { id: "energy", description: "sleep_magnesium_hormonal.description" }
    ],
    title: "sleep_magnesium_hormonal.title",
    taskInfo: {
      description: "sleep_magnesium_hormonal.description",
      duration: { amount: 14, unit: "days" },
    },
    supplements: [{ id: "magnesium" }],
  },
  {
    id: "calm_alertness_ltheanine",
    level: 2,
    xp: 500,
    goals: [{ id: "focus", description: "calm_alertness_ltheanine.description" }],
    title: "calm_alertness_ltheanine.title",
    taskInfo: {
      description: "calm_alertness_ltheanine.description",
      duration: { amount: 14, unit: "days" },
    },
  },
  {
    id: "neurotransmitter_ltyrosine",
    level: 3,
    xp: 700,
    goals: [{ id: "focus", description: "neurotransmitter_ltyrosine.description" }],
    title: "neurotransmitter_ltyrosine.title",
    taskInfo: {
      description: "neurotransmitter_ltyrosine.description",
      duration: { amount: 7, unit: "days" },
    },
  },
  {
    id: "maintain_hydration",
    level: 1,
    xp: 300,
    goals: [
      { id: "immuneSupport", description: "maintain_hydration.description" },
      { id: "energy", description: "maintain_hydration.description" },
      { id: "cardioFitness", description: "maintain_hydration.description" }
    ],
    title: "maintain_hydration.title",
    taskInfo: {
      description: "maintain_hydration.description",
      duration: { amount: 7, unit: "days" },
    },
    information: {
      text: "maintain_hydration.information.text",
      author: "Christina",
    },
  },
  {
    id: "vitamin_c_immunity",
    level: 2,
    xp: 500,
    goals: [{ id: "immuneSupport", description: "vitamin_c_immunity.description" }],
    title: "vitamin_c_immunity.title",
    taskInfo: {
      description: "vitamin_c_immunity.description",
      duration: { amount: 14, unit: "days" },
    },
  },
  {
    id: "echinacea_herbs",
    level: 3,
    xp: 700,
    goals: [{ id: "immuneSupport", description: "echinacea_herbs.description" }],
    title: "echinacea_herbs.title",
    taskInfo: {
      description: "echinacea_herbs.description",
      duration: { amount: 21, unit: "days" },
    },
  },
  {
    id: "calming_glycine",
    level: 2,
    xp: 500,
    goals: [{ id: "nervousSystem", description: "calming_glycine.description" }],
    title: "calming_glycine.title",
    taskInfo: {
      description: "calming_glycine.description",
      duration: { amount: 10, unit: "days" },
    },
    supplements: [{ id: "glycine" }],
  },
  {
    id: "neuropeptide_semax",
    level: 3,
    xp: 700,
    goals: [{ id: "nervousSystem", description: "neuropeptide_semax.description" }],
    title: "neuropeptide_semax.title",
    taskInfo: {
      description: "neuropeptide_semax.description",
      duration: { amount: 14, unit: "days" },
    },
  },
  {
    id: "breathwork_parasympathetic",
    level: 1,
    xp: 0,
    goals: [
      { id: "nervousSystem", description: "breathwork_parasympathetic.description" },
      { id: "immuneSupport", description: "breathwork_parasympathetic.description" },
      { id: "energy", description: "breathwork_parasympathetic.description" }
    ],
    title: "breathwork_parasympathetic.title",
    taskInfo: {
      description: "breathwork_parasympathetic.description",
      duration: { amount: 14, unit: "days" },
    },
    information: {
      text: "breathwork_parasympathetic.information.text",
      author: "Christina",
    },
  },
  {
    id: "sleep_optimization_recovery",
    level: 1,
    xp: 0,
    goals: [
      { id: "nervousSystem", description: "sleep_optimization_recovery.description" },
      { id: "immuneSupport", description: "sleep_optimization_recovery.description" },
      { id: "energy", description: "sleep_optimization_recovery.description" },
      { id: "cardioFitness", description: "sleep_optimization_recovery.description" },
      { id: "sleepQuality", description: "sleep_optimization_recovery.description" }
    ],
    title: "sleep_optimization_recovery.title",
    taskInfo: {
      description: "sleep_optimization_recovery.description",
      duration: { amount: 7, unit: "days" },
    },
    information: {
      text: "sleep_optimization_recovery.information.text",
      author: "Christina",
    },
  },
  {
    id: "sunlight_circadian",
    level: 1,
    xp: 0,
    goals: [
      { id: "nervousSystem", description: "sunlight_circadian.description" },
      { id: "immuneSupport", description: "sunlight_circadian.description" }
    ],
    title: "sunlight_circadian.title",
    taskInfo: {
      description: "sunlight_circadian.description",
      duration: { amount: 14, unit: "days" },
    },
    information: {
      text: "sunlight_circadian.information.text",
      author: "Christina",
    },
  },
  {
    id: "cold_exposure_ans",
    level: 2,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "cold_exposure_ans.description" }],
    title: "cold_exposure_ans.title",
    taskInfo: {
      description: "cold_exposure_ans.description",
      duration: { amount: 21, unit: "days" },
    },
    information: {
      text: "cold_exposure_ans.information.text",
      author: "Christina",
    },
  },
  {
    id: "meditation_mindfulness",
    level: 2,
    xp: 0,
    goals: [
      { id: "nervousSystem", description: "meditation_mindfulness.description" },
      { id: "immuneSupport", description: "meditation_mindfulness.description" },
      { id: "energy", description: "meditation_mindfulness.description" }
    ],
    title: "meditation_mindfulness.title",
    taskInfo: {
      description: "meditation_mindfulness.description",
      duration: { amount: 21, unit: "days" },
    },
    information: {
      text: "meditation_mindfulness.information.text",
      author: "Christina",
    },
  },
  {
    id: "nature_parasympathetic",
    level: 2,
    xp: 0,
    goals: [
      { id: "nervousSystem", description: "nature_parasympathetic.description" },
      { id: "immuneSupport", description: "nature_parasympathetic.description" },
      { id: "energy", description: "nature_parasympathetic.description" }
    ],
    title: "nature_parasympathetic.title",
    taskInfo: {
      description: "nature_parasympathetic.description",
      duration: { amount: 14, unit: "days" },
    },
    information: {
      text: "nature_parasympathetic.information.text",
      author: "Christina",
    },
  },
  {
    id: "hrv_recovery_monitoring",
    level: 3,
    xp: 0,
    goals: [
      { id: "nervousSystem", description: "hrv_recovery_monitoring.description" },
      { id: "immuneSupport", description: "hrv_recovery_monitoring.description" },
      { id: "energy", description: "hrv_recovery_monitoring.description" },
      { id: "cardioFitness", description: "hrv_recovery_monitoring.description" },
      { id: "musclePerformance", description: "hrv_recovery_monitoring.description" }
    ],
    title: "hrv_recovery_monitoring.title",
    taskInfo: {
      description: "hrv_recovery_monitoring.description",
      duration: { amount: 21, unit: "days" },
    },
    information: {
      text: "hrv_recovery_monitoring.information.text",
      author: "Christina",
    },
  },
  {
    id: "social_connection_vagal",
    level: 2,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "social_connection_vagal.description" }],
    title: "social_connection_vagal.title",
    taskInfo: {
      description: "social_connection_vagal.description",
      duration: { amount: 14, unit: "days" },
    },
    information: {
      text: "social_connection_vagal.information.text",
      author: "Christina",
    },
  },
  {
    id: "calming_music_waves",
    level: 1,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "calming_music_waves.description" }],
    title: "calming_music_waves.title",
    taskInfo: {
      description: "calming_music_waves.description",
      duration: { amount: 14, unit: "days" },
    },
    information: {
      text: "calming_music_waves.information.text",
      author: "Christina",
    },
  },
  {
    id: "adaptogenic_herbs",
    level: 3,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "adaptogenic_herbs.description" }],
    title: "adaptogenic_herbs.title",
    taskInfo: {
      description: "adaptogenic_herbs.description",
      duration: { amount: 21, unit: "days" },
    },
    information: {
      text: "adaptogenic_herbs.information.text",
      author: "Christina",
    },
  },
  {
    id: "neuromuscular_training",
    level: 1,
    xp: 0,
    goals: [{ id: "musclePerformance", description: "neuromuscular_training.description" }],
    title: "neuromuscular_training.title",
    taskInfo: {
      description: "neuromuscular_training.description",
      duration: { amount: 21, unit: "days" },
    },
    supplements: [],
  },
  {
    id: "creatine_atp_strength",
    level: 2,
    xp: 500,
    goals: [{ id: "musclePerformance", description: "creatine_atp_strength.description" }],
    title: "creatine_atp_strength.title",
    taskInfo: {
      description: "creatine_atp_strength.description",
      duration: { amount: 21, unit: "days" },
    },
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
    goals: [{ id: "musclePerformance", description: "betaalanine_endurance.description" }],
    title: "betaalanine_endurance.title",
    taskInfo: {
      description: "betaalanine_endurance.description",
      duration: { amount: 21, unit: "days" },
    },
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
    goals: [{ id: "musclePerformance", description: "shilajit_performance.description" }],
    title: "shilajit_performance.title",
    taskInfo: {
      description: "shilajit_performance.description",
      duration: { amount: 14, unit: "days" },
    },
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
    goals: [
      { id: "digestiveHealth", description: "probiotics_microbiota.description" },
      { id: "immuneSupport", description: "probiotics_microbiota.description" }
    ],
    title: "probiotics_microbiota.title",
    taskInfo: {
      description: "probiotics_microbiota.description",
      warning: "probiotics_microbiota.warning",
      duration: { amount: 14, unit: "days" },
    },
    supplements: [],
  },
  {
    id: "fiber_microbiome",
    level: 2,
    xp: 500,
    goals: [
      { id: "digestiveHealth", description: "fiber_microbiome.description" },
      { id: "immuneSupport", description: "fiber_microbiome.description" }
    ],
    title: "fiber_microbiome.title",
    taskInfo: {
      description: "fiber_microbiome.description",
      duration: { amount: 14, unit: "days" },
    },
    supplements: [],
  },
  {
    id: "milk_thistle_liver",
    level: 3,
    xp: 700,
    goals: [
      { id: "digestiveHealth", description: "milk_thistle_liver.description" },
      { id: "immuneSupport", description: "milk_thistle_liver.description" }
    ],
    title: "milk_thistle_liver.title",
    taskInfo: {
      description: "milk_thistle_liver.description",
      duration: { amount: 21, unit: "days" },
    },
    supplements: [],
  },
  {
    id: "hiit_vo2max",
    level: 2,
    xp: 500,
    goals: [{ id: "cardioFitness", description: "hiit_vo2max.description" }],
    title: "hiit_vo2max.title",
    taskInfo: {
      description: "hiit_vo2max.description",
      duration: { amount: 3, unit: "weeks" },
    },
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
    goals: [{ id: "cardioFitness", description: "running_volume_aerobic.description" }],
    title: "running_volume_aerobic.title",
    taskInfo: {
      description: "running_volume_aerobic.description",
      duration: { amount: 4, unit: "weeks" },
    },
    supplements: [],
    analyzePrompt: "running_volume_aerobic.analyzePrompt",
    information: {
      text: "running_volume_aerobic.information.text",
      author: "Christina",
    },
  }
];
