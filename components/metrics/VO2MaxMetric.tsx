import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

interface VO2MaxMetricProps {
  vo2max: number | null;
  status?: string;
  trend?: number; // Percentage change
  showDivider?: boolean;
}

export function VO2MaxMetric({ vo2max, status, trend, showDivider = false }: Readonly<VO2MaxMetricProps>) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        globalStyles.col,
        showDivider && [globalStyles.colWithDivider, { borderRightColor: colors.borderLight }],
      ]}
    >
      <ThemedText type="label">VO₂ Max</ThemedText>
      <ThemedText type="title2">{vo2max ?? '—'}</ThemedText>
      {trend !== undefined && (
        <ThemedText type="explainer">
          {trend > 0 ? '+' : ''}
          {trend}% trend
        </ThemedText>
      )}
      {status && <ThemedText type="explainer">{status}</ThemedText>}
    </View>
  );
}
