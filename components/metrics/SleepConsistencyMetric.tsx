import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  const { targetBedtime, startTime } = sleepData;

  const targetMinutes = typeof targetBedtime === 'string' ? timeStringToMinutes(targetBedtime) : 0;
  const actualMinutes = typeof startTime === 'string' ? timeStringToMinutes(startTime) : 0;
  let differenceMinutes = targetMinutes - actualMinutes;
  const isPerfect = Math.abs(differenceMinutes) <= 5;
  const isGood = Math.abs(differenceMinutes) <= 30;

  return (
    <View style={[styles.col, showDivider && styles.colWithDivider]}>
      <Text style={styles.label}>Bedtime </Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{startTime}</Text>
      </View>
      <Text
        style={[
          styles.accent,
          isPerfect ? styles.perfect : isGood ? styles.good : styles.bad,
        ]}
      >
        {isPerfect
          ? 'Perfect!'
          : `Δ ${Math.abs(differenceMinutes)} min ${differenceMinutes > 0 ? 'earlier' : 'late'}`}
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
    marginLeft: 4,
    marginRight: 4,
  },
  accent: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  perfect: {
    color: 'rgba(120,255,220,0.85)',
  },
  good: {
    color: 'rgba(255,220,120,0.85)',
  },
  bad: {
    color: 'rgba(255,120,100,0.95)',
  },
});

export function SleepSummaryMetric({
  sleepData,
}: { sleepData: SleepSummaryWithTarget }) {
  // Exempel: räkna ut skillnad i minuter
  const actual = sleepData.startTime?.slice(11, 16) ?? '';
  const target = sleepData.targetBedtime;
  // ...beräkna differenceMinutes här...

  return (
    <View>
      <Text>{`Your bedtime: ${actual}`}</Text>
      <Text>{`Target: ${target}`}</Text>
      {/* ... */}
    </View>
  );
}