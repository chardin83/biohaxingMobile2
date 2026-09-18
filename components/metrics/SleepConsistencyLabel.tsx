import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { MetricStatusLabel } from '@/components/metrics/MetricStatusLabel';
import { ThemedText } from '@/components/ThemedText';

import { MetricContainer } from './MetricContainer';
import { getSleepConsistencySummary, minutesToTimeString } from './sleepConsistency';

interface SleepConsistencyLabelProps {
  readonly showDivider?: boolean;
}

export function SleepConsistencyLabel({ showDivider }: Readonly<SleepConsistencyLabelProps>) {
  const { t } = useTranslation('metrics');
  const { getMetricHistory } = useStorage();

  const consistencySummary = React.useMemo(() => getSleepConsistencySummary(getMetricHistory('sleep_bedtime')), [getMetricHistory]);

  const weeklyAverageBedtimeLabel = minutesToTimeString(consistencySummary.weeklyAverageBedtimeMinutes) ?? '-';

  return (
    <MetricContainer showDivider={showDivider}>
      <ThemedText type="label">{t('sleep_consistency.title')}</ThemedText>
      <MetricStatusLabel status={consistencySummary.level} />
      <ThemedText type="caption">
        {t('sleep_bedtime.name')}: {weeklyAverageBedtimeLabel}
      </ThemedText>
      <ThemedText type="caption">{t('sleep_consistency.pattern')}</ThemedText>
    </MetricContainer>
  );
}
