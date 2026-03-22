import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

import { MetricContainer } from './MetricContainer';

interface SleepMetricProps {
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function SleepMetric({ showDivider = false, onPress, isSelected = false }: Readonly<SleepMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();

  const latestSleepFromStorage = React.useMemo(() => {
    const latestEntry = getMetricHistory('sleep_duration')
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
      .at(-1);
    if (!latestEntry) {
      return null;
    }
    if (latestEntry.unit === 'hours') {
      return Math.round(latestEntry.value * 60);
    }
    return Math.round(latestEntry.value);
  }, [getMetricHistory]);

  const sleepMinutes = latestSleepFromStorage ?? null;
  const sleepHours = sleepMinutes ? Math.floor(sleepMinutes / 60) : null;
  const sleepMins = sleepMinutes ? sleepMinutes % 60 : null;

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={isSelected ? colors.accentStrong : 'transparent'}
    >
      <ThemedText type="label">{t('metrics:sleep_duration.name')}</ThemedText>
      <View style={globalStyles.metricValueContainer}>
        {sleepMinutes === null ? (
          <ThemedText type="title2">—</ThemedText>
        ) : (
          <>
            <ThemedText type="title2">{sleepHours}</ThemedText>
            <ThemedText type="caption">h </ThemedText>
            <ThemedText type="title2">{String(sleepMins).padStart(2, '0')}</ThemedText>
            <ThemedText type="caption">m</ThemedText>
          </>
        )}
      </View>
    </MetricContainer>
  );
}
