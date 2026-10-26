import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { TrainingLogEntry } from '@/app/context/storage/training/trainingTypes';
import { metrics } from '@/locales/metrics';
import { summarizeTrainingDay } from '@/utils/trainingMetrics';

import { ThemedText } from '../ThemedText';
import { Card } from '../ui/Card';
import { IconSymbol } from '../ui/IconSymbol';

type Props = { readonly entries: TrainingLogEntry[] };

export function DailyTrainingSummary({ entries }: Props) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const summary = React.useMemo(() => summarizeTrainingDay(entries), [entries]);
  const stats = [
    {
      id: 'time',
      icon: 'stopwatch' as const,
      label: t('training:dailySummary.activeTime'),
      value: `${Math.round(summary.activeMinutes)} ${t('training:trainingMinutesUnit')}`,
      color: colors.primary,
      background: colors.primaryVeryWeak,
    },
    {
      id: 'distance',
      icon: 'locationPin' as const,
      label: t('training:dailySummary.distance'),
      value: summary.distanceKm === undefined ? '—' : `${Number(summary.distanceKm.toFixed(2)).toLocaleString(i18n?.resolvedLanguage ?? i18n?.language)} km`,
      color: colors.intenseActivity,
      background: colors.goldTransparent,
    },
    {
      id: 'sessions',
      icon: 'trainingGym' as const,
      label: t('training:dailySummary.sessions'),
      value: t('training:dailySummary.sessionCount', { count: summary.sessionCount }),
      color: colors.chart.steps,
      background: colors.overlayLight,
    },
  ];
  const bands = [
    {
      id: 'low' as const,
      icon: 'trainingWalking' as const,
      label: t('training:dailySummary.lowIntensity'),
      value: summary.lowIntensityMinutes,
      color: colors.textMuted,
      background: colors.overlayLight,
    },
    {
      id: 'moderate_minutes' as const,
      icon: metrics.moderate_minutes.iconName,
      label: t('metrics:moderateMinutes.label'),
      value: summary.moderateMinutes,
      color: colors.primary,
      background: colors.primaryVeryWeak,
    },
    {
      id: 'intensity_minutes' as const,
      icon: metrics.intensity_minutes.iconName,
      label: t('metrics:intensityMinutes.label'),
      value: summary.intenseMinutes,
      color: colors.intenseActivity,
      background: colors.goldTransparent,
    },
    {
      id: 'high_intensity_minutes' as const,
      icon: metrics.high_intensity_minutes.iconName,
      label: t('training:dailySummary.highIntensity'),
      value: summary.highIntensityMinutes,
      color: colors.error,
      background: colors.surfaceRed,
    },

  ];

  return (
    <Card>
      <ThemedText type="title3">{t('training:dailySummary.title')}</ThemedText>
      <ThemedText type="caption" style={{ color: colors.textMuted }}>
        {t('training:dailySummary.loggedSessions', { count: summary.sessionCount })}
      </ThemedText>
      <View style={styles.statsRow}>
        {stats.map((item, index) => (
          <View key={item.id} style={[styles.statColumn, index > 0 && styles.divider, { borderColor: colors.borderLight }]}>
            <View style={[styles.statIcon, { backgroundColor: item.background }]}>
              <IconSymbol name={item.icon} size={18} color={item.color} />
            </View>
            <View style={styles.statText}>
              <ThemedText type="caption" style={styles.smallLabel}>
                {item.label}
              </ThemedText>
              <ThemedText type="defaultSemiBold">{item.value}</ThemedText>
            </View>
          </View>
        ))}
      </View>
      <View accessible accessibilityLabel={t('training:dailySummary.distribution')} style={[styles.bar, { backgroundColor: colors.overlayLight }]}>
        {bands.map(band => (
          <View
            key={band.id}
            style={[
              styles.barSegment,
              { backgroundColor: band.color, width: `${summary.classifiedMinutes > 0 ? ((band.value ?? 0) / summary.classifiedMinutes) * 100 : 0}%` },
            ]}
          />
        ))}
      </View>
      <View style={styles.intensityRow}>
        {bands.map((band, index) => (
          <View key={band.id} style={[styles.intensityColumn, index > 0 && styles.divider, { borderColor: colors.borderLight }]}>
            <View style={[styles.bandIcon, { backgroundColor: band.background }]}>
              <IconSymbol name={band.icon} size={18} color={band.color} />
            </View>
            <View style={styles.bandText}>
              <ThemedText type="caption" style={styles.smallLabel}>
                {band.label}
              </ThemedText>
              <ThemedText type="defaultSemiBold">
                {band.value === undefined ? '—' : `${Math.round(band.value)} ${t('training:trainingMinutesUnit')}`}
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {band.value === undefined || summary.classifiedMinutes === 0 ? '—' : `${Math.round((band.value / summary.classifiedMinutes) * 100)}%`}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

    </Card>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', marginTop: 14, marginBottom: 16 },
  statColumn: { flex: 1, paddingHorizontal: 6, gap: 6, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  statText: { flex: 1, minWidth: 48, gap: 2 },
  bandText: { flex: 1, minWidth: 40, gap: 2 },
  smallLabel: { fontSize: 11 },
  statIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  divider: { borderLeftWidth: 1 },
  barSegment: { height: '100%' },
  bar: { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden' },
  intensityRow: { flexDirection: 'row', marginTop: 14 },
  intensityColumn: { flex: 1, paddingHorizontal: 4, gap: 4, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  bandIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
