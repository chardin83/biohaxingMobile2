import type { NutritionDistribution } from '@/app/context/storage/userProfile/userProfileTypes';

export const DEFAULT_GOALS = { protein: 100, carbohydrates: 250, fat: 67 };
export const MACROS = [
  { key: 'protein', icon: 'protein', caloriesPerGram: 4, color: '#6C9EFF' },
  { key: 'carbohydrates', icon: 'carbs', caloriesPerGram: 4, color: '#E6AE54' },
  { key: 'fat', icon: 'fat', caloriesPerGram: 9, color: '#A58AE6' },
] as const;
export const DISTRIBUTIONS = {
  balanced: { protein: 20, carbohydrates: 50, fat: 30 },
  lowCarb: { protein: 30, carbohydrates: 20, fat: 50 },
  ketogenic: { protein: 20, carbohydrates: 5, fat: 75 },
  lowFat: { protein: 25, carbohydrates: 55, fat: 20 },
};
export const DISTRIBUTION_CHOICES: NutritionDistribution[] = ['balanced', 'lowCarb', 'ketogenic', 'lowFat', 'custom'];

export function goalsForDistribution(distribution: Exclude<NutritionDistribution, 'custom'>, energy: number) {
  const percentages = DISTRIBUTIONS[distribution];
  return {
    protein: Math.round((energy * percentages.protein) / 100 / 4),
    carbohydrates: Math.round((energy * percentages.carbohydrates) / 100 / 4),
    fat: Math.round((energy * percentages.fat) / 100 / 9),
  };
}
