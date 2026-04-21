
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';

import { ThemedText } from '../ThemedText';

interface VO2MaxMetricProps {
  trend?: number; // Percentage change
  showDivider?: boolean;
  onPress?: () => void;
  isSelected?: boolean;
}

export function VO2MaxMetric({ trend, showDivider = false, onPress, isSelected = false }: Readonly<VO2MaxMetricProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const vo2maxEntry = getMetricHistory('vo2_max').at(-1);
  const vo2max = vo2maxEntry?.value ?? null;
  // Här kan du lägga till logik för status om det behövs, t.ex. baserat på vo2max-värdet
  const status = undefined;

  const content = (
    <View style={styles.contentContainer}>
      <ThemedText type="label">{t('metrics:vo2_max.shortName', { defaultValue: t('metrics:vo2_max.name') })}</ThemedText>
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
        {showDivider && <View pointerEvents="none" style={[styles.divider, { backgroundColor: colors.borderLight }]} />}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle}>
      {content}
      {showDivider && <View pointerEvents="none" style={[styles.divider, { backgroundColor: colors.borderLight }]} />}
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
});
