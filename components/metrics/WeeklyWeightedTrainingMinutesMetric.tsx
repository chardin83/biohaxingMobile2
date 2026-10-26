import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { getCurrentWeekMetricTotal } from '@/utils/metricDateUtils';

import { MetricContainer } from './MetricContainer';

interface WeeklyWeightedTrainingMinutesMetricProps {
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

export function WeeklyWeightedTrainingMinutesMetric({ onPress, isSelected = false }: WeeklyWeightedTrainingMinutesMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const total = getCurrentWeekMetricTotal(getMetricHistory('weighted_training_minutes'));

  return (
    <MetricContainer onPress={onPress} isSelected={isSelected} borderColor={isSelected ? colors.primary : 'transparent'}>
      <ThemedText type="label">{t('metrics:weightedTrainingMinutes.shortName')}</ThemedText>
      <ThemedText type="title2">{total === undefined ? '—' : Math.round(total)}</ThemedText>
      <ThemedText type="caption">{t('metrics:weightedTrainingMinutes.thisWeek')}</ThemedText>
    </MetricContainer>
  );
}
