import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { SleepSummary } from '@/wearables/types';

interface SleepMetricProps {
  sleepData: SleepSummary[];
  showDivider?: boolean;
}

export function SleepMetric({ sleepData, showDivider = false }: Readonly<SleepMetricProps>) {
  const { colors } = useTheme();
  const latestSleep = sleepData[0];
  const sleepMinutes = latestSleep?.durationMinutes ?? null;
  const sleepHours = sleepMinutes ? Math.floor(sleepMinutes / 60) : null;
  const sleepMins = sleepMinutes ? sleepMinutes % 60 : null;
  const efficiency = latestSleep?.efficiencyPct ?? null;

  return (
    <View
      style={[
        globalStyles.col,
        showDivider && [globalStyles.colWithDivider, { borderRightColor: colors.textWeak }],
      ]}
    >
      <ThemedText type="label">Sleep duration</ThemedText>
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
      {efficiency !== null && (
        <ThemedText type="explainer" style={{ color: colors.accentStrong }}>
          {efficiency}% efficiency
        </ThemedText>
      )}
      {latestSleep && (
        <ThemedText type="explainer">
          {latestSleep.source}
        </ThemedText>
      )}
    </View>
  );
}
