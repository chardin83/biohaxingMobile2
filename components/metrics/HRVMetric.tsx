import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { calculateHRVMetrics } from '@/utils/hrvCalculations';
import { HRVSummary } from '@/wearables/types';

interface HRVMetricProps {
  readonly hrvData: HRVSummary[];
  readonly showDivider?: boolean;
  readonly onPress?: () => void;
  readonly isSelected?: boolean;
}

export function HRVMetric({ hrvData, showDivider = false, onPress, isSelected = false }: HRVMetricProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { hrv, hrvDelta } = calculateHRVMetrics(hrvData);
  const content = (
    <View style={styles.contentContainer}>
      <ThemedText type="label">{t('metrics:hrv.shortName', { defaultValue: t('metrics:hrv.name') })}</ThemedText>
      <View style={styles.metricValueContainer}>
        <ThemedText type="title2">{hrv ?? '—'}</ThemedText>
        {hrv && <ThemedText type="caption"> ms</ThemedText>}
      </View>
      <ThemedText type="explainer" style={{ color: colors.accentStrong }}>
        {hrvDelta > 0 ? '+' : ''}
        {hrvDelta}% 7d avg
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
