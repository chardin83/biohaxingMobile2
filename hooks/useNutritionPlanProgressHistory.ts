import React from 'react';

import { useStorage } from '@/app/context/StorageContext';
import { tips } from '@/locales/tips';
import { normalizeNutritionTargets } from '@/services/targetProgress/normalizeNutritionTargets';
import { getTargetProgress } from '@/services/targetProgress/targetProgressService';

export type NutritionTargetHistoryItem = {
  tag: string;
  unit: string;
  period: 'daily' | 'weekly';
  isMet: boolean;
};

export type NutritionTipHistoryItem = {
  tipId: string;
  targets: NutritionTargetHistoryItem[];
};

export type NutritionProgressHistory = Record<string, NutritionTipHistoryItem[]>;

export const useNutritionPlanProgressHistory = (dateKeys: string[]): NutritionProgressHistory => {
  const { plans, dailyNutritionTracking, weeklyNutritionTracking, dailyHabitTracking, dailyTrainingTracking, takenDates } = useStorage();

  return React.useMemo(() => {
    const result: NutritionProgressHistory = {};

    dateKeys.forEach(dateKey => {
      result[dateKey] = [];

      (plans?.nutrition ?? []).forEach(planTip => {
        const tip = tips.find(candidate => candidate.id === planTip.tipId);

        if (!tip) {
          return;
        }

        const nutritionTargets = normalizeNutritionTargets(tip);

        if (nutritionTargets.length === 0) {
          return;
        }

        const targetProgress = nutritionTargets.map(target => {
          const progress = getTargetProgress({
            target,
            selectedDate: dateKey,

            storage: {
              dailyNutritionTracking,
              weeklyNutritionTracking,
              dailyHabitTracking,
              dailyTrainingTracking,
              takenDates,
            },
          });

          return {
            tag: target.tag ?? target.trackingKey,

            unit: target.unit,

            period: target.period,

            isMet: progress.isFulfilled,
          };
        });

        result[dateKey].push({
          tipId: tip.id,

          targets: targetProgress,
        });
      });
    });

    return result;
  }, [dateKeys, plans?.nutrition, dailyNutritionTracking, weeklyNutritionTracking, dailyHabitTracking, dailyTrainingTracking, takenDates]);
};
