import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { SleepSummaryWithTarget } from '@/wearables/types';

import { MetricContainer } from './MetricContainer';
import { getLatestEntryForToday } from './metricDateUtils';
import {
  DEFAULT_TARGET_BEDTIME_MINUTES,
  getBedtimeDeviation,
  minutesToTimeString,
  timeStringToMinutes,
} from './sleepConsistency';

interface SleepConsistencyMetricProps {
  sleepData?: SleepSummaryWithTarget;
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function SleepConsistencyMetric({
  sleepData,
  showDivider = false,
  onPress,
  isSelected = false,
}: Readonly<SleepConsistencyMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation('metrics');
  const { getMetricHistory } = useStorage();
  const targetBedtimeMinutes = sleepData?.targetBedtime
    ? timeStringToMinutes(sleepData.targetBedtime)
    : DEFAULT_TARGET_BEDTIME_MINUTES;

  const latestTodayEntry = React.useMemo(() => {
    return getLatestEntryForToday(getMetricHistory('sleep_bedtime'));
  }, [getMetricHistory]);

  const actualMinutes =
    typeof latestTodayEntry?.value === 'number' ? latestTodayEntry.value : undefined;
  const startTime =
    typeof actualMinutes === 'number' ? minutesToTimeString(actualMinutes) : undefined;
  const nightlyDeviation = typeof actualMinutes === 'number'
    ? getBedtimeDeviation(targetBedtimeMinutes, actualMinutes)
    : undefined;
  const hasConsistencyData = Boolean(nightlyDeviation);
  const isPerfect = Boolean(nightlyDeviation?.isPerfect);
  const isGood = Boolean(nightlyDeviation?.isGood);

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
    differenceLabel = t('sleep_bedtime.perfect');
  } else if (nightlyDeviation) {
    differenceLabel = t('sleep_bedtime.bedtimeDifference', {
      minutes: Math.abs(Math.round(nightlyDeviation.differenceMinutes)),
      direction: nightlyDeviation.direction === 'earlier' ? t('sleep_bedtime.earlier') : t('sleep_bedtime.late'),
    });
  } else {
    differenceLabel = '—';
  }

  return (
    <MetricContainer
      showDivider={showDivider}
      isSelected={isSelected}
      onPress={onPress}
      borderColor={isSelected ? colors.accentStrong : 'transparent'}
    >
      <ThemedText type="label">{t('sleep_bedtime.name')}</ThemedText>
      <View style={globalStyles.metricValueContainer}>
        <ThemedText type="title2">{startTime ?? '—'}</ThemedText>
      </View>
      <ThemedText type={accentType} style={hasConsistencyData ? { color: accentColor } : undefined}>
        {differenceLabel}
      </ThemedText>
    </MetricContainer>
  );
}