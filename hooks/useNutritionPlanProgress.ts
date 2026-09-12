import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { TipProgressItem } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import { useTargetProgressList } from '@/hooks/useTargetProgressList';
import { tips } from '@/locales/tips';
import type { NutritionTargetDefinition } from '@/services/targetProgress/targetProgressTypes';

type NutritionPlanTarget = NutritionTargetDefinition & {
  tipId: string;
  title: string;
};

export const useNutritionPlanProgress = (selectedDate: string): TipProgressItem[] => {
  const { plans } = useStorage();
  const { t } = useTranslation();

  const targets = useMemo<NutritionPlanTarget[]>(() => {
    return (plans?.nutrition ?? []).flatMap(planTip => {
      const tip = tips.find(candidate => candidate.id === planTip.tipId);

      if (!tip) {
        return [];
      }

      const period = tip.targetPeriod;

      if (!period) {
        return [];
      }

      const title = t(`tips:${tip.id}.title`);

      return (tip.trackingTargets ?? []).map(target => ({
        ...target,
        tipId: tip.id,
        title,
        source: 'nutrition' as const,
        period,
      }));
    });
  }, [plans, t]);

  const targetProgress = useTargetProgressList(targets, selectedDate);

  return useMemo(() => {
    const byTip = new Map<string, TipProgressItem>();

    targetProgress.forEach(item => {
      const targetProgressValue = item.progress.target > 0 ? Math.min(item.progress.current / item.progress.target, 1) : 0;

      const targetItem = {
        tag: item.trackingKey,
        unit: item.unit,
        period: item.period,
        amount: item.progress.target,
        actual: item.progress.current,
        foodActual: item.progress.current,
        supplementActual: 0,
        isMet: item.progress.isFulfilled,
        label: item.title,
        trackedItems: undefined,
        supplementIds: item.supplementIds,
      };

      const existing = byTip.get(item.tipId);

      if (!existing) {
        byTip.set(item.tipId, {
          tipId: item.tipId,
          title: item.title,
          period: item.period,

          progress: targetProgressValue,

          isFulfilled: item.progress.isFulfilled,

          targets: [targetItem],

          metCount: item.progress.isFulfilled ? 1 : 0,

          totalCount: 1,
        });

        return;
      }

      existing.targets.push(targetItem);

      existing.metCount += item.progress.isFulfilled ? 1 : 0;

      existing.totalCount += 1;

      existing.isFulfilled = existing.metCount === existing.totalCount;

      existing.progress = existing.totalCount > 0 ? existing.metCount / existing.totalCount : 0;
    });

    return Array.from(byTip.values());
  }, [targetProgress]);
};
