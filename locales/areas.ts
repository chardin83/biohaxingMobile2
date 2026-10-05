// areas.ts
export type RelatedAreaLink = {
  areaId: string;
};

export type Area = {
  id: string;
  title: string;
  description: string;
  icon: string;
  relatedAreas?: RelatedAreaLink[];
};

export const areas: Area[] = [
  { id: 'energy', title: 'energy.title', description: 'energy.description', icon: 'flash' },
  { id: 'sleepQuality', title: 'sleepQuality.title', description: 'sleepQuality.description', icon: 'sleep', relatedAreas: [{ areaId: 'nervousSystem' }, { areaId: 'digestiveHealth' }, { areaId: 'energy' }] },
  { id: 'longevity', title: 'longevity.title', description: 'longevity.description', icon: 'infinity' },
  { id: 'mind', title: 'mind.title', description: 'mind.description', icon: 'target' },
  { id: 'immuneSupport', title: 'immuneSupport.title', description: 'immuneSupport.description', icon: 'shield-check' },
  { id: 'cardioFitness', title: 'cardioFitness.title', description: 'cardioFitness.description', icon: 'heart-pulse', relatedAreas: [{ areaId: 'digestiveHealth' }, { areaId: 'nervousSystem' }, { areaId: 'sleepQuality' }] },
  { id: 'digestiveHealth', title: 'digestiveHealth.title', description: 'digestiveHealth.description', icon: 'food-apple', relatedAreas: [{ areaId: 'nervousSystem' }, { areaId: 'immuneSupport' }, { areaId: 'cardioFitness' }] },
  { id: 'strength', title: 'strength.title', description: 'strength.description', icon: 'arm-flex' },
  { id: 'nervousSystem', title: 'nervousSystem.title', description: 'nervousSystem.description', icon: 'emoticon-neutral' },
];
