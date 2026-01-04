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
        goals: [
      { id: "energy", description: "PLACEHOLDER_energy" }
    ],
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
        goals: [
      { id: "energy", description: "PLACEHOLDER_energy" }
    ],
        title: "energy.levels.metabolicActivation.tips.0.title",
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
        goals: [
      { id: "energy", description: "PLACEHOLDER_energy" }
    ],
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
    ],
  },
  {
    id: "vitaminD_comprehensive",
    title: "energy.levels.vitaminDComprehensive.title",
    tips: [
      {
        id: "step1_test",
        level: 2,
        xp: 500,
        goals: [
      { id: "energy", description: "PLACEHOLDER_energy" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
    ],
        title: "energy.levels.vitaminDComprehensive.tips.0.title",
        taskInfo: {
          description:
            "energy.levels.vitaminDComprehensive.tips.0.description",
          duration: { amount: 2, unit: "days" },
        },
        startPrompt:
          "energy.levels.vitaminDComprehensive.tips.0.startPrompt",
        information: {
          text: "energy.levels.vitaminDComprehensive.tips.0.information.text",
          author: "Christina",
        },
      },
      {
        id: "step2_interpret",
        level: 2,
        xp: 500,
        goals: [
      { id: "energy", description: "PLACEHOLDER_energy" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
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
      { id: "energy", description: "PLACEHOLDER_energy" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
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
    ],
  },

  // sleepQuality
  {
    id: "sleepQuality_optimization",
    title: "sleepQuality.levels.sleepBy2230.tips.0.title",
    tips: [
      {
        id: "level_sleepQuality_1_step1",
        level: 1,
        xp: 300,
        goals: [
      { id: "sleepQuality", description: "PLACEHOLDER_sleepQuality" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" },
      { id: "energy", description: "PLACEHOLDER_energy" }
    ],
        title: "sleepQuality.levels.sleepBy2230.tips.0.title",
        taskInfo: {
          description: "sleepQuality.levels.sleepBy2230.tips.0.description",
          duration: { amount: 7, unit: "days" },
        },
      },
      {
        id: "level_sleepQuality_2_step1",
        level: 2,
        xp: 500,
        goals: [
      { id: "sleepQuality", description: "PLACEHOLDER_sleepQuality" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" },
      { id: "energy", description: "PLACEHOLDER_energy" }
    ],
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
        goals: [
      { id: "sleepQuality", description: "PLACEHOLDER_sleepQuality" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" },
      { id: "energy", description: "PLACEHOLDER_energy" }
    ],
        title: "sleepQuality.levels.neuroregulation.tips.0.title",
        taskInfo: {
          description: "sleepQuality.levels.neuroregulation.tips.0.description",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: supplementIds.lTheanine }],
      },
    ],
  },

  // focus
  {
    id: "focus_optimization",
    title: "focus.levels.calmAlertness.tips.0.title",
    tips: [
      {
        id: "level_focus_1_step1",
        level: 1,
        xp: 300,
        goals: [
      { id: "focus", description: "PLACEHOLDER_focus" }
    ],
        title: "focus.levels.calmAlertness.tips.0.title",
        taskInfo: {
          description: "focus.levels.calmAlertness.tips.0.description",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: supplementIds.lTheanine }],
      },
      {
        id: "level_focus_2_step1",
        level: 2,
        xp: 500,
        goals: [
      { id: "focus", description: "PLACEHOLDER_focus" }
    ],
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
        goals: [
      { id: "focus", description: "PLACEHOLDER_focus" }
    ],
        title: "focus.levels.nootropicStimulation.tips.0.title",
        taskInfo: {
          description: "focus.levels.nootropicStimulation.tips.0.description",
          duration: { amount: 7, unit: "days" },
        },
      },
    ],
  },

  // immuneSupport
  {
    id: "immuneSupport_optimization",
    title: "immuneSupport.levels.vitaminC.tips.0.title",
    tips: [
      {
        id: "level_immuneSupport_1_step1",
        level: 1,
        xp: 300,
        goals: [
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
    ],
        title: "immuneSupport.levels.vitaminC.tips.0.title",
        taskInfo: {
          description: "immuneSupport.levels.vitaminC.tips.0.description",
          duration: { amount: 5, unit: "days" },
        },
        supplements: [{ id: "vitaminC" }],
      },
      {
        id: "hydration_nutrition",
        level: 1,
        xp: 300,
        goals: [
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" },
      { id: "energy", description: "PLACEHOLDER_energy" },
      { id: "cardioFitness", description: "PLACEHOLDER_cardioFitness" }
    ],
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
        goals: [
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
    ],
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
        goals: [
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
    ],
        title: "immuneSupport.levels.glutathioneDetox.tips.0.title",
        taskInfo: {
          description: "immuneSupport.levels.glutathioneDetox.tips.0.description",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "nac" }],
      },
    ],
  },

  {
    id: "nervousSystem_optimization",
    title: "Optimize your nervous system",
    tips: [
      {
        id: "ashwagandha",
        level: 1,
        xp: 300,
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" }
    ],
        title: "nervousSystem.levels.ashwagandha.tips.0.title",
        taskInfo: {
          description: "nervousSystem.levels.ashwagandha.tips.0.description",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: "ashwagandha" }],
      },
      {
        id: "glycine",
        level: 2,
        xp: 500,
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" },
      { id: "energy", description: "PLACEHOLDER_energy" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" },
      { id: "energy", description: "PLACEHOLDER_energy" },
      { id: "cardioFitness", description: "PLACEHOLDER_cardioFitness" },
      { id: "sleepQuality", description: "PLACEHOLDER_sleepQuality" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" },
      { id: "energy", description: "PLACEHOLDER_energy" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" },
      { id: "energy", description: "PLACEHOLDER_energy" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" },
      { id: "energy", description: "PLACEHOLDER_energy" },
      { id: "cardioFitness", description: "PLACEHOLDER_cardioFitness" },
      { id: "musclePerformance", description: "PLACEHOLDER_musclePerformance" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" }
    ],
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
        goals: [
      { id: "nervousSystem", description: "PLACEHOLDER_nervousSystem" }
    ],
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
    ],
  },
  // musclePerformance
  {
    id: "musclePerformance_optimization",
    title: "musclePerformance.levels.basicSupport.tips.0.title",
    tips: [
      {
        id: "level_musclePerformance_1_step1",
        level: 1,
        xp: 300,
        goals: [
      { id: "musclePerformance", description: "PLACEHOLDER_musclePerformance" }
    ],
        title: "musclePerformance.levels.basicSupport.tips.0.title",
        taskInfo: {
          description: "musclePerformance.levels.basicSupport.tips.0.description",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "creatine" }],
      },
      {
        id: "motorUnitActivation_step1",
        level: 1,
        xp: 0,
        goals: [
      { id: "musclePerformance", description: "PLACEHOLDER_musclePerformance" }
    ],
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
        goals: [
      { id: "musclePerformance", description: "PLACEHOLDER_musclePerformance" }
    ],
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
        goals: [
      { id: "musclePerformance", description: "PLACEHOLDER_musclePerformance" }
    ],
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
        goals: [
      { id: "musclePerformance", description: "PLACEHOLDER_musclePerformance" }
    ],
        title: "musclePerformance.levels.androgenicEnhancers.tips.0.title",
        taskInfo: {
          description: "musclePerformance.levels.androgenicEnhancers.tips.0.description",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: "fadogia" }],
      },
    ],
  },

  // digestiveHealth
  {
    id: "digestiveHealth_optimization",
    title: "digestiveHealth.levels.gutFlora.tips.0.title",
    tips: [
      {
        id: "level_digestiveHealth_1_step1",
        level: 1,
        xp: 300,
        goals: [
      { id: "digestiveHealth", description: "PLACEHOLDER_digestiveHealth" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
    ],
        title: "digestiveHealth.levels.gutFlora.tips.0.title",
        taskInfo: {
          description: "digestiveHealth.levels.gutFlora.tips.0.description",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: "probiotics" }],
      },
      {
        id: "level_digestiveHealth_1_step2",
        level: 1,
        xp: 300,
        goals: [
      { id: "digestiveHealth", description: "PLACEHOLDER_digestiveHealth" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
    ],
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
        goals: [
      { id: "digestiveHealth", description: "PLACEHOLDER_digestiveHealth" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
    ],
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
        goals: [
      { id: "digestiveHealth", description: "PLACEHOLDER_digestiveHealth" },
      { id: "immuneSupport", description: "PLACEHOLDER_immuneSupport" }
    ],
        title: "digestiveHealth.levels.advancedGut.tips.0.title",
        taskInfo: {
          description: "digestiveHealth.levels.advancedGut.tips.0.description",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "tudca" }],
      },
    ],
  },

  // cardioFitness
  {
    id: "cardioFitness_optimization",
    title: "cardioFitness.levels.hiit.tips.0.title",
    tips: [
      {
        id: "level_cardioFitness_1_step1",
        level: 1,
        xp: 300,
        goals: [
      { id: "cardioFitness", description: "PLACEHOLDER_cardioFitness" }
    ],
        title: "cardioFitness.levels.hiit.tips.0.title",
        taskInfo: {
          description: "cardioFitness.levels.hiit.tips.0.description",
          duration: { amount: 2, unit: "weeks" },
        },
        supplements: [],
        analyzePrompt: "cardioFitness.levels.hiit.prompt",
      },
      {
        id: "level_cardioFitness_2_step1",
        level: 2,
        xp: 500,
        goals: [
      { id: "cardioFitness", description: "PLACEHOLDER_cardioFitness" }
    ],
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
        goals: [
      { id: "cardioFitness", description: "PLACEHOLDER_cardioFitness" }
    ],
        title: "cardioFitness.levels.vo2max.tips.0.title",
        taskInfo: {
          description: "cardioFitness.levels.vo2max.tips.0.description",
          duration: { amount: 4, unit: "weeks" },
        },
        supplements: [],
        analyzePrompt: "cardioFitness.levels.vo2max.prompt",
      },
    ],
  },
  {
    id: "mind_coherence_1",
    title: "mind.coherence.title",
    tips: [
      {
        id: "mind_coherence_1_step1",
        goals: [
      { id: "mind", description: "PLACEHOLDER_mind" }
    ],
        level: 1,
        xp: 300,
        title: "mind.levels.coherence.tips.0.title",
        taskInfo: {
          description: "mind.levels.coherence.tips.0.description", // t.ex. “Genomför en hel session i ett svep…”
          duration: { amount: 1, unit: "time" },
          tasks: [
            "mind.levels.coherence.tips.0.tasks.task1",  // “Mät HRV och puls med klocka eller band”
            "mind.levels.coherence.tips.0.tasks.task2",  // “Utför en sammanhängande mätning varje dag”
            "mind.levels.coherence.tips.0.tasks.task3",  // “Försök vara så stilla som möjligt”
          ]              // kör testet flera dagar i rad
        },
        //startPrompt: "mind.levels.coherence.tips.0.startPrompt",       // “Starta en sammanhängande mätning…”
        analyzePrompt: "mind.levels.coherence.tips.0.analyzePrompt",   // “Analysera HRV/puls per stegsegment…”
        information: {
          text: "mind.levels.coherence.tips.0.information.text",              // vad heart–brain coherence är, tolkning etc
          author: "Christina",
        },
        // Inga supplement för “mind” som default
      },
    ],
  }
];

export const tips: Tip[] = legacyTipCategories.flatMap((category) =>
  (category.tips ?? []).map((tip) => {
    const { mainGoalIds, ...rest } = tip;
    return {
      ...rest,
      goals: mainGoalIds.map((id) => ({ id, description: tip.taskInfo.description })),
    } as Tip;
  })
);