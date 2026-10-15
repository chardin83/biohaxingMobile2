import type { DailyHabitTracking } from '@/app/context/storage/habits/habitTypes';
import type { LifeStyleLog } from '@/app/context/storage/lifeStyle/lifeStyleTypes';
import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import { DailyNutritionTracking, WeeklyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';
import type { DailyTrainingTracking } from '@/app/context/storage/training/trainingTypes';
import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { SupplementTime } from '@/app/domain/SupplementTime';

import { resolveHabitTarget } from './habitTargetProgress';
import { resolveNutritionTarget } from './nutritionTargetProgress';
import type { TargetDefinition, TargetProgress } from './targetProgressTypes';
import { resolveTrainingTarget } from './trainingTargetProgress';

export type TargetProgressStorage = {
  lifeStyleLog?: LifeStyleLog;
  metricEntries?: MetricEntry[];
  userProfile?: UserProfile;
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
        lifeStyleLog: storage.lifeStyleLog,
      });
      break;
  }

  const savedHabitResult = target.source === 'habit' ? storage.dailyHabitTracking[selectedDate]?.[target.trackingKey] : undefined;
  const useSavedHabitResult = target.source === 'habit' && target.period === 'daily' && (!target.lifeStyleKeys || savedHabitResult?.source === 'lifeStyle');
  return {
    current,
    target:
      useSavedHabitResult
        ? (storage.dailyHabitTracking[selectedDate]?.[target.trackingKey]?.targetAmount ?? target.amount)
        : target.amount,
    unit: target.unit,
    isFulfilled:
      useSavedHabitResult
        ? (storage.dailyHabitTracking[selectedDate]?.[target.trackingKey]?.isFulfilled ?? current >= target.amount)
        : current >= target.amount,
  };
};
