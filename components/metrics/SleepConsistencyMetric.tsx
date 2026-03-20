import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet,View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { SleepSummaryWithTarget } from '@/wearables/types';

import { MetricContainer } from './MetricContainer';

interface SleepConsistencyMetricProps {
  sleepData?: SleepSummaryWithTarget;
  showDivider?: boolean;
}

// Helper to convert "HH:mm" to minutes since midnight
function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeString(minutesFromMidnight?: number) {
  if (typeof minutesFromMidnight !== 'number') {
    return undefined;
  }

  const normalized = ((Math.round(minutesFromMidnight) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function SleepConsistencyMetric({
  sleepData,
  showDivider = false,
}: Readonly<SleepConsistencyMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();

  const latestBedtimeFromStorage = React.useMemo(() => {
    const latestEntry = getMetricHistory('sleep_bedtime')
      .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
      .at(-1);
    return latestEntry?.value;
  }, [getMetricHistory]);

  const startTimeFromStorage = React.useMemo(() => {
    return minutesToTimeString(latestBedtimeFromStorage);
  }, [latestBedtimeFromStorage]);

  const targetBedtime = sleepData?.targetBedtime ?? '22:30';
  const startTime = sleepData?.startTime ?? startTimeFromStorage;
  const hasConsistencyData = Boolean(targetBedtime && startTime);

  const targetMinutes = hasConsistencyData ? timeStringToMinutes(targetBedtime) : 0;
  const actualMinutes = hasConsistencyData ? timeStringToMinutes(startTime) : 0;
  let differenceMinutes = targetMinutes - actualMinutes;
  const isPerfect = Math.abs(differenceMinutes) <= 5;
  const isGood = Math.abs(differenceMinutes) <= 30;

  let accentType = 'explainer' as const;
  let accentColor;
  if (isPerfect) {
    accentColor = colors.accentStrong;
  } else if (isGood) {
    accentColor = colors.goldSoft;
  } else {
    accentColor = colors.warmColor;
  }

  let differenceLabel: string;
  if (!hasConsistencyData) {
    differenceLabel = '—';
  } else if (isPerfect) {
    differenceLabel = t('metrics.perfect');
  } else {
    differenceLabel = t('metrics.bedtimeDifference', {
      minutes: Math.abs(differenceMinutes),
      direction: differenceMinutes > 0 ? t('metrics.earlier') : t('metrics.late'),
    });
  }

  return (
    <MetricContainer
      showDivider={showDivider}
    >
      <ThemedText type="label">{t('metrics:sleep_bedtime.name')}</ThemedText>
      <View style={globalStyles.metricValueContainer}>
        <ThemedText type="title2">{startTime ?? '—'}</ThemedText>
      </View>
      <ThemedText type={accentType} style={hasConsistencyData ? { color: accentColor } : undefined}>
        {differenceLabel}
      </ThemedText>
    </MetricContainer>
  );
}