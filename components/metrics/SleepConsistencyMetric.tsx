import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { SleepSummaryWithTarget } from '@/wearables/types';

interface SleepConsistencyMetricProps {
  sleepData: SleepSummaryWithTarget;
  showDivider?: boolean;
}

// Helper to convert "HH:mm" to minutes since midnight
function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function SleepConsistencyMetric({
  sleepData,
  showDivider = false,
}: Readonly<SleepConsistencyMetricProps>) {
  const { colors } = useTheme();
  const { targetBedtime, startTime } = sleepData;
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
    differenceLabel = 'Perfect!';
  } else {
    differenceLabel = `Δ ${Math.abs(differenceMinutes)} min ${differenceMinutes > 0 ? 'earlier' : 'late'}`;
  }

  return (
    <View
      style={[
        globalStyles.col,
        showDivider && [globalStyles.colWithDivider, { borderRightColor: colors.textWeak }],
      ]}
    >
      <ThemedText type="label">Bedtime</ThemedText>
      <View style={globalStyles.metricValueContainer}>
        <ThemedText type="title2">{startTime ?? '—'}</ThemedText>
      </View>
      <ThemedText type={accentType} style={hasConsistencyData ? { color: accentColor } : undefined}>
        {differenceLabel}
      </ThemedText>
    </View>
  );
}