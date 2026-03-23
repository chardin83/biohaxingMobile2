import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { type MetricEntry, useStorage } from '@/app/context/StorageContext';
import { RegisterMetricBottomSheet } from '@/components/RegisterMetricBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { metrics } from '@/locales/metrics';

type MetricValueEntry = MetricEntry;

type MetricValuesTableSectionProps = {
  entries: MetricValueEntry[];
  colors: any;
  emptyText: string;
  onAddPress: () => void;
  onEditEntry?: (entry: MetricValueEntry) => void;
  onDeleteEntry?: (entry: MetricValueEntry) => void;
  addButtonTitle: string;
  registeredValuesTitle: string;
  dateLabel: string;
  valueLabel: string;
  unitLabel: string;
  notesLabel: string;
};

export function MetricValuesTableSection({
  entries,
  colors,
  emptyText,
  onAddPress,
  onEditEntry,
  onDeleteEntry,
  addButtonTitle,
  registeredValuesTitle,
  dateLabel,
  valueLabel,
  unitLabel,
  notesLabel,
}: Readonly<MetricValuesTableSectionProps>) {
  return (
    <>
      <AppButton
        onPress={onAddPress}
        style={styles.addButton}
        title={`+ ${addButtonTitle}`}
      />

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
              <ThemedText style={styles.tableCellSmall} type="caption">{unitLabel}</ThemedText>
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
                  <ThemedText style={styles.tableCellSmall} type="caption">{entry.value}</ThemedText>
                  <ThemedText style={styles.tableCellSmall} type="caption">{entry.unit}</ThemedText>
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

type MetricValuesBottomSheetProps = {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  metricId: string | null;
  metricName?: string;
};

export function MetricValuesBottomSheet({ bottomSheetRef, metricId, metricName }: Readonly<MetricValuesBottomSheetProps>) {
  const { colors } = useTheme();
  const { t } = useTranslation(['common', 'metrics']);
  const { addMetricEntry, getMetricHistory, setMetricEntries } = useStorage();

  const registerBottomSheetRef = React.useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = React.useState(1);
  const [isRegisterSheetVisible, setIsRegisterSheetVisible] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<MetricValueEntry | null>(null);
  const [metricValue, setMetricValue] = React.useState('');
  const [metricUnit, setMetricUnit] = React.useState('');
  const [metricNotes, setMetricNotes] = React.useState('');
  const [recordedAt, setRecordedAt] = React.useState(() => new Date());

  const snapPoints = React.useMemo(() => ['30%', '55%', '90%'], []);

  const registeredEntries = React.useMemo(() => {
    if (!metricId) return [];

    return [...getMetricHistory(metricId)].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  }, [getMetricHistory, metricId]);

  const handleOpenAddMetricSheet = React.useCallback(() => {
    if (!metricId) return;
    setEditingEntry(null);
    const metric = metrics[metricId];
    if (metric && metric.units.length > 0) {
      setMetricUnit(metric.units[0].unit);
    } else {
      setMetricUnit('');
    }
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
    setIsRegisterSheetVisible(true);
  }, [metricId]);

  const handleCloseAddMetricSheet = React.useCallback(() => {
    setIsRegisterSheetVisible(false);
    setEditingEntry(null);
    setMetricValue('');
    setMetricNotes('');
    setRecordedAt(new Date());
  }, []);

  const isSameEntry = React.useCallback((left: MetricValueEntry, right: MetricValueEntry) => {
    return (
      left.metricId === right.metricId
      && left.recordedAt === right.recordedAt
      && left.value === right.value
      && left.unit === right.unit
      && (left.notes ?? '') === (right.notes ?? '')
      && (left.planTipId ?? '') === (right.planTipId ?? '')
    );
  }, []);

  const handleEditEntry = React.useCallback((entry: MetricValueEntry) => {
    setEditingEntry(entry);
    setMetricValue(String(entry.value));
    setMetricUnit(entry.unit);
    setMetricNotes(entry.notes ?? '');

    const parsedDate = new Date(entry.recordedAt);
    setRecordedAt(Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
    setIsRegisterSheetVisible(true);
  }, []);

  const performDeleteEntry = React.useCallback((entry: MetricValueEntry) => {
    setMetricEntries(prev => {
      let removed = false;
      return prev.filter(current => {
        if (!removed && isSameEntry(current, entry)) {
          removed = true;
          return false;
        }
        return true;
      });
    });
  }, [isSameEntry, setMetricEntries]);

  const handleDeleteEntry = React.useCallback((entry: MetricValueEntry) => {
    Alert.alert(
      t('common:metricValuesBottomSheet.confirmDeleteTitle'),
      t('common:metricValuesBottomSheet.confirmDeleteMessage'),
      [
        {
          text: t('common:general.cancel'),
          style: 'cancel',
        },
        {
          text: t('common:metricValuesBottomSheet.confirmDeleteAction'),
          style: 'destructive',
          onPress: () => performDeleteEntry(entry),
        },
      ]
    );
  }, [performDeleteEntry, t]);

  const handleSaveMetric = React.useCallback(() => {
    if (!metricId || !metricValue) return;

    const value = Number.parseFloat(metricValue);
    if (Number.isNaN(value)) return;

    const metric = metrics[metricId];

    const nextEntry: MetricEntry = {
      metricId,
      value,
      unit: metricUnit || metric?.canonicalUnit || '',
      recordedAt: recordedAt.toISOString(),
      notes: metricNotes || undefined,
      planTipId: editingEntry?.planTipId,
    };

    if (editingEntry) {
      setMetricEntries(prev => {
        let replaced = false;
        const next = prev.map(current => {
          if (!replaced && isSameEntry(current, editingEntry)) {
            replaced = true;
            return nextEntry;
          }
          return current;
        });

        if (!replaced) {
          next.push(nextEntry);
        }

        return next;
      });
    } else {
      addMetricEntry(nextEntry);
    }

    handleCloseAddMetricSheet();
  }, [addMetricEntry, editingEntry, handleCloseAddMetricSheet, isSameEntry, metricId, metricNotes, metricUnit, metricValue, recordedAt, setMetricEntries]);

  const handleSheetChange = React.useCallback((index: number) => {
    if (index >= 0) {
      setSheetIndex(index);
    }
  }, []);

  if (!metricId) {
    return null;
  }

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.background }}
        animateOnMount
        index={-1}
        onChange={handleSheetChange}
      >
        <BottomSheetView style={[styles.contentContainer, { backgroundColor: colors.background }]}> 
          <ThemedText type="title3" style={styles.title}>
            {metricName ?? t(`metrics:${metricId}.name`)}
          </ThemedText>

          <MetricValuesTableSection
            entries={registeredEntries}
            colors={colors}
            emptyText={t('metrics:trendChart.empty', { metric: metricName ?? t(`metrics:${metricId}.name`) })}
            onAddPress={handleOpenAddMetricSheet}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            addButtonTitle={t('common:metricValuesBottomSheet.addButton')}
            registeredValuesTitle={t('common:metricValuesBottomSheet.registeredValuesTitle')}
            dateLabel={t('common:metricValuesBottomSheet.columns.date')}
            valueLabel={t('common:metricValuesBottomSheet.columns.value')}
            unitLabel={t('common:metricValuesBottomSheet.columns.unit')}
            notesLabel={t('common:metricValuesBottomSheet.columns.notes')}
          />
        </BottomSheetView>
      </BottomSheet>

      <RegisterMetricBottomSheet
        bottomSheetRef={registerBottomSheetRef}
        isVisible={isRegisterSheetVisible}
        initialSnapIndex={sheetIndex}
        snapPoints={['30%', '55%', '90%']}
        onClose={handleCloseAddMetricSheet}
        onSave={handleSaveMetric}
        metricId={metricId}
        metricName={metricName ?? t(`metrics:${metricId}.name`)}
        metricValue={metricValue}
        setMetricValue={setMetricValue}
        metricUnit={metricUnit}
        setMetricUnit={setMetricUnit}
        metricNotes={metricNotes}
        setMetricNotes={setMetricNotes}
        recordedAt={recordedAt}
        setRecordedAt={setRecordedAt}
        colors={colors}
        units={metricId && metrics[metricId]?.units ? metrics[metricId].units : []}
      />
    </Portal>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 16,
  },
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
