import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { getGlycemicIndexSummary } from '@/utils/glycemicIndex';
import { toDateKey } from '@/utils/dateUtils';
import { getLatestMetricEntries } from '@/utils/latestMetricOverview';

import { MetricContainer } from './MetricContainer';
import { MetricDataStatus } from './MetricDataStatus';

type Props = {
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
};

export function GlycemicIndexMetric({ showDivider = false, onPress, isSelected = false }: Props) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { getMetricHistory, dailyNutritionTracking = {} } = useStorage();
  const latest = getLatestMetricEntries(getMetricHistory('glycemic_index')).glycemic_index;
  const today = toDateKey(new Date());
  const date = Object.keys(dailyNutritionTracking).filter(key => key <= today && dailyNutritionTracking[key].entries.length > 0).sort().at(-1);
  const summary = getGlycemicIndexSummary(date ? dailyNutritionTracking[date].entries : []);
  // An unknown GI on the latest logged day must not borrow a previous day's value.
  const value = date ? summary.glycemicIndex : latest?.value;
  const recordedAt = date ? `${date}T00:00:00` : latest?.recordedAt;

  return (
    <MetricContainer showDivider={showDivider} onPress={onPress} isSelected={isSelected} borderColor={isSelected ? colors.primary : 'transparent'}>
      <ThemedText type="label">{t('metrics:glycemic_index.shortName')}</ThemedText>
      {value !== undefined && <ThemedText type="title2">{new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(value)}</ThemedText>}
      {value === undefined && recordedAt && <ThemedText type="title2">—</ThemedText>}
      <ThemedText type="caption">{summary.coverage === undefined ? t('metrics:glycemic_index.noCarbohydrates') : t('metrics:glycemic_index.coverage', { value: Math.round(summary.coverage) })}</ThemedText>
      <MetricDataStatus recordedAt={recordedAt} hasPermission />
    </MetricContainer>
  );
}
