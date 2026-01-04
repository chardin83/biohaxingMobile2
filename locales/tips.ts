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
    id: "level_energy_1_step1",
    level: 1,
    xp: 300,
    goals: [
      { id: "energy", description: "energy.levels.generalHealth.tips.0.description" }
    ],
    title: "energy.levels.generalHealth.tips.0.title",
    taskInfo: {
      description: "energy.levels.generalHealth.tips.0.description",
      duration: { amount: 6, unit: "days" },
  },
    supplements: [{ id: "multivitamin" }],
    startPrompt: "energy.levels.generalHealth.startPrompt",
    information: {
      text: "energy.levels.generalHealth.tips.0.information.text",
      author: "Christina",
  },
  },
  {
    id: "level_energy_3_step1",
    level: 3,
    xp: 700,
    goals: [
      { id: "energy", description: "energy.levels.mitochondrialSupport.tips.0.description" }
    ],
    title: "energy.levels.mitochondrialSupport.tips.0.title",
    taskInfo: {
      description: "energy.levels.mitochondrialSupport.tips.0.description",
      duration: { amount: 21, unit: "days" },
  },
    supplements: [{ id: "coenzymeQ10" }],
    startPrompt: "energy.levels.mitochondrialSupport.startPrompt",
    information: {
      text: "energy.levels.mitochondrialSupport.tips.0.information.text",
      author: "Christina",
  },
  },
  {
    id: "level_energy_4_step1",
    level: 4,
    xp: 900,
    goals: [{ id: "energy", description: "energy.levels.cellularEnergy.tips.0.description" }],
    title: "energy.levels.cellularEnergy.tips.0.title",
    taskInfo: {
      description: "energy.levels.cellularEnergy.tips.0.description",
      duration: { amount: 21, unit: "days" },
  },
    supplements: [{ id: "nad" }],
    startPrompt: "energy.levels.cellularEnergy.startPrompt",
    information: {
      text: "energy.levels.cellularEnergy.tips.0.information.text",
      author: "Christina",
  },
  },
  {
    id: "level_energy_5_step1",
    level: 5,
    xp: 1100,
    goals: [{ id: "energy", description: "energy.levels.metabolicActivation.tips.0.description" }],
    title: "energy.levels.generalHealth.tips.0.title",
    taskInfo: {
      description: "energy.levels.metabolicActivation.tips.0.description",
      duration: { amount: 21, unit: "days" },
  },
    supplements: [{ id: "alphaLipoicAcid" }],
    startPrompt: "energy.levels.metabolicActivation.startPrompt",
    information: {
      text: "energy.levels.metabolicActivation.tips.0.information.text",
      author: "Christina",
  },
  },
  {
    id: "level_energy_6_step1",
    level: 6,
    xp: 1300,
    goals: [{ id: "energy", description: "energy.levels.longevity.tips.0.description" }],
    title: "energy.levels.longevity.tips.0.title",
    taskInfo: {
      description: "energy.levels.longevity.tips.0.description",
      duration: { amount: 30, unit: "days" },
  },
    supplements: [{ id: "shilajit" }],
    startPrompt: "energy.levels.longevity.startPrompt",
    information: {
      text: "energy.levels.longevity.tips.0.information.text",
      author: "Christina",
  },
  },
  {
    id: "step2_interpret",
    level: 2,
    xp: 500,
    goals: [
      { id: "energy", description: "sleepQuality.levels.hormonalSupport.tips.0.description" }, { id: "immuneSupport", description: "sleepQuality.levels.hormonalSupport.tips.0.description" }
    ],
    title: "energy.levels.vitaminDComprehensive.tips.1.title",
    taskInfo: {
      description:
            "energy.levels.vitaminDComprehensive.tips.1.description",
      duration: { amount: 3, unit: "days" },
  },
    analyzePrompt: "energy.levels.vitaminDComprehensive.tips.1.analyzePrompt",
    information: {
      text: "energy.levels.vitaminDComprehensive.tips.1.information.text",
      author: "Christina",
  },
  },
  {
    id: "step3_genetics",
    level: 2,
    xp: 500,
    goals: [
      { id: "energy", description: "" }, { id: "immuneSupport", description: "" }
    ],
    title: "energy.levels.vitaminDComprehensive.tips.2.title",
    taskInfo: {
      description:
            "energy.levels.vitaminDComprehensive.tips.2.description",
      duration: { amount: 7, unit: "days" },
  },
    information: {
      text: "energy.levels.vitaminDComprehensive.tips.2.information.text",
      author: "Christina",
  },
  },
  {
    id: "level_sleepQuality_2_step1",
    level: 2,
    xp: 500,
    goals: [{ id: "sleepQuality", description: "sleepQuality.levels.hormonalSupport.tips.0.description" }, { id: "immuneSupport", description: "sleepQuality.levels.hormonalSupport.tips.0.description" }, { id: "energy", description: "sleepQuality.levels.hormonalSupport.tips.0.description" }],
    title: "sleepQuality.levels.hormonalSupport.tips.0.title",
    taskInfo: {
      description: "sleepQuality.levels.hormonalSupport.tips.0.description",
      duration: { amount: 14, unit: "days" },
  },
    supplements: [{ id: supplementIds.magnesium }],
  },
  {
    id: "level_sleepQuality_3_step1",
    level: 3,
    xp: 700,
    goals: [{ id: "sleepQuality", description: "sleepQuality.levels.neuroregulation.tips.0.description" }, { id: "immuneSupport", description: "sleepQuality.levels.neuroregulation.tips.0.description" }, { id: "energy", description: "sleepQuality.levels.neuroregulation.tips.0.description" }],
    title: "sleepQuality.levels.neuroregulation.tips.0.title",
    taskInfo: {
      description: "sleepQuality.levels.neuroregulation.tips.0.description",
      duration: { amount: 14, unit: "days" },
  },
    supplements: [{ id: supplementIds.lTheanine }],
  },
  {
    id: "level_focus_2_step1",
    level: 2,
    xp: 500,
    goals: [{ id: "focus", description: "focus.levels.neurotransmitterSupport.tips.0.description" }],
    title: "focus.levels.neurotransmitterSupport.tips.0.title",
    taskInfo: {
      description: "focus.levels.neurotransmitterSupport.tips.0.description",
      duration: { amount: 14, unit: "days" },
  },
    supplements: [{ id: supplementIds.lTyrosine }],
  },
  {
    id: "level_focus_3_step1",
    level: 3,
    xp: 700,
    goals: [{ id: "focus", description: "focus.levels.nootropicStimulation.tips.0.description" }],
    title: "focus.levels.nootropicStimulation.tips.0.title",
    taskInfo: {
      description: "focus.levels.nootropicStimulation.tips.0.description",
      duration: { amount: 7, unit: "days" },
  },
  },
  {
    id: "hydration_nutrition",
    level: 1,
    xp: 300,
    goals: [{ id: "immuneSupport", description: "immuneSupport.levels.hydration.tips.0.description" }, { id: "energy", description: "immuneSupport.levels.hydration.tips.0.description" }, { id: "cardioFitness", description: "immuneSupport.levels.hydration.tips.0.description" }],
    title: "immuneSupport.levels.hydration.tips.0.title",
    taskInfo: {
      description: "immuneSupport.levels.hydration.tips.0.description",
      duration: { amount: 7, unit: "days" },
  },
    information: {
      text: "immuneSupport.levels.hydration.tips.0.information.text",
      author: "Christina",
  },
  },
  {
    id: "level_immuneSupport_2_step1",
    level: 2,
    xp: 500,
    goals: [{ id: "immuneSupport", description: "immuneSupport.levels.naturalImmunity.tips.0.description" }],
    title: "immuneSupport.levels.naturalImmunity.tips.0.title",
    taskInfo: {
      description: "immuneSupport.levels.naturalImmunity.tips.0.description",
      duration: { amount: 14, unit: "days" },
  },
    supplements: [{ id: "echinacea" }],
  },
  {
    id: "level_immuneSupport_3_step1",
    level: 3,
    xp: 700,
    goals: [{ id: "immuneSupport", description: "immuneSupport.levels.glutathioneDetox.tips.0.description" }],
    title: "immuneSupport.levels.glutathioneDetox.tips.0.title",
    taskInfo: {
      description: "immuneSupport.levels.glutathioneDetox.tips.0.description",
      duration: { amount: 21, unit: "days" },
  },
    supplements: [{ id: "nac" }],
  },
  {
    id: "glycine",
    level: 2,
    xp: 500,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.glycine.tips.0.description" }],
    title: "nervousSystem.levels.glycine.tips.0.title",
    taskInfo: {
      description: "nervousSystem.levels.glycine.tips.0.description",
      duration: { amount: 10, unit: "days" },
  },
    supplements: [{ id: "glycine" }],
  },
  {
    id: "neurochemicalSupport",
    level: 3,
    xp: 700,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.neurochemicalSupport.tips.0.description" }],
    title: "nervousSystem.levels.neurochemicalSupport.tips.0.title",
    taskInfo: {
      description: "nervousSystem.levels.neurochemicalSupport.tips.0.description",
      duration: { amount: 14, unit: "days" },
  },
    supplements: [{ id: "semax" }],
  },
  {
    id: "breathwork",
    level: 1,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.optimization.tips.0.description" }, { id: "immuneSupport", description: "nervousSystem.levels.optimization.tips.0.description" }, { id: "energy", description: "nervousSystem.levels.optimization.tips.0.description" }],
    title: "nervousSystem.levels.optimization.tips.0.title",
    taskInfo: {
      description: "nervousSystem.levels.optimization.tips.0.description",
      duration: { amount: 14, unit: "days" },
  },
    information: {
      text: "nervousSystem.levels.optimization.tips.0.information.text",
      author: "Christina",
  },
  },
  {
    id: "sleep_optimization",
    level: 1,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.optimization.tips.1.description" }, { id: "immuneSupport", description: "nervousSystem.levels.optimization.tips.1.description" }, { id: "energy", description: "nervousSystem.levels.optimization.tips.1.description" }, { id: "cardioFitness", description: "nervousSystem.levels.optimization.tips.1.description" }, { id: "sleepQuality", description: "nervousSystem.levels.optimization.tips.1.description" }],
    title: "nervousSystem.levels.optimization.tips.1.title",
    taskInfo: {
      description: "nervousSystem.levels.optimization.tips.1.description",
      duration: { amount: 7, unit: "days" },
  },
    information: {
      text: "nervousSystem.levels.optimization.tips.1.information.text",
      author: "Christina",
  },
  },
  {
    id: "sunlight",
    level: 1,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.optimization.tips.2.description" }, { id: "immuneSupport", description: "nervousSystem.levels.optimization.tips.2.description" }],
    title: "nervousSystem.levels.optimization.tips.2.title",
    taskInfo: {
      description: "nervousSystem.levels.optimization.tips.2.description",
      duration: { amount: 14, unit: "days" },
  },
    information: {
      text: "nervousSystem.levels.optimization.tips.2.information.text",
      author: "Christina",
  },
  },
  {
    id: "cold_exposure",
    level: 2,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.optimization.tips.3.description" }],
    title: "nervousSystem.levels.optimization.tips.3.title",
    taskInfo: {
      description: "nervousSystem.levels.optimization.tips.3.description",
      duration: { amount: 21, unit: "days" },
  },
    information: {
      text: "nervousSystem.levels.optimization.tips.3.information.text",
      author: "Christina",
  },
  },
  {
    id: "meditation",
    level: 2,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.optimization.tips.4.description" }, { id: "immuneSupport", description: "nervousSystem.levels.optimization.tips.4.description" }, { id: "energy", description: "nervousSystem.levels.optimization.tips.4.description" }],
    title: "nervousSystem.levels.optimization.tips.4.title",
    taskInfo: {
      description: "nervousSystem.levels.optimization.tips.4.description",
      duration: { amount: 21, unit: "days" },
  },
    information: {
      text: "nervousSystem.levels.optimization.tips.4.information.text",
      author: "Christina",
  },
  },
  {
    id: "nature",
    level: 2,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.optimization.tips.5.description" }, { id: "immuneSupport", description: "nervousSystem.levels.optimization.tips.5.description" }, { id: "energy", description: "nervousSystem.levels.optimization.tips.5.description" }],
    title: "nervousSystem.levels.optimization.tips.5.title",
    taskInfo: {
      description: "nervousSystem.levels.optimization.tips.5.description",
      duration: { amount: 14, unit: "days" },
  },
    information: {
      text: "nervousSystem.levels.optimization.tips.5.information.text",
      author: "Christina",
  },
  },
  {
    id: "recovery_monitoring",
    level: 3,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.optimization.tips.6.description" }, { id: "immuneSupport", description: "nervousSystem.levels.optimization.tips.6.description" }, { id: "energy", description: "nervousSystem.levels.optimization.tips.6.description" }, { id: "cardioFitness", description: "nervousSystem.levels.optimization.tips.6.description" }, { id: "musclePerformance", description: "nervousSystem.levels.optimization.tips.6.description" }],
    title: "nervousSystem.levels.optimization.tips.6.title",
    taskInfo: {
      description: "nervousSystem.levels.optimization.tips.6.description",
      duration: { amount: 21, unit: "days" },
  },
    information: {
      text: "nervousSystem.levels.optimization.tips.6.information.text",
      author: "Christina",
  },
  },
  {
    id: "social_connection",
    level: 2,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.optimization.tips.7.description" }],
    title: "nervousSystem.levels.optimization.tips.7.title",
    taskInfo: {
      description: "nervousSystem.levels.optimization.tips.7.description",
      duration: { amount: 14, unit: "days" },
  },
    information: {
      text: "nervousSystem.levels.optimization.tips.7.information.text",
      author: "Christina",
  },
  },
  {
    id: "calming_music",
    level: 1,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.optimization.tips.8.description" }],
    title: "nervousSystem.levels.optimization.tips.8.title",
    taskInfo: {
      description: "nervousSystem.levels.optimization.tips.8.description",
      duration: { amount: 14, unit: "days" },
  },
    information: {
      text: "nervousSystem.levels.optimization.tips.8.information.text",
      author: "Christina",
  },
  },
  {
    id: "adaptogens",
    level: 3,
    xp: 0,
    goals: [{ id: "nervousSystem", description: "nervousSystem.levels.optimization.tips.9.description" }],
    title: "nervousSystem.levels.optimization.tips.9.title",
    taskInfo: {
      description: "nervousSystem.levels.optimization.tips.9.description",
      duration: { amount: 21, unit: "days" },
  },
    information: {
      text: "nervousSystem.levels.optimization.tips.9.information.text",
      author: "Christina",
  },
  },
  {
    id: "motorUnitActivation_step1",
    level: 1,
    xp: 0,
    goals: [{ id: "musclePerformance", description: "musclePerformance.levels.basicSupport.tips.0.description" }],
    title: "Aktivera fler motorenheter",
    taskInfo: {
      description: "musclePerformance.levels.basicSupport.tips.0.description",
      duration: { amount: 21, unit: "days" },
  },
    supplements: [],
  },
  {
    id: "level_musclePerformance_2_step1",
    level: 2,
    xp: 500,
    goals: [{ id: "musclePerformance", description: "musclePerformance.levels.enduranceRecovery.tips.0.description" }],
    title: "musclePerformance.levels.enduranceRecovery.tips.0.title",
    taskInfo: {
      description: "musclePerformance.levels.enduranceRecovery.tips.0.description",
      duration: { amount: 21, unit: "days" },
  },
    supplements: [{ id: "betaAlanine" }],
  },
  {
    id: "level_musclePerformance_3_step1",
    level: 3,
    xp: 700,
    goals: [{ id: "musclePerformance", description: "musclePerformance.levels.hormonalBoosters.tips.0.description" }],
    title: "musclePerformance.levels.hormonalBoosters.tips.0.title",
    taskInfo: {
      description: "musclePerformance.levels.hormonalBoosters.tips.0.description",
      duration: { amount: 21, unit: "days" },
  },
    supplements: [{ id: "shilajit" }],
  },
  {
    id: "level_musclePerformance_4_step1",
    level: 4,
    xp: 900,
    goals: [{ id: "musclePerformance", description: "musclePerformance.levels.androgenicEnhancers.tips.0.description" }],
    title: "musclePerformance.levels.androgenicEnhancers.tips.0.title",
    taskInfo: {
      description: "musclePerformance.levels.androgenicEnhancers.tips.0.description",
      duration: { amount: 14, unit: "days" },
  },
    supplements: [{ id: "fadogia" }],
  },
  {
    id: "level_digestiveHealth_1_step2",
    level: 1,
    xp: 300,
    goals: [{ id: "digestiveHealth", description: "digestiveHealth.levels.gutFlora.tips.1.description" }, { id: "immuneSupport", description: "digestiveHealth.levels.gutFlora.tips.1.description" }],
    title: "digestiveHealth.levels.gutFlora.tips.1.title",
    taskInfo: {
      description: "digestiveHealth.levels.gutFlora.tips.1.description",
      warning: "digestiveHealth.levels.gutFlora.tips.1.warning",
      duration: { amount: 14, unit: "days" },
  },
    supplements: [{ id: "probiotics" }],
  },
  {
    id: "level_digestiveHealth_2_step1",
    level: 2,
    xp: 500,
    goals: [{ id: "digestiveHealth", description: "digestiveHealth.levels.liverEnzymes.tips.0.description" }, { id: "immuneSupport", description: "digestiveHealth.levels.liverEnzymes.tips.0.description" }],
    title: "digestiveHealth.levels.liverEnzymes.tips.0.title",
    taskInfo: {
      description: "digestiveHealth.levels.liverEnzymes.tips.0.description",
      duration: { amount: 14, unit: "days" },
  },
    supplements: [{ id: "milkThistle" }],
  },
  {
    id: "level_digestiveHealth_3_step1",
    level: 3,
    xp: 700,
    goals: [{ id: "digestiveHealth", description: "digestiveHealth.levels.advancedGut.tips.0.description" }, { id: "immuneSupport", description: "digestiveHealth.levels.advancedGut.tips.0.description" }],
    title: "digestiveHealth.levels.advancedGut.tips.0.title",
    taskInfo: {
      description: "digestiveHealth.levels.advancedGut.tips.0.description",
      duration: { amount: 21, unit: "days" },
  },
    supplements: [{ id: "tudca" }],
  },
  {
    id: "level_cardioFitness_2_step1",
    level: 2,
    xp: 500,
    goals: [{ id: "cardioFitness", description: "cardioFitness.levels.runningVolume.tips.0.description" }],
    title: "cardioFitness.levels.runningVolume.tips.0.title",
    taskInfo: {
      description: "cardioFitness.levels.runningVolume.tips.0.description",
      duration: { amount: 3, unit: "weeks" },
  },
    supplements: [],
    analyzePrompt: "cardioFitness.levels.runningVolume.analyzePrompt",
  },
  {
    id: "level_cardioFitness_3_step1",
    level: 3,
    xp: 700,
    goals: [{ id: "cardioFitness", description: "cardioFitness.levels.vo2max.tips.0.description" }],
    title: "cardioFitness.levels.vo2max.tips.0.title",
    taskInfo: {
      description: "cardioFitness.levels.vo2max.tips.0.description",
      duration: { amount: 4, unit: "weeks" },
  },
    supplements: [],
    analyzePrompt: "cardioFitness.levels.vo2max.prompt",
  }
];
