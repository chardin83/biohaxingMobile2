import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import TipTarget, { type TipTargetProgress } from '@/components/TipTarget';
import AppBox from '@/components/ui/AppBox';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ALL_AMINO_ACID_KEYS } from '@/constants/aminoAcids';
import { MINERAL_TYPE_KEYS } from '@/constants/minerals';
import { VITAMIN_TYPE_KEYS } from '@/constants/vitamins';
import type { Tip } from '@/locales/tips';

export type NutritionPlanDetailsTarget = {
  key: string;
  tag: string;
  unit: 'g' | 'mg' | 'plants' | 'items' | 'count';
  period: 'daily' | 'weekly';
  amount: number;
  label: string;
};

type NutritionTargetSource = {
  tag: string;
  unit: 'g' | 'mg' | 'plants' | 'items' | 'count';
  period?: 'daily' | 'weekly';
  amount: number;
  trackingKey?: string;
};

type Props = {
  tip?: Tip;
  targetProgressMap: Map<string, TipTargetProgress>;
  selectedDateKey: string;
  title: string;
};

export const NutritionPlanDetailsSection: React.FC<Props> = ({
  tip,
  targetProgressMap,
  selectedDateKey,
  title,
}) => {
  const { t } = useTranslation(['common', 'areas', 'tips']);
  const { colors } = useTheme();

  const targets = React.useMemo<NutritionPlanDetailsTarget[]>(() => {
    if (!tip) return [];

    const fiberTargets = tip.fiberTargets ?? [];
    const polyphenolTargets = tip.polyphenolTargets ?? [];
    const mineralTargets = tip.mineralTargets ?? [];
    const vitaminTargets = tip.vitaminTargets ?? [];
    const aminoAcidTargets = tip.aminoAcidTargets ?? [];
    const trackingTargets = (tip.trackingTargets ?? []).map(target => ({
      ...target,
      tag: target.trackingKey,
    }));
    const allTargets: NutritionTargetSource[] = [
      ...fiberTargets,
      ...polyphenolTargets,
      ...mineralTargets,
      ...vitaminTargets,
      ...aminoAcidTargets,
      ...trackingTargets,
    ];

    const mineralTags = new Set<string>(MINERAL_TYPE_KEYS);
    const aminoAcidTags = new Set<string>(ALL_AMINO_ACID_KEYS);
    const vitaminTags = new Set<string>(VITAMIN_TYPE_KEYS);

    const formatValue = (value: number, unit: 'g' | 'mg' | 'plants' | 'items' | 'count') => {
      if (unit === 'plants' || unit === 'items' || unit === 'count') {
        return `${Math.round(value)} ${unit}`;
      }

      let decimals = 1;
      if (unit === 'mg') {
        if (value < 0.01) {
          decimals = 4;
        } else if (value < 1) {
          decimals = 3;
        } else if (value < 10) {
          decimals = 2;
        } else {
          decimals = 0;
        }
      }
      return `${value.toFixed(decimals)} ${unit}`;
    };

    return allTargets.map((target: NutritionTargetSource) => {
      const trackingKey = target.trackingKey ?? target.tag;
      let labelGroup: 'weeklyTrackingLabels' | 'fiberLabels' | 'aminoAcidLabels' | 'mineralLabels' | 'vitaminLabels' | 'polyphenolLabels' = 'polyphenolLabels';

      if (target.unit === 'plants' || target.unit === 'items' || target.unit === 'count') {
        labelGroup = 'weeklyTrackingLabels';
      } else if (target.unit === 'g') {
        labelGroup = 'fiberLabels';
      } else if (aminoAcidTags.has(trackingKey)) {
        labelGroup = 'aminoAcidLabels';
      } else if (mineralTags.has(trackingKey)) {
        labelGroup = 'mineralLabels';
      } else if (vitaminTags.has(trackingKey)) {
        labelGroup = 'vitaminLabels';
      }

      return {
        key: trackingKey,
        tag: trackingKey,
        unit: target.unit,
        period: target.period ?? 'daily',
        amount: target.amount,
        label: t(`nutritionLogger.${labelGroup}.${trackingKey}`, { defaultValue: trackingKey }),
        value: formatValue(target.amount, target.unit),
      };
    });
  }, [t, tip]);

  const targetProgressInfoText = React.useMemo(() => {
    const hasDailyTargets = targets.some(target => target.period === 'daily');
    const hasWeeklyTargets = targets.some(target => target.period === 'weekly');

    if (hasDailyTargets && hasWeeklyTargets) {
      return t('plan.targetsProgressInfoDailyWeekly');
    }

    if (hasWeeklyTargets) {
      return t('plan.targetsProgressInfoWeekly');
    }

    return t('plan.targetsProgressInfoDaily');
  }, [t, targets]);

  return (
    <AppBox
      title={t('plan.targetsTitle')}
      leading={<IconSymbol name="target" size={18} color={colors.primary} />}
    >
      <ThemedText type="explainer" style={styles.targetInfoText}>
        {targetProgressInfoText}
      </ThemedText>
      <View style={styles.targetList}>
        {targets.map(target => {
          const progressTarget = targetProgressMap.get(`${target.tag}|${target.unit}|${target.period}`);

          return (
            <TipTarget
              key={target.key}
              tip={{ tipId: tip?.id ?? '', title, dateKey: selectedDateKey }}
              target={{
                tag: target.tag,
                unit: target.unit,
                period: target.period,
                amount: target.amount,
                actual: progressTarget?.actual ?? 0,
                foodActual: progressTarget?.foodActual,
                supplementActual: progressTarget?.supplementActual,
                isMet: progressTarget?.isMet ?? false,
                label: target.label,
                trackedItems: progressTarget?.trackedItems,
                supplementIds: progressTarget?.supplementIds,
              }}
              colors={{
                primary: colors.primary,
                textMuted: colors.textMuted,
                overlayLight: colors.overlayLight,
              }}
            />
          );
        })}
      </View>
    </AppBox>
  );
};

const styles = StyleSheet.create({
  targetInfoText: {
    marginBottom: 8,
    opacity: 0.8,
  },
  targetList: {
    gap: 6,
  },
});

export default NutritionPlanDetailsSection;
