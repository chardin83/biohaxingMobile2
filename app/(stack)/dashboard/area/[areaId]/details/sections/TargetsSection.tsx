import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import AppCard from '@/components/ui/AppCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import type { Tip } from '@/locales/tips';

export default function TargetsSection({ tip, colors, t, onShowJournal }: Readonly<{ tip?: Tip; colors: any; t: any; onShowJournal?: () => void }>) {
  if (!tip) return null;

  const nutritionGroups = [
    { targets: tip.fiberTargets, labelGroup: 'fiberLabels' },
    { targets: tip.polyphenolTargets, labelGroup: 'polyphenolLabels' },
    { targets: tip.mineralTargets, labelGroup: 'mineralLabels' },
    { targets: tip.vitaminTargets, labelGroup: 'vitaminLabels' },
    { targets: tip.aminoAcidTargets, labelGroup: 'aminoAcidLabels' },
    { targets: tip.trackingTargets, labelGroup: 'weeklyTrackingLabels' },
    { targets: tip.nutrientTargets, labelGroup: '' },
  ];
  const rows = [
    ...nutritionGroups.flatMap(({ targets, labelGroup }) =>
      (targets ?? []).map(target => {
        const key = 'trackingKey' in target ? target.trackingKey : target.tag;
        const labelPrefix = labelGroup ? labelGroup + '.' : '';
        return {
          ...target,
          key: `${labelGroup}-${key}`,
          label: t(`journal:nutritionLogger.${labelPrefix}${key}`, { defaultValue: key }),
        };
      })
    ),
    ...(tip.activityTargets ?? []).map(target => ({ ...target, key: target.trackingKey, label: t(`training:targets.${target.trackingKey}`) })),
    ...(tip.hydrationTargets ?? []).map(target => ({ ...target, key: target.trackingKey, label: t('journal:nutritionLogger.drinkTypes.water') })),
    ...(tip.habitTargets ?? []).map(target => ({
      ...target,
      key: target.trackingKey,
      label: t(`tips:${tip.id}.habitTargets.description`, { defaultValue: t(`tips:${tip.title}`) }),
    })),
  ];

  if (!rows.length) return null;

  const formatValue = (value: number, unit: string) => {
    let decimals = 1;
    if (['plants', 'items', 'count', 'minutes', 'hours', 'sessions', 'ml'].includes(unit)) {
      decimals = Number.isInteger(value) ? 0 : 1;
    } else if (unit === 'mg' || unit === 'μg') {
      if (value < 0.01) decimals = 4;
      else if (value < 1) decimals = 3;
      else if (value < 10) decimals = 2;
      else decimals = 0;
    }
    const unitLabel = t(`common:nutritionTargetSection.units.${unit}`, { defaultValue: unit });
    return `${value.toFixed(decimals)} ${unitLabel}`;
  };

  const periodLabel = tip.targetPeriod ? t(`common:nutritionTargetSection.periods.${tip.targetPeriod}`) : '';
  const periodSuffix = periodLabel ? ' / ' + periodLabel : '';

  return (
    <AppCard
      title={t('common:nutritionTargetSection.title')}
      subtitle={tip.targetPeriod ? t(`common:nutritionTargetSection.${tip.targetPeriod}`) : undefined}
      iconName="target"
      style={styles.card}
    >
      <View style={styles.targets}>
        {rows.map(target => (
          <View key={target.key} style={styles.targetRow}>
            <ThemedText style={globalStyles.flex1}>{target.label}</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {formatValue(target.amount, target.unit)}
              {periodSuffix}
            </ThemedText>
          </View>
        ))}
      </View>
      {onShowJournal && (
        <TouchableOpacity accessibilityRole="link" onPress={onShowJournal} style={[styles.journalLink, { borderColor: colors.borderLight }]}>
          <IconSymbol name="calendar" size={20} color={colors.primary} />
          <ThemedText type="defaultSemiBold" style={{ color: colors.primary }}>
            {t('common:nutritionTargetSection.showJournal')}
          </ThemedText>
          <IconSymbol name="chevron.right" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%' },
  targets: { marginTop: 16, gap: 12 },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  journalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    gap: 6,
    paddingVertical: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
