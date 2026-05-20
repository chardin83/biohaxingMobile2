import { type NutritionTargetUnit } from '@/types/nutritionTargets';

export type NutritionMedalType = 'gold' | 'silver' | 'bronze';

type NutritionMedalInput = {
  actual: number;
  targetAmount: number;
  foodActual?: number;
  unit?: NutritionTargetUnit;
};

export const getNutritionTargetMedalType = ({
  actual,
  targetAmount,
  foodActual = 0,
  unit,
}: NutritionMedalInput): NutritionMedalType | null => {
  if (targetAmount <= 0 || actual < targetAmount) return null;

  if (unit && unit !== 'g' && unit !== 'mg') return 'gold';

  const foodPercentOfGoal = (foodActual / targetAmount) * 100;

  if (foodPercentOfGoal >= 80) return 'gold';
  if (foodPercentOfGoal >= 50) return 'silver';
  return 'bronze';
};

export const getNutritionTargetMedalEmoji = (
  medalType: NutritionMedalType | null
): string => {
  if (medalType === 'gold') return '🥇';
  if (medalType === 'silver') return '🥈';
  if (medalType === 'bronze') return '🥉';
  return '';
};