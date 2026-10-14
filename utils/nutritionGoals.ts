import type { NutritionDistribution } from '@/app/context/storage/userProfile/userProfileTypes';

import { fromDateKey, getAge } from './dateUtils';

export const DEFAULT_GOALS = { protein: 75, carbohydrates: 275, fat: 67 };
export const MIN_PROTEIN_PER_KG = 0.83;
export const SENIOR_MIN_PROTEIN_PER_KG = 1.5;

function hasSeniorProteinTargets(birthDate?: string, today = new Date()): boolean {
  if (!birthDate) return false;
  const birthday = fromDateKey(birthDate.slice(0, 10));
  return Number.isFinite(birthday.getTime()) && birthday <= today && getAge(birthday, today) >= 65;
}

export function minimumProteinGoal(weightKg?: number, birthDate?: string, today = new Date()): number {
  const gramsPerKg = hasSeniorProteinTargets(birthDate, today) ? SENIOR_MIN_PROTEIN_PER_KG : MIN_PROTEIN_PER_KG;
  return typeof weightKg === 'number' && Number.isFinite(weightKg) && weightKg > 0 ? Math.ceil(weightKg * gramsPerKg) : 0;
}
export const MACROS = [
  { key: 'protein', icon: 'protein', caloriesPerGram: 4, color: '#6C9EFF' },
  { key: 'carbohydrates', icon: 'carbs', caloriesPerGram: 4, color: '#E6AE54' },
  { key: 'fat', icon: 'fat', caloriesPerGram: 9, color: '#A58AE6' },
] as const;
export const DISTRIBUTIONS = {
  balanced: { protein: 15, carbohydrates: 55, fat: 30 },
  lowCarb: { protein: 15, carbohydrates: 20, fat: 65 },
  ketogenic: { protein: 15, carbohydrates: 5, fat: 80 },
  lowFat: { protein: 15, carbohydrates: 65, fat: 20 },
};
export const DISTRIBUTION_CHOICES: NutritionDistribution[] = ['balanced', 'lowCarb', 'ketogenic', 'lowFat', 'custom'];

export function distributionForAge(distribution: Exclude<NutritionDistribution, 'custom'>, birthDate?: string, today = new Date()) {
  const percentages = DISTRIBUTIONS[distribution];
  if (!hasSeniorProteinTargets(birthDate, today)) return percentages;
  const reduceFat = distribution === 'lowCarb' || distribution === 'ketogenic';
  return {
    protein: 18,
    carbohydrates: percentages.carbohydrates - (reduceFat ? 0 : 3),
    fat: percentages.fat - (reduceFat ? 3 : 0),
  };
}

export function goalsForDistribution(distribution: Exclude<NutritionDistribution, 'custom'>, energy: number, weightKg?: number, birthDate?: string, today = new Date()) {
  const percentages = distributionForAge(distribution, birthDate, today);
  const energyProtein = Math.round((energy * percentages.protein) / 100 / 4);
  const protein = Math.max(energyProtein, minimumProteinGoal(weightKg, birthDate, today));
  const energyCarbohydrates = Math.round((energy * percentages.carbohydrates) / 100 / 4);
  const extraProtein = protein - energyProtein;
  const remainingExtraEnergy = Math.max(0, extraProtein - energyCarbohydrates) * 4;
  return {
    protein,
    carbohydrates: Math.max(0, energyCarbohydrates - extraProtein),
    fat: Math.max(0, Math.round(((energy * percentages.fat) / 100 - remainingExtraEnergy) / 9)),
  };
}
