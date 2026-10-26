import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { isImportedTraining } from '@/app/context/storage/training/trainingImport';
import type { TrainingLogEntry } from '@/app/context/storage/training/trainingTypes';
import { TRAINING_ACTIVITY_LABEL_KEYS, TRAINING_ACTIVITY_OPTIONS } from '@/types/trainingActivityOptions';
import { toLocalDateKey } from '@/utils/metricDateUtils';

import { Collapsible } from './Collapsible';
import { ThemedText } from './ThemedText';
import { Card } from './ui/Card';
import { IconSymbol } from './ui/IconSymbol';
import { SwipeableRow } from './ui/SwipeableRow';

type LoggedTrainingSectionProps = {
  entries: TrainingLogEntry[];
  onEdit: (entryId: string) => void;
  onDelete: (entryId: string) => void;
};

const INTENSITY_LABEL_KEYS: Record<NonNullable<TrainingLogEntry['intensity']>, string> = {
  low: 'training:trainingIntensityLow',
  medium: 'training:trainingIntensityMedium',
  high: 'training:trainingIntensityHigh',
};

export const LoggedTrainingSection: React.FC<LoggedTrainingSectionProps> = ({ entries, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const locale = i18n?.resolvedLanguage ?? i18n?.language;

  const formatSessionTime = (entry: TrainingLogEntry) => {
    const date = new Date(entry.startTime ?? `${entry.date}T12:00:00`);
    if (!Number.isFinite(date.getTime())) return undefined;
    const today = toLocalDateKey(date) === toLocalDateKey(new Date());
    const label = today
      ? t('common:today')
      : date.toLocaleDateString(locale, {
          day: 'numeric',
          month: 'short',
          year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
        });
    return entry.startTime ? `${label} ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}` : label;
  };

  return (
    <Card>
      <Collapsible title={`${t('training:trainingListTitle')} (${entries.length})`} titleType="defaultSemiBold" contentStyle={styles.list}>
        {entries.map(entry => {
          const imported = isImportedTraining(entry);
          const activity = entry.activityType === 'other' && entry.activityName ? entry.activityName : t(TRAINING_ACTIVITY_LABEL_KEYS[entry.activityType]);
          const icon = TRAINING_ACTIVITY_OPTIONS.find(option => option.key === entry.activityType)?.icon ?? 'trainingGym';
          const source = imported ? (entry.sourceName ?? entry.sourceId ?? t(`metrics:origins.${entry.origin}`)) : t('training:trainingSourceManual');
          const intensityValues = [
            { key: 'moderate', value: entry.moderateMinutes, label: 'training:trainingModerateMinutesCompact' },
            { key: 'vigorous', value: entry.intensityMinutes, label: 'training:trainingIntenseMinutesCompact' },
            { key: 'high', value: entry.highIntensityMinutes, label: 'training:trainingHighIntensityMinutesCompact' },
          ].filter(item => typeof item.value === 'number' && Number.isFinite(item.value));

          return (
            <View key={entry.id} style={[styles.sessionCard, { borderColor: colors.borderLight }]}>
              <SwipeableRow
                onEdit={imported ? undefined : () => onEdit(entry.id)}
                onDelete={() => onDelete(entry.id)}
                containerStyle={[styles.sessionContent, { backgroundColor: colors.cardBackground }]}
              >
                <View style={styles.sessionRow}>
                  <View style={[styles.activityIcon, { backgroundColor: colors.primaryVeryWeak, borderColor: colors.primaryVeryWeak }]}>
                    <IconSymbol name={icon} size={36} color={colors.primary} />
                  </View>
                  <View style={styles.sessionMain}>
                    <View style={styles.heading}>
                      <Pressable disabled={imported} onPress={() => onEdit(entry.id)} style={styles.title} accessibilityRole={imported ? undefined : 'button'}>
                        <ThemedText type="defaultSemiBold">{activity}</ThemedText>
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {formatSessionTime(entry)}
                        </ThemedText>
                      </Pressable>
                      <View style={[styles.sourceBadge, { backgroundColor: colors.overlayLight, borderColor: colors.borderLight }]}>
                        <ThemedText type="caption" numberOfLines={1}>
                          {source}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <IconSymbol name="stopwatch" size={19} color={colors.chart.steps} />
                    <ThemedText type="caption">
                      {Math.round(entry.durationMinutes)} {t('training:trainingMinutesUnit')}
                    </ThemedText>
                  </View>
                  {typeof entry.distanceKm === 'number' && Number.isFinite(entry.distanceKm) && (
                    <View style={styles.stat}>
                      <IconSymbol name="locationPin" size={19} color={colors.chart.steps} />
                      <ThemedText type="caption">{Number(entry.distanceKm.toFixed(2)).toLocaleString(locale)} km</ThemedText>
                    </View>
                  )}
                  {typeof entry.averageHeartRate === 'number' && Number.isFinite(entry.averageHeartRate) && (
                    <View style={styles.stat}>
                      <IconSymbol name="heart" size={19} color={colors.error} />
                      <ThemedText type="caption">{Math.round(entry.averageHeartRate)} bpm</ThemedText>
                    </View>
                  )}
                </View>
                {intensityValues.length > 0 && (
                  <View style={styles.intensities}>
                    {intensityValues.map((item, index) => (
                      <View
                        key={item.key}
                        style={[styles.intensityItem, index > 0 && styles.intensityDivider, index > 0 && { borderLeftColor: colors.border }]}
                      >
                        <ThemedText type="caption" style={{ color: colors.textMuted }}>
                          {t(item.label, { value: Math.round(item.value!) })}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                )}
                {entry.intensity && (
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    {t(INTENSITY_LABEL_KEYS[entry.intensity])}
                  </ThemedText>
                )}
                {entry.notes && (
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    {entry.notes}
                  </ThemedText>
                )}
              </SwipeableRow>
            </View>
          );
        })}
      </Collapsible>
    </Card>
  );
};

const styles = StyleSheet.create({
  list: { marginLeft: 0, marginTop: 12, gap: 10 },
  sessionCard: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  sessionContent: { padding: 12, gap: 12, width: '100%' },
  sessionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  activityIcon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sessionMain: { flex: 1, gap: 12, minWidth: 0 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  title: { flex: 1, minWidth: 0, gap: 2 },
  sourceBadge: { maxWidth: '40%', borderRadius: 16, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 8 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  intensities: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, rowGap: 6 },
  intensityItem: { justifyContent: 'center' },
  intensityDivider: { borderLeftWidth: 1, paddingLeft: 8 },
});
