import type { DailyHabitTracking } from '@/app/context/storage/habits/habitTypes';
import { DailyNutritionTracking, WeeklyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';
import type { DailyTrainingTracking } from '@/app/context/storage/training/trainingTypes';
import { SupplementTime } from '@/app/domain/SupplementTime';

import { resolveHabitTarget } from './habitTargetProgress';
import { resolveNutritionTarget } from './nutritionTargetProgress';
import type { TargetDefinition, TargetProgress } from './targetProgressTypes';
import { resolveTrainingTarget } from './trainingTargetProgress';

export type TargetProgressStorage = {
  dailyNutritionTracking: DailyNutritionTracking;

  weeklyNutritionTracking: WeeklyNutritionTracking;

  dailyHabitTracking: DailyHabitTracking;

  dailyTrainingTracking: DailyTrainingTracking;

  takenDates: Record<string, SupplementTime[]>;
};

export const getTargetProgress = ({
  target,
  selectedDate,
  storage,
}: {
  target: TargetDefinition;
  selectedDate: string;
  storage: TargetProgressStorage;
}): TargetProgress => {
  let current = 0;

  switch (target.source) {
    case 'nutrition':
      current = resolveNutritionTarget({
        target,
        selectedDate,
        dailyNutritionTracking: storage.dailyNutritionTracking,
        weeklyNutritionTracking: storage.weeklyNutritionTracking,
        takenDates: storage.takenDates,
      });
      break;

    case 'training':
      current = resolveTrainingTarget({
        target,
        selectedDate,
        dailyTrainingTracking: storage.dailyTrainingTracking,
      });
      break;

    case 'habit':
      current = resolveHabitTarget({
        target,
        selectedDate,
        dailyHabitTracking: storage.dailyHabitTracking,
      });
      break;
  }

  return {
    current,
    target: target.amount,
    unit: target.unit,
    isFulfilled: current >= target.amount,
  };
};
