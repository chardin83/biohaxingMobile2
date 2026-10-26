import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { metrics } from '@/locales/metrics';
import { getCurrentWeekMetricTotal } from '@/utils/metricDateUtils';

const MINIMUM_MINUTES = 150;
const MAXIMUM_MINUTES = 300;

export function WeeklyWeightedTrainingMinutesMetric() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getMetricHistory } = useStorage();
  const total = getCurrentWeekMetricTotal(getMetricHistory('weighted_training_minutes'));
  const moderate = getCurrentWeekMetricTotal(getMetricHistory('moderate_minutes'));
  const vigorous = getCurrentWeekMetricTotal(getMetricHistory('intensity_minutes'));
  const progress = Math.min(total ?? 0, MAXIMUM_MINUTES) / MAXIMUM_MINUTES;

  return (
    <View style={styles.container}>
      <ThemedText type="label">{t('metrics:weightedTrainingMinutes.name')}</ThemedText>
      <View style={styles.valueRow}>
        <ThemedText type="title2">{total === undefined ? '—' : Math.round(total)}</ThemedText>
        <ThemedText type="caption">{t('metrics:weightedTrainingMinutes.targetRange')}</ThemedText>
      </View>
      <View
        style={styles.progress}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('metrics:weightedTrainingMinutes.name')}
        accessibilityValue={{ min: 0, max: MAXIMUM_MINUTES, now: total === undefined ? undefined : Math.min(total, MAXIMUM_MINUTES) }}
      >
        <View style={[styles.track, { backgroundColor: colors.borderLight }]}>
          <View style={[styles.fill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
        </View>
        <View pointerEvents="none" style={[styles.marker, { backgroundColor: colors.text, left: `${MINIMUM_MINUTES / MAXIMUM_MINUTES * 100}%` }]} />
      </View>
      <View style={styles.scale}>
        <ThemedText type="caption" style={styles.scaleStart}>0</ThemedText>
        <ThemedText type="caption" style={styles.scaleMiddle}>{MINIMUM_MINUTES}</ThemedText>
        <ThemedText type="caption" style={styles.scaleEnd}>{MAXIMUM_MINUTES}</ThemedText>
      </View>
      <View style={[styles.breakdown, { backgroundColor: colors.overlayLight, borderColor: colors.borderLight }]}>
        {[
          { id: 'moderate_minutes' as const, label: 'metrics:moderateMinutes.label', value: moderate, weight: 1, color: colors.primary },
          { id: 'intensity_minutes' as const, label: 'metrics:intensityMinutes.label', value: vigorous, weight: 2, color: colors.intenseActivity },
        ].map((item, index) => (
          <View key={item.id} style={styles.breakdownTile}>
            <IconSymbol name={metrics[item.id].iconName} size={40} color={item.color} />
            <View style={styles.breakdownText}>
              <ThemedText type="label">{t(item.label)}</ThemedText>
              <ThemedText type="defaultSemiBold">
                {item.value === undefined ? '—' : Math.round(item.value)} {t('training:trainingMinutesUnit')}
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {t('metrics:weightedTrainingMinutes.weighting', { weight: item.weight })}
              </ThemedText>
            </View>
            {index === 0 && <View pointerEvents="none" style={[styles.breakdownDivider, { backgroundColor: colors.borderLight }]} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', padding: 8, gap: 6 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 8 },
  progress: { marginTop: 8, height: 10 },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  marker: { position: 'absolute', top: -3, width: 2, height: 16, marginLeft: -1 },
  scale: { flexDirection: 'row' },
  breakdown: { flexDirection: 'row', marginTop: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12 },
  breakdownTile: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  breakdownDivider: { position: 'absolute', right: 0, top: 12, bottom: 12, width: 1 },
  breakdownText: { flex: 1, gap: 4 },
  scaleStart: { flex: 1, textAlign: 'left' },
  scaleMiddle: { flex: 1, textAlign: 'center' },
  scaleEnd: { flex: 1, textAlign: 'right' },
});
