// areas.ts
export type Area = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const areas: Area[] = [
  { id: 'energy', title: 'energy.title', description: 'energy.description', icon: 'flash' },
  { id: 'sleepQuality', title: 'sleepQuality.title', description: 'sleepQuality.description', icon: 'sleep' },
  { id: 'mind', title: 'mind.title', description: 'mind.description', icon: 'target' },
  { id: 'immuneSupport', title: 'immuneSupport.title', description: 'immuneSupport.description', icon: 'shield-check' },
  { id: 'cardioFitness', title: 'cardioFitness.title', description: 'cardioFitness.description', icon: 'heart-pulse' },
  { id: 'digestiveHealth', title: 'digestiveHealth.title', description: 'digestiveHealth.description', icon: 'food-apple' },
  { id: 'strength', title: 'strength.title', description: 'strength.description', icon: 'arm-flex' },
  { id: 'nervousSystem', title: 'nervousSystem.title', description: 'nervousSystem.description', icon: 'emoticon-neutral' },
];
