import { useMemo } from 'react';

import { useStorage } from '@/app/context/StorageContext';
import {
  getTargetProgress,
} from '@/services/targetProgress/targetProgress';
import {
  TargetDefinition,
} from '@/services/targetProgress/targetProgressTypes';

export const useTargetProgress = (
  target: TargetDefinition,
  selectedDate: string
) => {
  const {
    dailyNutritionSummaries,
    trainingEntries,
    metricEntries,
    weeklyTracking,
  } = useStorage();

  return useMemo(
    () =>
      getTargetProgress({
        target,
        selectedDate,
        storage: {
          dailyNutritionSummaries,
          trainingEntries,
          metricEntries,
          weeklyTracking,
        },
      }),
    [
      target,
      selectedDate,
      dailyNutritionSummaries,
      trainingEntries,
      metricEntries,
      weeklyTracking,
    ]
  );
};