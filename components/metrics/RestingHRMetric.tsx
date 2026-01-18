import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { calculateRestingHRMetrics } from '@/utils/restingHRCalculations';
import { HRVSummary } from '@/wearables/types';

interface RestingHRMetricProps {
  hrvData: HRVSummary[];
  showDivider?: boolean;
}

export function RestingHRMetric({ hrvData, showDivider = false }: RestingHRMetricProps) {
  const { restingHR, restingHRDelta } = calculateRestingHRMetrics(hrvData);

  return (
    <View style={[styles.col, showDivider && styles.colWithDivider]}>
      <Text style={styles.label}>Resting HR</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{restingHR ?? '—'}</Text>
        {restingHR && <Text style={styles.unit}> bpm</Text>}
      </View>
      <Text style={styles.accent}>
        {restingHRDelta > 0 ? '+' : ''}
        {restingHRDelta} bpm
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    flex: 1,
    paddingHorizontal: 8,
  },
  colWithDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.10)',
  },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  value: {
    color: 'white',
    fontSize: 26,
    fontWeight: '700',
  },
  unit: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
  },
  accent: {
    color: 'rgba(120,255,220,0.85)',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
});
