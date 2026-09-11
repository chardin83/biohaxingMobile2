import { useTheme } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { tips } from '@/locales/tips';

import { ThemedText } from './ThemedText';
import { Card } from './ui/Card';
import { IconSymbol } from './ui/IconSymbol';

const toLocalDateKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type OtherTipProgress = {
  tipId: string;
  title: string;
  description: string;
  targetLabel: string;
  actual: number;
  target: number;
  isFulfilled: boolean;
};

const getDailyMetricValue = (
  entries: Array<{ recordedAt: string; value: number; unit: string }>,
  selectedDate: string,
  unit: string,
): number => {
  const entry = entries
    .filter(item => toLocalDateKey(new Date(item.recordedAt)) === selectedDate)
    .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
    .at(-1);

  if (!entry) return 0;
  if (unit === 'hours' && entry.unit === 'minutes') return entry.value / 60;
  if (unit === 'minutes' && entry.unit === 'hours') return entry.value * 60;
  return entry.value;
};

export default function OtherTipsSection({ selectedDate }: Readonly<{ selectedDate: string }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { plans, getMetricHistory } = useStorage();

  const progressItems = useMemo<OtherTipProgress[]>(() => {
    const sleepEntries = getMetricHistory('sleep_duration');

    return plans.other.flatMap(plan => {
      const tip = tips.find(candidate => candidate.id === plan.tipId);
      if (!tip) return [];

      const targets = tip.habitTargets ?? tip.trackingTargets ?? [];
      const primaryTarget = targets[0];
      const target = primaryTarget?.amount ?? 0;
      const trackingKey = primaryTarget?.trackingKey ?? '';
      let actual = 0;
      if (trackingKey === 'sleep_duration') {
        actual = getDailyMetricValue(sleepEntries, selectedDate, primaryTarget?.unit ?? '');
      }

      return [{
        tipId: tip.id,
        title: t(`tips:${tip.title}`, { defaultValue: tip.id }),
        description: t(`tips:${tip.descriptionKey}`, { defaultValue: '' }),
        targetLabel: primaryTarget
          ? `${primaryTarget.amount} ${primaryTarget.unit}`
          : t('otherTips.noTarget'),
        actual,
        target,
        isFulfilled: Boolean(primaryTarget && actual >= target),
      }];
    });
  }, [getMetricHistory, plans.other, selectedDate, t]);

  if (progressItems.length === 0) {
    return <ThemedText type="default">{t('otherTips.noPlanned')}</ThemedText>;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="title2">{t('otherTips.title')}</ThemedText>
      <ThemedText type="caption" style={{ color: colors.textMuted }}>
        {t('otherTips.subtitle')}
      </ThemedText>

      {progressItems.map(item => (
        <Card key={item.tipId} style={styles.card}>
          <View style={styles.header}>
            <ThemedText type="title3" style={styles.title}>
              {item.title}
            </ThemedText>
            <IconSymbol
              name={item.isFulfilled ? 'check' : 'target'}
              size={26}
              color={item.isFulfilled ? colors.xp : colors.planSectionOtherIcon}
            />
          </View>
          {item.description ? (
            <ThemedText type="default" style={styles.description}>
              {item.description}
            </ThemedText>
          ) : null}
          <View style={styles.statusRow}>
            <ThemedText type="caption">
              {item.isFulfilled ? t('otherTips.fulfilled') : t('otherTips.notFulfilled')}
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {item.targetLabel}
            </ThemedText>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
  },
  description: {
    opacity: 0.85,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
});
