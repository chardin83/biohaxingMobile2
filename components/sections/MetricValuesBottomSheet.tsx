import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Portal } from 'react-native-paper';

import { type MetricEntry, useStorage } from '@/app/context/StorageContext';
import { RegisterMetricBottomSheet } from '@/components/RegisterMetricBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { DateTimeInput } from '@/components/ui/DateTimeInput';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { metrics } from '@/locales/metrics';

type MetricValueEntry = MetricEntry;

const SLEEP_RELATED_METRIC_IDS = new Set(['sleep_bedtime', 'sleep_duration', 'deep_sleep', 'rem_sleep']);

function minutesFromMidnight(value: Date) {
  return value.getHours() * 60 + value.getMinutes();
}

function formatClockTime(value: Date) {
  return value.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutesTotal: number) {
  const roundedMinutes = Math.max(0, Math.round(minutesTotal));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function getDurationFromTimes(bedtime: Date, wakeTime: Date) {
  let duration = minutesFromMidnight(wakeTime) - minutesFromMidnight(bedtime);
  if (duration <= 0) {
    duration += 1440;
  }
  return duration;
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
  addButtonTitle: string;
  onAddSleepBatchPress?: () => void;
  addSleepBatchButtonTitle?: string;
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
  addButtonTitle,
  onAddSleepBatchPress,
  addSleepBatchButtonTitle,
  registeredValuesTitle,
  dateLabel,
  valueLabel,
  notesLabel,
}: Readonly<MetricValuesTableSectionProps>) {
  return (
    <>
      <AppButton
        onPress={onAddPress}
        style={styles.addButton}
        title={`+ ${addButtonTitle}`}
      />
      {onAddSleepBatchPress && addSleepBatchButtonTitle && (
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
  const registerSleepBatchBottomSheetRef = React.useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = React.useState(1);
  const [isRegisterSheetVisible, setIsRegisterSheetVisible] = React.useState(false);
  const [isSleepBatchSheetVisible, setIsSleepBatchSheetVisible] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<MetricValueEntry | null>(null);
  const [metricValue, setMetricValue] = React.useState('');
  const [metricUnit, setMetricUnit] = React.useState('');
  const [metricNotes, setMetricNotes] = React.useState('');
  const [recordedAt, setRecordedAt] = React.useState(() => new Date());
  const [sleepBatchNotes, setSleepBatchNotes] = React.useState('');
  const [sleepBatchRecordedAt, setSleepBatchRecordedAt] = React.useState(() => new Date());
  const [sleepBatchBedtime, setSleepBatchBedtime] = React.useState(() => {
    const next = new Date();
    next.setHours(22, 30, 0, 0);
    return next;
  });
  const [sleepBatchWakeTime, setSleepBatchWakeTime] = React.useState(() => {
    const next = new Date();
    next.setHours(6, 30, 0, 0);
    return next;
  });
  const [sleepBatchDurationHours, setSleepBatchDurationHours] = React.useState('8');
  const [sleepBatchDurationMinutes, setSleepBatchDurationMinutes] = React.useState('00');
  const [sleepBatchDeepSleepHours, setSleepBatchDeepSleepHours] = React.useState('');
  const [sleepBatchDeepSleepMinutes, setSleepBatchDeepSleepMinutes] = React.useState('');
  const [sleepBatchRemSleepHours, setSleepBatchRemSleepHours] = React.useState('');
  const [sleepBatchRemSleepMinutes, setSleepBatchRemSleepMinutes] = React.useState('');
  const [showBatchBedtimePicker, setShowBatchBedtimePicker] = React.useState(false);
  const [showBatchWakePicker, setShowBatchWakePicker] = React.useState(false);

  const isSleepRelatedMetric = metricId ? SLEEP_RELATED_METRIC_IDS.has(metricId) : false;

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

  const resetSleepBatchState = React.useCallback(() => {
    const nextRecordedAt = new Date();
    const nextBedtime = new Date(nextRecordedAt);
    nextBedtime.setHours(22, 30, 0, 0);
    const nextWakeTime = new Date(nextRecordedAt);
    nextWakeTime.setHours(6, 30, 0, 0);
    const duration = getDurationFromTimes(nextBedtime, nextWakeTime);

    setSleepBatchRecordedAt(nextRecordedAt);
    setSleepBatchBedtime(nextBedtime);
    setSleepBatchWakeTime(nextWakeTime);
    setSleepBatchDurationHours(String(Math.floor(duration / 60)));
    setSleepBatchDurationMinutes(String(duration % 60).padStart(2, '0'));
    setSleepBatchDeepSleepHours('');
    setSleepBatchDeepSleepMinutes('');
    setSleepBatchRemSleepHours('');
    setSleepBatchRemSleepMinutes('');
    setSleepBatchNotes('');
    setShowBatchBedtimePicker(false);
    setShowBatchWakePicker(false);
  }, []);

  const handleOpenSleepBatchSheet = React.useCallback(() => {
    resetSleepBatchState();
    setIsSleepBatchSheetVisible(true);
  }, [resetSleepBatchState]);

  const handleCloseSleepBatchSheet = React.useCallback(() => {
    setIsSleepBatchSheetVisible(false);
  }, []);

  const applyDurationFromTimes = React.useCallback((nextBedtime: Date, nextWakeTime: Date) => {
    const duration = getDurationFromTimes(nextBedtime, nextWakeTime);
    setSleepBatchDurationHours(String(Math.floor(duration / 60)));
    setSleepBatchDurationMinutes(String(duration % 60).padStart(2, '0'));
  }, []);

  const handleBatchBedtimeChange = React.useCallback((_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowBatchBedtimePicker(false);
    }

    if (!selectedDate) {
      return;
    }

    setSleepBatchBedtime(selectedDate);
    applyDurationFromTimes(selectedDate, sleepBatchWakeTime);
  }, [applyDurationFromTimes, sleepBatchWakeTime]);

  const handleBatchWakeChange = React.useCallback((_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowBatchWakePicker(false);
    }

    if (!selectedDate) {
      return;
    }

    setSleepBatchWakeTime(selectedDate);
    applyDurationFromTimes(sleepBatchBedtime, selectedDate);
  }, [applyDurationFromTimes, sleepBatchBedtime]);

  const updateBatchDurationHours = React.useCallback((raw: string) => {
    setSleepBatchDurationHours(raw.replaceAll(/\D/g, ''));
  }, []);

  const updateBatchDurationMinutes = React.useCallback((raw: string) => {
    const normalized = raw.replaceAll(/\D/g, '');
    if (!normalized) {
      setSleepBatchDurationMinutes('');
      return;
    }

    setSleepBatchDurationMinutes(String(Math.min(Number.parseInt(normalized, 10), 59)).padStart(2, '0'));
  }, []);

  const updateBatchDeepSleepHours = (raw: string) => {
    setSleepBatchDeepSleepHours(raw.replaceAll(/\D/g, ''));
  };

  const updateBatchDeepSleepMinutes = React.useCallback((raw: string) => {
    const normalized = raw.replaceAll(/\D/g, '');
    if (!normalized) {
      setSleepBatchDeepSleepMinutes('');
      return;
    }

    setSleepBatchDeepSleepMinutes(String(Math.min(Number.parseInt(normalized, 10), 59)).padStart(2, '0'));
  }, []);

  const updateBatchRemSleepHours = (raw: string) => {
    setSleepBatchRemSleepHours(raw.replaceAll(/\D/g, ''));
  };

  const updateBatchRemSleepMinutes = React.useCallback((raw: string) => {
    const normalized = raw.replaceAll(/\D/g, '');
    if (!normalized) {
      setSleepBatchRemSleepMinutes('');
      return;
    }

    setSleepBatchRemSleepMinutes(String(Math.min(Number.parseInt(normalized, 10), 59)).padStart(2, '0'));
  }, []);

  const handleSaveSleepBatch = React.useCallback(() => {
    const durationHours = sleepBatchDurationHours ? Number.parseInt(sleepBatchDurationHours, 10) : 0;
    const durationMinutes = sleepBatchDurationMinutes ? Number.parseInt(sleepBatchDurationMinutes, 10) : 0;
    const deepSleepHours = sleepBatchDeepSleepHours ? Number.parseInt(sleepBatchDeepSleepHours, 10) : 0;
    const deepSleepMinutes = sleepBatchDeepSleepMinutes ? Number.parseInt(sleepBatchDeepSleepMinutes, 10) : 0;
    const remSleepHours = sleepBatchRemSleepHours ? Number.parseInt(sleepBatchRemSleepHours, 10) : 0;
    const remSleepMinutes = sleepBatchRemSleepMinutes ? Number.parseInt(sleepBatchRemSleepMinutes, 10) : 0;

    if (Number.isNaN(durationHours) || Number.isNaN(durationMinutes) || Number.isNaN(deepSleepHours) || Number.isNaN(deepSleepMinutes) || Number.isNaN(remSleepHours) || Number.isNaN(remSleepMinutes)) {
      Alert.alert('Ogiltiga värden', 'Kontrollera sömnfälten och försök igen.');
      return;
    }

    const durationTotalMinutes = durationHours * 60 + durationMinutes;
    const deepSleepTotalMinutes = deepSleepHours * 60 + deepSleepMinutes;
    const remSleepTotalMinutes = remSleepHours * 60 + remSleepMinutes;
    if (durationTotalMinutes <= 0) {
      Alert.alert('Sömnlängd saknas', 'Ange sömnlängd i timmar och minuter.');
      return;
    }

    const recordedAtIso = sleepBatchRecordedAt.toISOString();
    const notes = sleepBatchNotes.trim() || undefined;

    const entries: MetricEntry[] = [
      {
        metricId: 'sleep_bedtime',
        value: minutesFromMidnight(sleepBatchBedtime),
        unit: metrics.sleep_bedtime.canonicalUnit,
        recordedAt: recordedAtIso,
        notes,
      },
      {
        metricId: 'sleep_duration',
        value: durationTotalMinutes,
        unit: metrics.sleep_duration.canonicalUnit,
        recordedAt: recordedAtIso,
        notes,
      },
      {
        metricId: 'deep_sleep',
        value: Math.max(0, deepSleepTotalMinutes),
        unit: metrics.deep_sleep.canonicalUnit,
        recordedAt: recordedAtIso,
        notes,
      },
      {
        metricId: 'rem_sleep',
        value: Math.max(0, remSleepTotalMinutes),
        unit: metrics.rem_sleep.canonicalUnit,
        recordedAt: recordedAtIso,
        notes,
      },
    ];

    setMetricEntries(prev => [...prev, ...entries]);
    handleCloseSleepBatchSheet();
  }, [handleCloseSleepBatchSheet, setMetricEntries, sleepBatchBedtime, sleepBatchDeepSleepHours, sleepBatchDeepSleepMinutes, sleepBatchDurationHours, sleepBatchDurationMinutes, sleepBatchNotes, sleepBatchRecordedAt, sleepBatchRemSleepHours, sleepBatchRemSleepMinutes]);

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

  const formattedBatchBedtime = formatClockTime(sleepBatchBedtime);
  const formattedBatchWake = formatClockTime(sleepBatchWakeTime);

  let batchBedtimeControl = (
    <>
      <AppButton title={formattedBatchBedtime} onPress={() => setShowBatchBedtimePicker(true)} variant="secondary" />
      {showBatchBedtimePicker && (
        <DateTimePicker
          value={sleepBatchBedtime}
          mode="time"
          display="default"
          is24Hour
          onChange={handleBatchBedtimeChange}
        />
      )}
    </>
  );

  let batchWakeControl = (
    <>
      <AppButton title={formattedBatchWake} onPress={() => setShowBatchWakePicker(true)} variant="secondary" />
      {showBatchWakePicker && (
        <DateTimePicker
          value={sleepBatchWakeTime}
          mode="time"
          display="default"
          is24Hour
          onChange={handleBatchWakeChange}
        />
      )}
    </>
  );

  if (Platform.OS === 'ios') {
    batchBedtimeControl = (
      <View style={[styles.sleepTimePickerContainer, { borderColor: colors.border }]}> 
        <DateTimePicker
          value={sleepBatchBedtime}
          mode="time"
          display="spinner"
          is24Hour
          onChange={handleBatchBedtimeChange}
        />
      </View>
    );

    batchWakeControl = (
      <View style={[styles.sleepTimePickerContainer, { borderColor: colors.border }]}> 
        <DateTimePicker
          value={sleepBatchWakeTime}
          mode="time"
          display="spinner"
          is24Hour
          onChange={handleBatchWakeChange}
        />
      </View>
    );
  }

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
            onAddSleepBatchPress={isSleepRelatedMetric ? handleOpenSleepBatchSheet : undefined}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            addButtonTitle={t('common:metricValuesBottomSheet.addButton')}
            addSleepBatchButtonTitle={isSleepRelatedMetric ? 'Registrera samtliga sömnvärden' : undefined}
            registeredValuesTitle={t('common:metricValuesBottomSheet.registeredValuesTitle')}
            dateLabel={t('common:metricValuesBottomSheet.columns.date')}
            valueLabel={t('common:metricValuesBottomSheet.columns.value')}
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

      {isSleepBatchSheetVisible && (
        <BottomSheet
          ref={registerSleepBatchBottomSheetRef}
          snapPoints={['35%', '65%', '95%']}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: colors.background }}
          animateOnMount
          index={sheetIndex}
          onClose={handleCloseSleepBatchSheet}
        >
          <BottomSheetScrollView
            contentContainerStyle={[styles.sleepBatchContentContainer, { backgroundColor: colors.background }]}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="title3" style={styles.title}>Registrera samtliga sömnvärden</ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText type="default" style={styles.inputLabel}>Läggdags</ThemedText>
              {batchBedtimeControl}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="default" style={styles.inputLabel}>Vaknade</ThemedText>
              {batchWakeControl}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="default" style={styles.inputLabel}>Sömnlängd</ThemedText>
              <View style={styles.sleepDurationInputRow}>
                <BottomSheetTextInput
                  style={[styles.sleepDurationInput, { color: colors.text, borderColor: colors.border }]}
                  value={sleepBatchDurationHours}
                  onChangeText={updateBatchDurationHours}
                  keyboardType="number-pad"
                  placeholder="Timmar"
                  placeholderTextColor={colors.textMuted}
                />
                <BottomSheetTextInput
                  style={[styles.sleepDurationInput, { color: colors.text, borderColor: colors.border }]}
                  value={sleepBatchDurationMinutes}
                  onChangeText={updateBatchDurationMinutes}
                  keyboardType="number-pad"
                  placeholder="Minuter"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>Tidsskillnaden mellan läggdags och uppvakning fyller detta automatiskt, men du kan justera manuellt.</ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="default" style={styles.inputLabel}>Djupsömn</ThemedText>
              <View style={styles.sleepDurationInputRow}>
                <BottomSheetTextInput
                  style={[styles.sleepDurationInput, { color: colors.text, borderColor: colors.border }]}
                  value={sleepBatchDeepSleepHours}
                  onChangeText={updateBatchDeepSleepHours}
                  keyboardType="number-pad"
                  placeholder="Timmar"
                  placeholderTextColor={colors.textMuted}
                />
                <BottomSheetTextInput
                  style={[styles.sleepDurationInput, { color: colors.text, borderColor: colors.border }]}
                  value={sleepBatchDeepSleepMinutes}
                  onChangeText={updateBatchDeepSleepMinutes}
                  keyboardType="number-pad"
                  placeholder="Minuter"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="default" style={styles.inputLabel}>REM-sömn</ThemedText>
              <View style={styles.sleepDurationInputRow}>
                <BottomSheetTextInput
                  style={[styles.sleepDurationInput, { color: colors.text, borderColor: colors.border }]}
                  value={sleepBatchRemSleepHours}
                  onChangeText={updateBatchRemSleepHours}
                  keyboardType="number-pad"
                  placeholder="Timmar"
                  placeholderTextColor={colors.textMuted}
                />
                <BottomSheetTextInput
                  style={[styles.sleepDurationInput, { color: colors.text, borderColor: colors.border }]}
                  value={sleepBatchRemSleepMinutes}
                  onChangeText={updateBatchRemSleepMinutes}
                  keyboardType="number-pad"
                  placeholder="Minuter"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <DateTimeInput value={sleepBatchRecordedAt} onChange={setSleepBatchRecordedAt} showTime={false} />

            <View style={styles.inputGroup}>
              <ThemedText type="default" style={styles.inputLabel}>Notering (valfritt)</ThemedText>
              <BottomSheetTextInput
                style={[styles.sleepNotesInput, { color: colors.text, borderColor: colors.border }]}
                value={sleepBatchNotes}
                onChangeText={setSleepBatchNotes}
                placeholder="T.ex. orolig natt"
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>

            <View style={styles.sleepBatchButtonRow}>
              <AppButton onPress={handleCloseSleepBatchSheet} title="Avbryt" variant="secondary" style={styles.sleepBatchButton} />
              <AppButton onPress={handleSaveSleepBatch} title="Spara alla" style={styles.sleepBatchButton} />
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      )}
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
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    marginBottom: 4,
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
  sleepBatchContentContainer: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  sleepTimePickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sleepDurationInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sleepDurationInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sleepSingleInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sleepNotesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 96,
    textAlignVertical: 'top',
  },
  sleepBatchButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  sleepBatchButton: {
    flex: 1,
  },
});
