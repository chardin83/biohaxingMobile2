import {
  useMemo,
} from 'react';

import {
  useStorage,
} from '@/app/context/StorageContext';
import {
  getTargetProgress,
} from '@/services/targetProgress/targetProgressService';
import type {
  TargetDefinition,
  TargetProgress,
} from '@/services/targetProgress/targetProgressTypes';

export const useTargetProgressList = <
  T extends TargetDefinition
>(
  targets: T[],
  selectedDate: string
): Array<
  T & {
    progress: TargetProgress;
  }
> => {
  const {
    dailyNutritionTracking,
    weeklyNutritionTracking,
    dailyTrainingTracking,
    dailyHabitTracking,
  } = useStorage();

  return useMemo(() => {
    const storage = {
      dailyNutritionTracking,
      weeklyNutritionTracking,
      dailyTrainingTracking,
      dailyHabitTracking,
    };

    return targets.map(target => ({
      ...target,

      progress: getTargetProgress({
        target,
        selectedDate,
        storage,
      }),
    }));
  }, [
    targets,
    selectedDate,
    dailyNutritionTracking,
    weeklyNutritionTracking,
    dailyTrainingTracking,
    dailyHabitTracking,
  ]);
};