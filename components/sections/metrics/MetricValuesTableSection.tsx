import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { toLocalDateKey } from '@/utils/metricDateUtils';

type MetricValueEntry = MetricEntry;

function getEntryDate(recordedAt: string) {
  const date = new Date(recordedAt);
  return Number.isFinite(date.getTime()) ? toLocalDateKey(date) : recordedAt.slice(0, 10);
}

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
  virtualized?: boolean;
  header?: React.ReactNode;
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
  virtualized = false,
  header,
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
  const { t, i18n } = useTranslation();
  const showTime = React.useMemo(() => {
    const dates = new Set<string>();
    for (const entry of entries) {
      const date = getEntryDate(entry.recordedAt);
      if (dates.has(date)) return true;
      dates.add(date);
    }
    return false;
  }, [entries]);
  const timeFormatter = React.useMemo(
    () => new Intl.DateTimeFormat(i18n?.language, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
    [i18n?.language]
  );
  const timeHeading = showTime ? (
    <ThemedText style={styles.timeCell} type="caption">
      {t('common:general.time')}
    </ThemedText>
  ) : null;
  const [batch, setBatch] = React.useState({ entries, count: 60 });
  const count = batch.entries === entries ? batch.count : 60;
  const frames = React.useRef<number[]>([]);
  const loadingMore = React.useRef(false);
  React.useEffect(
    () => () => {
      frames.current.forEach(cancelAnimationFrame);
      frames.current = [];
      loadingMore.current = false;
    },
    [entries]
  );
  const loadMore = () => {
    if (loadingMore.current || count >= entries.length) return;
    loadingMore.current = true;
    frames.current = [
      requestAnimationFrame(() => {
        frames.current = [
          requestAnimationFrame(() => {
            setBatch(current => ({ entries, count: Math.min((current.entries === entries ? current.count : 60) + 60, entries.length) }));
            loadingMore.current = false;
            frames.current = [];
          }),
        ];
      }),
    ];
  };
  const addButtonTitle = t('metricValuesTableSection.addButton');
  const addSleepBatchButtonTitle = t('metricValuesTableSection.addSleepBatchButton');
  const renderEntry = ({ item: entry, index }: { item: MetricValueEntry; index: number }) => (
    <SwipeableRow
      key={`${entry.metricId}-${entry.recordedAt}-${entry.value}`}
      onEdit={onEditEntry ? () => onEditEntry(entry) : undefined}
      onDelete={onDeleteEntry ? () => onDeleteEntry(entry) : undefined}
      containerStyle={styles.swipeRowContent}
    >
      <View style={[styles.registeredEntriesRow, { backgroundColor: index % 2 === 0 ? colors.background : colors.cardBackground }]}>
        <ThemedText style={styles.tableCellSmall} type="caption">
          {getEntryDate(entry.recordedAt)}
        </ThemedText>
        {showTime && (
          <ThemedText style={styles.timeCell} type="caption">
            {Number.isFinite(new Date(entry.recordedAt).getTime()) ? timeFormatter.format(new Date(entry.recordedAt)) : '—'}
          </ThemedText>
        )}
        <ThemedText style={styles.tableCellSmall} type="caption">
          {formatMetricValue(entry)}
        </ThemedText>
        <ThemedText style={styles.tableCellLarge} type="caption">
          {entry.notes || ''}
        </ThemedText>
        <ThemedText type="default" style={[styles.icon, { color: colors.textLight || '#888' }]}>
          ⋮
        </ThemedText>
      </View>
    </SwipeableRow>
  );

  if (virtualized) {
    return (
      <BottomSheetFlatList<MetricValueEntry>
        data={entries.slice(0, count)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          count < entries.length ? <ActivityIndicator accessibilityRole="progressbar" color={colors.primary} style={styles.loadingIndicator} /> : null
        }
        keyExtractor={entry => `${entry.metricId}-${entry.recordedAt}-${entry.value}`}
        renderItem={renderEntry}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={5}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {header}
            <AppButton onPress={onAddPress} style={styles.addButton} title={`+ ${addButtonTitle}`} />
            {onAddSleepBatchPress && <AppButton onPress={onAddSleepBatchPress} style={styles.addButton} title={addSleepBatchButtonTitle} variant="secondary" />}
            <ThemedText type="defaultSemiBold" style={styles.registeredEntriesTitle}>
              {registeredValuesTitle}
            </ThemedText>
            <View style={[styles.registeredEntriesRow, { backgroundColor: colors.cardBackground }]}>
              <ThemedText style={styles.tableCellSmall} type="caption">
                {dateLabel}
              </ThemedText>
              {timeHeading}
              <ThemedText style={styles.tableCellSmall} type="caption">
                {valueLabel}
              </ThemedText>
              <ThemedText style={styles.tableCellLarge} type="caption">
                {notesLabel}
              </ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={<ThemedText>{emptyText}</ThemedText>}
      />
    );
  }

  return (
    <>
      <AppButton onPress={onAddPress} style={styles.addButton} title={`+ ${addButtonTitle}`} />
      {onAddSleepBatchPress && <AppButton onPress={onAddSleepBatchPress} style={styles.addButton} variant="secondary" title={addSleepBatchButtonTitle} />}

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
              <ThemedText style={styles.tableCellSmall} type="caption">
                {dateLabel}
              </ThemedText>
              {timeHeading}
              <ThemedText style={styles.tableCellSmall} type="caption">
                {valueLabel}
              </ThemedText>
              <ThemedText style={styles.tableCellLarge} type="caption">
                {notesLabel}
              </ThemedText>
            </View>
            {entries.map((entry, index) => renderEntry({ item: entry, index }))}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  timeCell: { width: 56, paddingVertical: 8, paddingHorizontal: 4 },
  loadingIndicator: { marginVertical: 16 },
  listContent: { padding: 16, paddingBottom: 32 },
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
