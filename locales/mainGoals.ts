// mainGoals.ts
export type MainGoal = {
  id: string;
  instructions: string;
  icon: string;
};

export const mainGoals: MainGoal[] = [
  { id: "energy", instructions: "energy.description", icon: "flash" },
  { id: "sleepQuality", instructions: "sleepQuality.description", icon: "sleep" },
  { id: "focus", instructions: "focus.description", icon: "eye" },
  { id: "immuneSupport", instructions: "immuneSupport.description", icon: "shield-check" },
  { id: "nervousSystem", instructions: "nervousSystem.description", icon: "emoticon-neutral" },
  { id: "musclePerformance", instructions: "musclePerformance.description", icon: "arm-flex" },
  { id: "digestiveHealth", instructions: "digestiveHealth.description", icon: "food-apple" },
  { id: "cardioFitness", instructions: "cardioFitness.description", icon: "heart-pulse" },
  { id: "mind", instructions: "mind.description", icon: "heart-pulse" },
];
