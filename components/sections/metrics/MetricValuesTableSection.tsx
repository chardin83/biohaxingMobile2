import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet,View } from 'react-native';

import { MetricEntry } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { SwipeableRow } from '@/components/ui/SwipeableRow';

type MetricValueEntry = MetricEntry;

function formatDuration(minutesTotal: number) {
  const roundedMinutes = Math.max(0, Math.round(minutesTotal));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function formatMetricValue(entry: MetricValueEntry) {
  if (entry.metricId === 'sleep_duration' || entry.metricId === 'deep_sleep' || entry.metricId === 'rem_sleep') {
    return formatDuration(entry.value);
  }
  if (entry.metricId === 'sleep_bedtime') {
    const normalizedMinutes = ((Math.round(entry.value) % 1440) + 1440) % 1440;
    const hours = Math.floor(normalizedMinutes / 60);
    const minutes = normalizedMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  return String(entry.value);
}

type MetricValuesTableSectionProps = {
  entries: MetricValueEntry[];
  colors: any;
  emptyText: string;
  onAddPress: () => void;
  onEditEntry?: (entry: MetricValueEntry) => void;
  onDeleteEntry?: (entry: MetricValueEntry) => void;
  onAddSleepBatchPress?: () => void;
  registeredValuesTitle: string;
  dateLabel: string;
  valueLabel: string;
  notesLabel: string;
};

export function MetricValuesTableSection({
  entries,
  colors,
  emptyText,
  onAddPress,
  onEditEntry,
  onDeleteEntry,
  onAddSleepBatchPress,
  registeredValuesTitle,
  dateLabel,
  valueLabel,
  notesLabel,
}: Readonly<MetricValuesTableSectionProps>) {
  const { t } = useTranslation();
  const addButtonTitle = t('metricValuesTableSection.addButton');
  const addSleepBatchButtonTitle = t('metricValuesTableSection.addSleepBatchButton');
  return (
    <>
      <AppButton
        onPress={onAddPress}
        style={styles.addButton}
        title={`+ ${addButtonTitle}`}
      />
      {onAddSleepBatchPress && (
        <AppButton
          onPress={onAddSleepBatchPress}
          style={styles.addButton}
          variant="secondary"
          title={addSleepBatchButtonTitle}
        />
      )}

      {entries.length === 0 ? (
        <ThemedText type="default" style={{ color: colors.textMuted }}>
          {emptyText}
        </ThemedText>
      ) : (
        <View style={styles.registeredEntriesSection}>
          <ThemedText type="defaultSemiBold" style={styles.registeredEntriesTitle}>
            {registeredValuesTitle}
          </ThemedText>
          <View style={[styles.registeredEntriesTable, { borderColor: colors.border }]}> 
            <View style={[styles.registeredEntriesRow, { backgroundColor: colors.cardBackground }]}> 
              <ThemedText style={styles.tableCellSmall} type="caption">{dateLabel}</ThemedText>
              <ThemedText style={styles.tableCellSmall} type="caption">{valueLabel}</ThemedText>
              <ThemedText style={styles.tableCellLarge} type="caption">{notesLabel}</ThemedText>
            </View>
            {entries.map((entry, index) => (
              <SwipeableRow
                key={`${entry.metricId}-${entry.recordedAt}-${entry.value}`}
                onEdit={onEditEntry ? () => onEditEntry(entry) : undefined}
                onDelete={onDeleteEntry ? () => onDeleteEntry(entry) : undefined}
                containerStyle={styles.swipeRowContent}
              >
                <View style={[styles.registeredEntriesRow, { backgroundColor: index % 2 === 0 ? colors.background : colors.cardBackground }]}> 
                  <ThemedText style={styles.tableCellSmall} type="caption">{entry.recordedAt.slice(0, 10)}</ThemedText>
                  <ThemedText style={styles.tableCellSmall} type="caption">{formatMetricValue(entry)}</ThemedText>
                  <ThemedText style={styles.tableCellLarge} type="caption">{entry.notes || ''}</ThemedText>
                  <ThemedText type="default" style={[styles.icon, { color: colors.textLight || '#888' }]}> 
                    ⋮
                  </ThemedText>
                </View>
              </SwipeableRow>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    marginTop: 4,
    marginBottom: 8,
  },
  registeredEntriesSection: {
    marginVertical: 12,
  },
  registeredEntriesTitle: {
    marginBottom: 4,
  },
  registeredEntriesTable: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  registeredEntriesRow: {
    flexDirection: 'row',
  },
  tableCellSmall: {
    flex: 1,
    padding: 8,
  },
  tableCellLarge: {
    flex: 2,
    padding: 8,
  },
  icon: {
    width: 20,
    textAlign: 'center',
    alignSelf: 'center',
    marginRight: 6,
  },
  swipeRowContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 0,
  },
});
