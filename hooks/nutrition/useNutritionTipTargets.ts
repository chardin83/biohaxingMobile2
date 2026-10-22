import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { TipTargetItem } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import { isAminoAcidTargetTag } from '@/constants/aminoAcids';
import { isFiberTargetTag } from '@/constants/fiber';
import { isMineralTargetTag } from '@/constants/minerals';
import { isNutrientTargetTag } from '@/constants/nutrients';
import { isPolyphenolTargetTag } from '@/constants/polyphenols';
import { isVitaminTargetTag } from '@/constants/vitamins';
import { tips } from '@/locales/tips';
import { getNutritionCompletion, restoreCompletedNutritionTargets } from '@/services/targetProgress/completedNutritionProgress';
import { resolveDailyNutritionTargetDetails } from '@/services/targetProgress/nutritionTargetProgress';
import type { NutritionTargetDefinition } from '@/services/targetProgress/targetProgressTypes';
import type { NutritionTargetUnit } from '@/types/nutrition/nutritionTargets';
import { getTipMacroGoals, getTipProteinGoal, hasProfileProteinTargets, hasValidProteinGoal, hasValidTargetWeight, hasWeightBasedTargets, resolveNutritionTip } from '@/utils/resolveNutritionTip';

type NutritionLabelGroup = 'macroLabels' | 'aminoAcidLabels' | 'mineralLabels' | 'vitaminLabels' | 'fiberLabels' | 'polyphenolLabels' | 'nutrientLabels';

const getNutritionLabelGroup = (tag: string, unit: NutritionTargetUnit): NutritionLabelGroup => {
  if (tag === 'protein' || tag === 'carbohydrates' || tag === 'fat') return 'macroLabels';
  if (isNutrientTargetTag(tag)) return 'nutrientLabels';
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
  const { plans, userProfile, dailyNutritionTracking, weeklyNutritionTracking, takenDates, nutritionCompletions: nutritionXpClaims } = useStorage();

  const { t } = useTranslation();

  //const dateKeySignature = dateKeys.join('|');

  return useMemo(() => {
    const result: Record<string, Record<string, TipTargetItem[]>> = {};

    dateKeys.forEach(dateKey => {
      result[dateKey] = {};
    });

    (plans?.nutrition ?? []).forEach(planTip => {
      const sourceTip = tips.find(candidate => candidate.id === planTip.tipId);
      if (hasWeightBasedTargets(sourceTip) && !hasValidTargetWeight(userProfile?.weightKg)) return;
      if (hasProfileProteinTargets(sourceTip) && !hasValidProteinGoal(getTipProteinGoal(sourceTip, userProfile))) return;
      const tip = sourceTip ? resolveNutritionTip(sourceTip, userProfile?.weightKg, getTipProteinGoal(sourceTip, userProfile), getTipMacroGoals(sourceTip, userProfile)) : undefined;

      if (tip?.targetPeriod !== 'daily') {
        return;
      }

      const rawTargets = [
        ...(tip.proteinTargets ?? []),
        ...(tip.macroTargets ?? []),
        ...(tip.nutrientTargets ?? []),
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
            ...rawTarget,
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
              label: t(`journal:nutritionLogger.${labelGroup}.${'labelKey' in rawTarget ? (rawTarget.labelKey ?? tag) : tag}`),
              supplementIds,
            },
          ];
        });

        for (const raw of tip.trackingTargets ?? []) {
          const details = resolveDailyNutritionTargetDetails({ target: { ...raw, source: 'nutrition', period: 'daily' }, dateKey, dailyNutritionTracking, weeklyNutritionTracking });
          targets.push({ tag: raw.trackingKey, unit: raw.unit, period: 'daily', amount: raw.amount,
            actual: details.actual, foodActual: details.foodActual, supplementActual: 0,
            isMet: details.actual >= raw.amount,
            label: t(`journal:nutritionLogger.weeklyTrackingLabels.${raw.trackingKey}`) });
        }

        result[dateKey][tip.id] = restoreCompletedNutritionTargets(targets, getNutritionCompletion(nutritionXpClaims, tip.id, 'daily', dateKey));
      });
    });

    return result;
  }, [dateKeys, plans, userProfile, dailyNutritionTracking, weeklyNutritionTracking, takenDates, nutritionXpClaims, t]);
};
