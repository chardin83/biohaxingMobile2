import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

import { MetricContainer } from './MetricContainer';
import { getLatestEntryForToday } from './metricDateUtils';
import { DEFAULT_TARGET_BEDTIME_MINUTES, getBedtimeDeviation, minutesToTimeString } from './sleepConsistency';

interface SleepConsistencyMetricProps {
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function SleepConsistencyMetric({ showDivider = false, onPress, isSelected = false }: Readonly<SleepConsistencyMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation('metrics');
  const { getMetricHistory } = useStorage();

  const latestTodayEntry = React.useMemo(() => getLatestEntryForToday(getMetricHistory('sleep_bedtime')), [getMetricHistory]);

  const actualMinutes = typeof latestTodayEntry?.value === 'number' ? latestTodayEntry.value : undefined;

  const startTime = actualMinutes !== undefined ? minutesToTimeString(actualMinutes) : undefined;

  const nightlyDeviation = actualMinutes !== undefined ? getBedtimeDeviation(DEFAULT_TARGET_BEDTIME_MINUTES, actualMinutes) : undefined;

  const hasConsistencyData = nightlyDeviation !== undefined;
  const isPerfect = nightlyDeviation?.isPerfect === true;
  const isGood = nightlyDeviation?.isGood === true;

  let accentColor = colors.warmColor;

  if (isPerfect) {
    accentColor = colors.accentStrong;
  } else if (isGood) {
    accentColor = colors.goldSoft;
  }

  let differenceLabel = '—';

  if (isPerfect) {
    differenceLabel = t('sleep_bedtime.perfect');
  } else if (nightlyDeviation) {
    differenceLabel = t('sleep_bedtime.bedtimeDifference', {
      minutes: Math.abs(Math.round(nightlyDeviation.differenceMinutes)),
      direction: nightlyDeviation.direction === 'earlier' ? t('sleep_bedtime.earlier') : t('sleep_bedtime.late'),
    });
  }

  return (
    <MetricContainer showDivider={showDivider} isSelected={isSelected} onPress={onPress} borderColor={isSelected ? colors.accentStrong : 'transparent'}>
      <ThemedText type="label">{t('sleep_bedtime.name')}</ThemedText>

      <View style={globalStyles.metricValueContainer}>
        <ThemedText type="title2">{startTime ?? '—'}</ThemedText>
      </View>

      <ThemedText type="explainer" style={hasConsistencyData ? { color: accentColor } : undefined}>
        {differenceLabel}
      </ThemedText>
    </MetricContainer>
  );
}
