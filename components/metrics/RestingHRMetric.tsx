import { useTheme } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { calculateRestingHRMetrics } from '@/utils/restingHRCalculations';
import { HRVSummary } from '@/wearables/types';

interface RestingHRMetricProps {
  hrvData: HRVSummary[];
  showDivider?: boolean;
}

export function RestingHRMetric({ hrvData, showDivider = false }: Readonly<RestingHRMetricProps>) {
  const { colors } = useTheme();
  const { restingHR, restingHRDelta } = calculateRestingHRMetrics(hrvData);

  return (
    <View
      style={[
        globalStyles.col,
        showDivider && [globalStyles.colWithDivider, { borderRightColor: colors.textWeak }],
      ]}
    >
      <ThemedText type="label">Resting HR</ThemedText>
      <View style={globalStyles.metricValueContainer}>
        <ThemedText type="title2">{restingHR ?? '—'}</ThemedText>
        {restingHR && (
          <ThemedText type="caption"> bpm</ThemedText>
        )}
      </View>
      <ThemedText type="explainer" style={{ color: colors.accentStrong }}>
        {restingHRDelta > 0 ? '+' : ''}
        {restingHRDelta} bpm
      </ThemedText>
    </View>
  );
}
