import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { calculateRestingHRMetrics } from '@/utils/restingHRCalculations';
import { HRVSummary } from '@/wearables/types';

interface RestingHRMetricProps {
  hrvData: HRVSummary[];
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function RestingHRMetric({ hrvData, showDivider = false, onPress, isSelected = false }: Readonly<RestingHRMetricProps>) {
  const { colors } = useTheme();
  const { restingHR, restingHRDelta } = calculateRestingHRMetrics(hrvData);
  const content = (
    <View style={styles.contentContainer}>
      <ThemedText type="label">Resting HR</ThemedText>
      <View style={styles.metricValueContainer}>
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

  const containerStyle = [
    styles.metricContainer,
    isSelected && { backgroundColor: colors.overlayLight, borderColor: colors.accentStrong },
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          containerStyle,
          pressed && !isSelected && { backgroundColor: colors.overlayLight },
        ]}
      >
        {content}
        {showDivider && <View pointerEvents="none" style={[styles.divider, { backgroundColor: colors.textWeak }]} />}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle}>
      {content}
      {showDivider && <View pointerEvents="none" style={[styles.divider, { backgroundColor: colors.textWeak }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  metricContainer: {
    flex: 1,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
  },
  contentContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  divider: {
    position: 'absolute',
    top: 16,
    right: 0,
    bottom: 16,
    width: 1,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});
