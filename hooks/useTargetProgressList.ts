import { useMemo } from 'react';

import {
  useStorage,
} from '@/app/context/StorageContext';
import {
  getTargetProgress,
} from '@/services/targetProgress/targetProgress';
import {
  TargetDefinition,
} from '@/services/targetProgress/targetProgressTypes';

export const useTargetProgressList = <
  T extends TargetDefinition
>(
  targets: T[],
  selectedDate: string
) => {
  const {
    dailyNutritionSummaries,
    trainingEntries,
    metricEntries,
    weeklyTracking,
  } = useStorage();

  return useMemo(() => {
    const storage = {
      dailyNutritionSummaries,
      trainingEntries,
      metricEntries,
      weeklyTracking,
    };

    return targets.map(target => ({
      ...target,
      progress:
        getTargetProgress({
          target,
          selectedDate,
          storage,
        }),
    }));
  }, [
    targets,
    selectedDate,
    dailyNutritionSummaries,
    trainingEntries,
    metricEntries,
    weeklyTracking,
  ]);
};