import React from 'react';

import { useStorage } from '@/app/context/StorageContext';
import { tips } from '@/locales/tips';
import { getTargetProgress } from '@/services/targetProgress/targetProgressService';
import type { NutritionTargetDefinition } from '@/services/targetProgress/targetProgressTypes';

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

        if (!tip || !tip.targetPeriod) {
          return;
        }

        const targets = [...(tip.trackingTargets ?? [])];

        if (targets.length === 0) {
          return;
        }

        const tipSupplementIds = (tip.supplements ?? []).map(supplement => supplement.id).filter(Boolean);

        const targetProgress = targets.map(rawTarget => {
          const supplementIds = rawTarget.supplementIds?.length ? rawTarget.supplementIds : tipSupplementIds;

          const target: NutritionTargetDefinition = {
            ...rawTarget,
            source: 'nutrition',
            period: tip.targetPeriod,
            supplementIds,
          };

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
            tag: target.trackingKey,
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
  }, [dateKeys, plans, dailyNutritionTracking, weeklyNutritionTracking, dailyHabitTracking, dailyTrainingTracking, takenDates]);
};
