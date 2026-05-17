export type NutritionMedalType = 'gold' | 'silver' | 'bronze';

type NutritionMedalInput = {
  actual: number;
  targetAmount: number;
  foodActual?: number;
};

export const getNutritionTargetMedalType = ({
  actual,
  targetAmount,
  foodActual = 0,
}: NutritionMedalInput): NutritionMedalType | null => {
  if (targetAmount <= 0 || actual < targetAmount) return null;

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