import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';
import { HRVSummary } from '@/wearables/types';

interface HRVMetricProps {
  readonly hrvData: HRVSummary[];
  readonly showDivider?: boolean;
}

export function HRVMetric({ hrvData, showDivider = false }: HRVMetricProps) {
  const { colors } = useTheme();
  const { hrv, hrvDelta } = calculateHRVMetrics(hrvData);

  return (
    <View
      style={[
        globalStyles.col,
        showDivider && [globalStyles.colWithDivider, { borderRightColor: colors.textWeak }],
      ]}
    >
      <ThemedText type="label">HRV</ThemedText>
      <View style={globalStyles.metricValueContainer}>
        <ThemedText type="title2">{hrv ?? '—'}</ThemedText>
        {hrv && <ThemedText type="caption"> ms</ThemedText>}
      </View>
      <ThemedText type="explainer" style={{ color: colors.accentStrong }}>
        {hrvDelta > 0 ? '+' : ''}
        {hrvDelta}% 7d avg
      </ThemedText>
    </View>
  );
}
