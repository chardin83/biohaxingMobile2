import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { TipTargetItem } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import { isAminoAcidTargetTag } from '@/constants/aminoAcids';
import { isFiberTargetTag } from '@/constants/fiber';
import { isMineralTargetTag } from '@/constants/minerals';
import { isPolyphenolTargetTag } from '@/constants/polyphenols';
import { isVitaminTargetTag } from '@/constants/vitamins';
import { tips } from '@/locales/tips';
import { resolveDailyNutritionTargetDetails } from '@/services/targetProgress/nutritionTargetProgress';
import type { NutritionTargetDefinition } from '@/services/targetProgress/targetProgressTypes';
import type { NutritionTargetUnit } from '@/types/nutrition/nutritionTargets';

type NutritionLabelGroup = 'aminoAcidLabels' | 'mineralLabels' | 'vitaminLabels' | 'fiberLabels' | 'polyphenolLabels';

const getNutritionLabelGroup = (tag: string, unit: NutritionTargetUnit): NutritionLabelGroup => {
  if (isAminoAcidTargetTag(tag)) {
    return 'aminoAcidLabels';
  }

  if (isMineralTargetTag(tag)) {
    return 'mineralLabels';
  }

  if (isVitaminTargetTag(tag)) {
    return 'vitaminLabels';
  }

  if (isFiberTargetTag(tag) || unit === 'g') {
    return 'fiberLabels';
  }

  if (isPolyphenolTargetTag(tag)) {
    return 'polyphenolLabels';
  }

  return 'polyphenolLabels';
};

export const useNutritionTipTargets = (dateKeys: string[]): Record<string, Record<string, TipTargetItem[]>> => {
  const { plans, dailyNutritionTracking, takenDates } = useStorage();

  const { t } = useTranslation();

  //const dateKeySignature = dateKeys.join('|');

  return useMemo(() => {
    const result: Record<string, Record<string, TipTargetItem[]>> = {};

    dateKeys.forEach(dateKey => {
      result[dateKey] = {};
    });

    (plans?.nutrition ?? []).forEach(planTip => {
      const tip = tips.find(candidate => candidate.id === planTip.tipId);

      if (!tip || tip.targetPeriod !== 'daily') {
        return;
      }

      const rawTargets = [
        ...(tip.mineralTargets ?? []),
        ...(tip.vitaminTargets ?? []),
        ...(tip.aminoAcidTargets ?? []),
        ...(tip.polyphenolTargets ?? []),
        ...(tip.fiberTargets ?? []),
      ];

      const tipSupplementIds = (tip.supplements ?? []).map(supplement => supplement.id).filter(Boolean);

      dateKeys.forEach(dateKey => {
        const targets: TipTargetItem[] = rawTargets.flatMap(rawTarget => {
          if (rawTarget.unit !== 'mg' && rawTarget.unit !== 'g' && rawTarget.unit !== 'μg') {
            return [];
          }

          if (!Number.isFinite(rawTarget.amount)) {
            return [];
          }

          const tag =
            (
              rawTarget as {
                tag?: string;
              }
            ).tag ?? '';

          if (!tag) {
            return [];
          }

          const explicitSupplementIds = (
            rawTarget as {
              supplementIds?: string[];
            }
          ).supplementIds;

          const supplementIds = explicitSupplementIds?.length ? explicitSupplementIds : tipSupplementIds;

          const target: NutritionTargetDefinition = {
            source: 'nutrition',
            trackingKey: tag,
            amount: rawTarget.amount,
            unit: rawTarget.unit,
            period: 'daily',
            supplementIds,
          };

          const details = resolveDailyNutritionTargetDetails({
            target,
            dateKey,
            dailyNutritionTracking,
            takenDates,
            supplementIds,
          });

          const labelGroup = getNutritionLabelGroup(tag, rawTarget.unit);

          return [
            {
              tag,
              unit: rawTarget.unit,
              period: 'daily',
              amount: rawTarget.amount,
              actual: details.actual,
              foodActual: details.foodActual,
              supplementActual: details.supplementActual,
              isMet: details.actual >= rawTarget.amount,
              label: t(`nutritionLogger.${labelGroup}.${tag}`),
              supplementIds,
            },
          ];
        });

        result[dateKey][tip.id] = targets;
      });
    });

    return result;
  }, [dateKeys, plans, dailyNutritionTracking, takenDates, t]);
};
