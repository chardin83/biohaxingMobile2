import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';

import { MetricContainer } from './MetricContainer';
import { getSleepConsistencySummary, minutesToTimeString } from './sleepConsistency';

interface SleepConsistencyLabelProps {
  readonly showDivider?: boolean;
}

export function SleepConsistencyLabel({ showDivider }: Readonly<SleepConsistencyLabelProps>) {
  const { t } = useTranslation('metrics');
  const { colors } = useTheme();
  const { getMetricHistory } = useStorage();

  const consistencySummary = React.useMemo(() => {
    return getSleepConsistencySummary(getMetricHistory('sleep_bedtime'));
  }, [getMetricHistory]);

  const labelMap = {
    low: t('common.low'),
    moderate: t('common.moderate'),
    good: t('common.good'),
    optimal: t('common.optimal'),
  } as const;

  const colorMap = {
    low: colors.warmColor,
    moderate: colors.goldSoft,
    good: colors.goldSoft,
    optimal: colors.accentStrong,
  } as const;

  const consistencyLabel = labelMap[consistencySummary.level];
  const consistencyColor = colorMap[consistencySummary.level];
  const weeklyAverageBedtimeLabel = minutesToTimeString(consistencySummary.weeklyAverageBedtimeMinutes) ?? '-';

  return (
      <MetricContainer
          showDivider={showDivider}
        >
      <ThemedText type="label">{t('sleep_consistency.title')}</ThemedText>
      <ThemedText type="title3" style={{ color: consistencyColor }}>{consistencyLabel}</ThemedText>
      <ThemedText type="caption">{t('sleep_bedtime.name')}: {weeklyAverageBedtimeLabel}</ThemedText>
      <ThemedText type="caption">{t('sleep_consistency.pattern')}</ThemedText>
   </MetricContainer>
  );
}
