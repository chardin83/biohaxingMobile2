import { supplementIds } from "./supplementIds";

type SupplementReference = {
    id: string;
};

type TaskInfo = {
    instructions: string;
    warning?: string;
    duration: {
        amount: number;
        unit: "days" | "weeks" | "months" | "time";
    };
    tasks?: string[];
};

export type GoalStep = {
  id: string;
  title: string;
  taskInfo: TaskInfo;
  supplements?: SupplementReference[];
  analyzePrompt?: string;
  startPrompt?: string;
  information?: Information;
};

export type Goal = {
  id: string;
  level: number;
  xp: number;
  title: string;
  mainGoalIds: string[];
  steps?: GoalStep[];           // NYTT: Flerstegsstruktur
};

export type Information = {
    text: string;
    author: string;
}

export const goals: Goal[] = [
  {
    id: "level_energy_1",
    level: 1,
    xp: 300,
    title: "energy.levels.generalHealth.steps.step1.title",
    mainGoalIds: ["energy"],
    steps: [
      {
        id: "level_energy_1_step1",
        title: "energy.levels.generalHealth.steps.step1.title",
        taskInfo: {
          instructions: "energy.levels.generalHealth.steps.step1.instructions",
          duration: { amount: 6, unit: "days" },
        },
        supplements: [{ id: "multivitamin" }],
        startPrompt: "energy.levels.generalHealth.startPrompt",
        information: {
          text: "energy.levels.generalHealth.steps.step1.information.text",
          author: "Christina",
        },
      },
    ],
  },
  {
    id: "vitaminD_comprehensive",
    level: 3,
    xp: 900,
    title: "energy.levels.vitaminDComprehensive.title",
    mainGoalIds: ["energy", "immuneSupport"],
    steps: [
      {
        id: "step1_test",
        title: "energy.levels.vitaminDComprehensive.steps.step1.title",
        taskInfo: {
          instructions:
            "energy.levels.vitaminDComprehensive.steps.step1.instructions",
          duration: { amount: 2, unit: "days" },
        },
        startPrompt:
          "energy.levels.vitaminDComprehensive.steps.step1.startPrompt",
        information: {
          text: "energy.levels.vitaminDComprehensive.steps.step1.information.text",
          author: "Christina",
        },
      },
      {
        id: "step2_interpret",
        title: "energy.levels.vitaminDComprehensive.steps.step2.title",
        taskInfo: {
          instructions:
            "energy.levels.vitaminDComprehensive.steps.step2.instructions",
          duration: { amount: 3, unit: "days" },
        },
        analyzePrompt: "energy.levels.vitaminDComprehensive.steps.step2.analyzePrompt",
        information: {
          text: "energy.levels.vitaminDComprehensive.steps.step2.information.text",
          author: "Christina",
        },
      },
      {
        id: "step3_genetics",
        title: "energy.levels.vitaminDComprehensive.steps.step3.title",
        taskInfo: {
          instructions:
            "energy.levels.vitaminDComprehensive.steps.step3.instructions",
          duration: { amount: 7, unit: "days" },
        },
        information: {
          text: "energy.levels.vitaminDComprehensive.steps.step3.information.text",
          author: "Christina",
        },
      },
    ],
  },
  {
    id: "level_energy_3",
    level: 3,
    xp: 700,
    title: "energy.levels.mitochondrialSupport.steps.step1.title",
    mainGoalIds: ["energy"],
    steps: [
      {
        id: "level_energy_3_step1",
        title: "energy.levels.mitochondrialSupport.steps.step1.title",
        taskInfo: {
          instructions: "energy.levels.mitochondrialSupport.steps.step1.instructions",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "coenzymeQ10" }],
        startPrompt: "energy.levels.mitochondrialSupport.startPrompt",
        information: {
          text: "energy.levels.mitochondrialSupport.steps.step1.information.text",
          author: "Christina",
        },
      },
    ],
  },
  {
    id: "level_energy_4",
    level: 4,
    xp: 900,
    title: "energy.levels.cellularEnergy.steps.step1.title",
    mainGoalIds: ["energy"],
    steps: [
      {
        id: "level_energy_4_step1",
        title: "energy.levels.cellularEnergy.steps.step1.title",
        taskInfo: {
          instructions: "energy.levels.cellularEnergy.steps.step1.instructions",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "nad" }],
        startPrompt: "energy.levels.cellularEnergy.startPrompt",
        information: {
          text: "energy.levels.cellularEnergy.steps.step1.information.text",
          author: "Christina",
        },
      },
    ],
  },
  {
    id: "level_energy_5",
    level: 5,
    xp: 1100,
    title: "energy.levels.metabolicActivation.steps.step1.title",
    mainGoalIds: ["energy"],
    steps: [
      {
        id: "level_energy_5_step1",
        title: "energy.levels.metabolicActivation.steps.step1.title",
        taskInfo: {
          instructions: "energy.levels.metabolicActivation.steps.step1.instructions",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "alphaLipoicAcid" }],
        startPrompt: "energy.levels.metabolicActivation.startPrompt",
        information: {
          text: "energy.levels.metabolicActivation.steps.step1.information.text",
          author: "Christina",
        },
      },
    ],
  },
  {
    id: "level_energy_6",
    level: 6,
    xp: 1300,
    title: "energy.levels.longevity.steps.step1.title",
    mainGoalIds: ["energy", "musclePerformance"],
    steps: [
      {
        id: "level_energy_6_step1",
        title: "energy.levels.longevity.steps.step1.title",
        taskInfo: {
          instructions: "energy.levels.longevity.steps.step1.instructions",
          duration: { amount: 30, unit: "days" },
        },
        supplements: [{ id: "shilajit" }],
        startPrompt: "energy.levels.longevity.startPrompt",
        information: {
          text: "energy.levels.longevity.steps.step1.information.text",
          author: "Christina",
        },
      },
    ],
  },

  // sleepQuality
  {
    id: "level_sleepQuality_1",
    level: 1,
    xp: 300,
    title: "sleepQuality.levels.sleepBy2230.steps.step1.title",
    mainGoalIds: ["sleepQuality"],
    steps: [
      {
        id: "level_sleepQuality_1_step1",
        title: "sleepQuality.levels.sleepBy2230.steps.step1.title",
        taskInfo: {
          instructions: "sleepQuality.levels.sleepBy2230.steps.step1.instructions",
          duration: { amount: 7, unit: "days" },
        },
      },
    ],
  },
  {
    id: "level_sleepQuality_2",
    level: 2,
    xp: 500,
    title: "sleepQuality.levels.hormonalSupport.steps.step1.title",
    mainGoalIds: ["sleepQuality"],
    steps: [
      {
        id: "level_sleepQuality_2_step1",
        title: "sleepQuality.levels.hormonalSupport.steps.step1.title",
        taskInfo: {
          instructions: "sleepQuality.levels.hormonalSupport.steps.step1.instructions",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: supplementIds.magnesium }],
      },
    ],
  },
  {
    id: "level_sleepQuality_3",
    level: 3,
    xp: 700,
    title: "sleepQuality.levels.neuroregulation.steps.step1.title",
    mainGoalIds: ["sleepQuality", "focus"],
    steps: [
      {
        id: "level_sleepQuality_3_step1",
        title: "sleepQuality.levels.neuroregulation.steps.step1.title",
        taskInfo: {
          instructions: "sleepQuality.levels.neuroregulation.steps.step1.instructions",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: supplementIds.lTheanine }],
      },
    ],
  },

  // focus
  {
    id: "level_focus_1",
    level: 1,
    xp: 300,
    title: "focus.levels.calmAlertness.steps.step1.title",
    mainGoalIds: ["focus"],
    steps: [
      {
        id: "level_focus_1_step1",
        title: "focus.levels.calmAlertness.steps.step1.title",
        taskInfo: {
          instructions: "focus.levels.calmAlertness.steps.step1.instructions",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: supplementIds.lTheanine }],
      },
    ],
  },
  {
    id: "level_focus_2",
    level: 2,
    xp: 500,
    title: "focus.levels.neurotransmitterSupport.steps.step1.title",
    mainGoalIds: ["focus"],
    steps: [
      {
        id: "level_focus_2_step1",
        title: "focus.levels.neurotransmitterSupport.steps.step1.title",
        taskInfo: {
          instructions: "focus.levels.neurotransmitterSupport.steps.step1.instructions",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: supplementIds.lTyrosine }],
      },
    ],
  },
  {
    id: "level_focus_3",
    level: 3,
    xp: 700,
    title: "focus.levels.nootropicStimulation.steps.step1.title",
    mainGoalIds: ["focus"],
    steps: [
      {
        id: "level_focus_3_step1",
        title: "focus.levels.nootropicStimulation.steps.step1.title",
        taskInfo: {
          instructions: "focus.levels.nootropicStimulation.steps.step1.instructions",
          duration: { amount: 7, unit: "days" },
        },
      },
    ],
  },

  // immuneSupport
  {
    id: "level_immuneSupport_1",
    level: 1,
    xp: 300,
    title: "immuneSupport.levels.vitaminC.steps.step1.title",
    mainGoalIds: ["immuneSupport"],
    steps: [
      {
        id: "level_immuneSupport_1_step1",
        title: "immuneSupport.levels.vitaminC.steps.step1.title",
        taskInfo: {
          instructions: "immuneSupport.levels.vitaminC.steps.step1.instructions",
          duration: { amount: 5, unit: "days" },
        },
        supplements: [{ id: "vitaminC" }],
      },
    ],
  },
  {
    id: "level_immuneSupport_2",
    level: 2,
    xp: 500,
    title: "immuneSupport.levels.naturalImmunity.steps.step1.title",
    mainGoalIds: ["immuneSupport"],
    steps: [
      {
        id: "level_immuneSupport_2_step1",
        title: "immuneSupport.levels.naturalImmunity.steps.step1.title",
        taskInfo: {
          instructions: "immuneSupport.levels.naturalImmunity.steps.step1.instructions",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: "echinacea" }],
      },
    ],
  },
  {
    id: "level_immuneSupport_3",
    level: 3,
    xp: 700,
    title: "immuneSupport.levels.glutathioneDetox.steps.step1.title",
    mainGoalIds: ["immuneSupport"],
    steps: [
      {
        id: "level_immuneSupport_3_step1",
        title: "immuneSupport.levels.glutathioneDetox.steps.step1.title",
        taskInfo: {
          instructions: "immuneSupport.levels.glutathioneDetox.steps.step1.instructions",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "nac" }],
      },
    ],
  },

  // stressRelief
  {
    id: "level_stressRelief_1",
    level: 1,
    xp: 300,
    title: "stressRelief.levels.ashwagandha.steps.step1.title",
    mainGoalIds: ["stressRelief"],
    steps: [
      {
        id: "level_stressRelief_1_step1",
        title: "stressRelief.levels.ashwagandha.steps.step1.title",
        taskInfo: {
          instructions: "stressRelief.levels.ashwagandha.steps.step1.instructions",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: "ashwagandha" }],
      },
    ],
  },
  {
    id: "level_stressRelief_2",
    level: 2,
    xp: 500,
    title: "stressRelief.levels.glycine.steps.step1.title",
    mainGoalIds: ["stressRelief"],
    steps: [
      {
        id: "level_stressRelief_2_step1",
        title: "stressRelief.levels.glycine.steps.step1.title",
        taskInfo: {
          instructions: "stressRelief.levels.glycine.steps.step1.instructions",
          duration: { amount: 10, unit: "days" },
        },
        supplements: [{ id: "glycine" }],
      },
    ],
  },
  {
    id: "level_stressRelief_3",
    level: 3,
    xp: 700,
    title: "stressRelief.levels.neurochemicalSupport.steps.step1.title",
    mainGoalIds: ["stressRelief"],
    steps: [
      {
        id: "level_stressRelief_3_step1",
        title: "stressRelief.levels.neurochemicalSupport.steps.step1.title",
        taskInfo: {
          instructions: "stressRelief.levels.neurochemicalSupport.steps.step1.instructions",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: "semax" }],
      },
    ],
  },

  // musclePerformance
  {
    id: "level_musclePerformance_1",
    level: 1,
    xp: 300,
    title: "musclePerformance.levels.basicSupport.steps.step1.title",
    mainGoalIds: ["musclePerformance"],
    steps: [
      {
        id: "level_musclePerformance_1_step1",
        title: "musclePerformance.levels.basicSupport.steps.step1.title",
        taskInfo: {
          instructions: "musclePerformance.levels.basicSupport.steps.step1.instructions",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "creatine" }],
      },
    ],
  },
  {
    id: "motorUnitActivation",
    level: 1,
    xp: 0,
    title: "Aktivera fler motorenheter",
    mainGoalIds: ["musclePerformance"],
    steps: [
      {
        id: "motorUnitActivation_step1",
        title: "Aktivera fler motorenheter",
        taskInfo: {
          instructions: "musclePerformance.levels.basicSupport.steps.step1.instructions",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [],
      },
    ],
  },
  {
    id: "level_musclePerformance_2",
    level: 2,
    xp: 500,
    title: "musclePerformance.levels.enduranceRecovery.steps.step1.title",
    mainGoalIds: ["musclePerformance"],
    steps: [
      {
        id: "level_musclePerformance_2_step1",
        title: "musclePerformance.levels.enduranceRecovery.steps.step1.title",
        taskInfo: {
          instructions: "musclePerformance.levels.enduranceRecovery.steps.step1.instructions",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "betaAlanine" }],
      },
    ],
  },
  {
    id: "level_musclePerformance_3",
    level: 3,
    xp: 700,
    title: "musclePerformance.levels.hormonalBoosters.steps.step1.title",
    mainGoalIds: ["musclePerformance"],
    steps: [
      {
        id: "level_musclePerformance_3_step1",
        title: "musclePerformance.levels.hormonalBoosters.steps.step1.title",
        taskInfo: {
          instructions: "musclePerformance.levels.hormonalBoosters.steps.step1.instructions",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "shilajit" }],
      },
    ],
  },
  {
    id: "level_musclePerformance_4",
    level: 4,
    xp: 900,
    title: "musclePerformance.levels.androgenicEnhancers.steps.step1.title",
    mainGoalIds: ["musclePerformance"],
    steps: [
      {
        id: "level_musclePerformance_4_step1",
        title: "musclePerformance.levels.androgenicEnhancers.steps.step1.title",
        taskInfo: {
          instructions: "musclePerformance.levels.androgenicEnhancers.steps.step1.instructions",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: "fadogia" }],
      },
    ],
  },

  // digestiveHealth
  {
    id: "level_digestiveHealth_1",
    level: 1,
    xp: 300,
    title: "digestiveHealth.levels.gutFlora.steps.step1.title",
    mainGoalIds: ["digestiveHealth"],
    steps: [
      {
        id: "level_digestiveHealth_1_step1",
        title: "digestiveHealth.levels.gutFlora.steps.step1.title",
        taskInfo: {
          instructions: "digestiveHealth.levels.gutFlora.steps.step1.instructions",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: "probiotics" }],
      },
      {
        id: "level_digestiveHealth_1_step2",
        title: "digestiveHealth.levels.gutFlora.steps.step2.title",
        taskInfo: {
          instructions: "digestiveHealth.levels.gutFlora.steps.step2.instructions",
          warning: "digestiveHealth.levels.gutFlora.steps.step2.warning",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: "probiotics" }],
      },
    ],
  },
  {
    id: "level_digestiveHealth_2",
    level: 2,
    xp: 500,
    title: "digestiveHealth.levels.liverEnzymes.steps.step1.title",
    mainGoalIds: ["digestiveHealth"],
    steps: [
      {
        id: "level_digestiveHealth_2_step1",
        title: "digestiveHealth.levels.liverEnzymes.steps.step1.title",
        taskInfo: {
          instructions: "digestiveHealth.levels.liverEnzymes.steps.step1.instructions",
          duration: { amount: 14, unit: "days" },
        },
        supplements: [{ id: "milkThistle" }],
      },
    ],
  },
  {
    id: "level_digestiveHealth_3",
    level: 3,
    xp: 700,
    title: "digestiveHealth.levels.advancedGut.steps.step1.title",
    mainGoalIds: ["digestiveHealth"],
    steps: [
      {
        id: "level_digestiveHealth_3_step1",
        title: "digestiveHealth.levels.advancedGut.steps.step1.title",
        taskInfo: {
          instructions: "digestiveHealth.levels.advancedGut.steps.step1.instructions",
          duration: { amount: 21, unit: "days" },
        },
        supplements: [{ id: "tudca" }],
      },
    ],
  },

  // cardioFitness
  {
    id: "level_cardioFitness_1",
    level: 1,
    xp: 300,
    title: "cardioFitness.levels.hiit.steps.step1.title",
    mainGoalIds: ["cardioFitness"],
    steps: [
      {
        id: "level_cardioFitness_1_step1",
        title: "cardioFitness.levels.hiit.steps.step1.title",
        taskInfo: {
          instructions: "cardioFitness.levels.hiit.steps.step1.instructions",
          duration: { amount: 2, unit: "weeks" },
        },
        supplements: [],
        analyzePrompt: "cardioFitness.levels.hiit.prompt",
      },
    ],
  },
  {
    id: "level_cardioFitness_2",
    level: 2,
    xp: 500,
    title: "cardioFitness.levels.runningVolume.steps.step1.title",
    mainGoalIds: ["cardioFitness"],
    steps: [
      {
        id: "level_cardioFitness_2_step1",
        title: "cardioFitness.levels.runningVolume.steps.step1.title",
        taskInfo: {
          instructions: "cardioFitness.levels.runningVolume.steps.step1.instructions",
          duration: { amount: 3, unit: "weeks" },
        },
        supplements: [],
        analyzePrompt: "cardioFitness.levels.runningVolume.analyzePrompt",
      },
    ],
  },
  {
    id: "level_cardioFitness_3",
    level: 3,
    xp: 700,
    title: "cardioFitness.levels.vo2max.steps.step1.title",
    mainGoalIds: ["cardioFitness"],
    steps: [
      {
        id: "level_cardioFitness_3_step1",
        title: "cardioFitness.levels.vo2max.steps.step1.title",
        taskInfo: {
          instructions: "cardioFitness.levels.vo2max.steps.step1.instructions",
          duration: { amount: 4, unit: "weeks" },
        },
        supplements: [],
        analyzePrompt: "cardioFitness.levels.vo2max.prompt",
      },
    ],
  },
  {
    id: "mind_coherence_1",
    level: 1,
    xp: 300,
    title: "mind.coherence.title",
    mainGoalIds: ["mind"],
    steps: [
      {
        id: "mind_coherence_1_step1",
        title: "mind.levels.coherence.steps.step1.title",
        taskInfo: {
          instructions: "mind.levels.coherence.steps.step1.instructions", // t.ex. “Genomför en hel session i ett svep…”
          duration: { amount: 1, unit: "time" },
          tasks: [
            "mind.levels.coherence.steps.step1.tasks.task1",  // “Mät HRV och puls med klocka eller band”
            "mind.levels.coherence.steps.step1.tasks.task2",  // “Utför en sammanhängande mätning varje dag”
            "mind.levels.coherence.steps.step1.tasks.task3",  // “Försök vara så stilla som möjligt”
          ]              // kör testet flera dagar i rad
        },
        //startPrompt: "mind.levels.coherence.steps.step1.startPrompt",       // “Starta en sammanhängande mätning…”
        analyzePrompt: "mind.levels.coherence.steps.step1.analyzePrompt",   // “Analysera HRV/puls per stegsegment…”
        information: {
          text: "mind.levels.coherence.steps.step1.information.text",              // vad heart–brain coherence är, tolkning etc
          author: "Christina",
        },
        // Inga supplement för “mind” som default
      },
    ],
  }
];