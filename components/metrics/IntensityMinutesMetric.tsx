import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { DailyActivity } from '@/wearables/types';

import { MetricContainer } from './MetricContainer';

interface IntensityMinutesMetricProps {
  activityData?: DailyActivity[];
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function IntensityMinutesMetric({ activityData, showDivider = false, onPress, isSelected }: Readonly<IntensityMinutesMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();


  // Summera intensityMinutes för alla aktiviteter för dagen
  const intensityFromWearable = React.useMemo(() => {
    if (!activityData || activityData.length === 0) {
      return null;
    }
    // Summera alla intensityMinutes
    return activityData.reduce((sum, act) => sum + (typeof act.intensityMinutes === 'number' ? act.intensityMinutes : 0), 0);
  }, [activityData]);

  const intensityFromStorage = React.useMemo(() => {
    const latestEntry = getMetricHistory('intensity_minutes')
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
      .at(-1);
    return latestEntry?.value ?? null;
  }, [getMetricHistory]);

  const intensityMinutes = intensityFromStorage ?? intensityFromWearable;

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={isSelected ? colors.chart?.mindIntensity || colors.primary : 'transparent'}
    >
        <ThemedText type="label">{t("metrics:intensityMinutes.shortName")}</ThemedText>
        <ThemedText type="title2">{typeof intensityMinutes === 'number' ? Math.round(intensityMinutes) : '—'}</ThemedText>
    </MetricContainer>
  );
}