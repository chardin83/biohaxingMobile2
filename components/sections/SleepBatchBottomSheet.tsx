import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { RefObject } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { DateTimeInput } from '@/components/ui/DateTimeInput';
import { minutesFromMidnight } from '@/utils/sleepTimeUtils';

// Props for the SleepBatchBottomSheet
export type SleepBatchBottomSheetProps = {
  sheetIndex: number;
  bottomSheetRef: RefObject<BottomSheet | null>;
  colors: any;
  styles: any;
  setMetricEntries: (fn: (prev: any) => any) => void;
  metrics: any;
  handleCloseSleepBatchSheet: () => void;
};

export function SleepBatchBottomSheet({
    sheetIndex,
    bottomSheetRef,
    colors,
    styles,
    setMetricEntries,
    metrics,
    handleCloseSleepBatchSheet,
  }: Readonly<SleepBatchBottomSheetProps>) {
    const { t } = useTranslation();
    const [sleepBatchNotes, setSleepBatchNotes] = React.useState('');
    const [sleepBatchWakeTime, setSleepBatchWakeTime] = React.useState(() => {
      const next = new Date();
      next.setHours(6, 30, 0, 0);
      return next;
    });
    const [sleepBatchBedtime, setSleepBatchBedtime] = React.useState(() => {
      const wake = new Date();
      wake.setHours(6, 30, 0, 0);
      const bed = new Date(wake);
      bed.setDate(wake.getDate() - 1);
      bed.setHours(22, 30, 0, 0);
      return bed;
    });
    const [sleepBatchDurationHours, setSleepBatchDurationHours] = React.useState('8');
    const [sleepBatchDurationMinutes, setSleepBatchDurationMinutes] = React.useState('00');
    const [sleepBatchDeepSleepHours, setSleepBatchDeepSleepHours] = React.useState('');
    const [sleepBatchDeepSleepMinutes, setSleepBatchDeepSleepMinutes] = React.useState('');
    const [sleepBatchRemSleepHours, setSleepBatchRemSleepHours] = React.useState('');
    const [sleepBatchRemSleepMinutes, setSleepBatchRemSleepMinutes] = React.useState('');

    // ...existing code...

    const applyDurationFromTimes = React.useCallback((nextBedtime: Date, nextWakeTime: Date) => {
      function getDurationFromTimes(bedtime: Date, wakeTime: Date) {
        // Skillnad i minuter mellan två datum
        const diffMs = wakeTime.getTime() - bedtime.getTime();
        let duration = Math.round(diffMs / 60000); // ms till minuter
        if (duration <= 0) {
          // Om bedtime är "efter" wakeTime, lägg till 24h
          duration += 1440;
        }
        return duration;
      }
      const duration = getDurationFromTimes(nextBedtime, nextWakeTime);
      setSleepBatchDurationHours(String(Math.floor(duration / 60)));
      setSleepBatchDurationMinutes(String(duration % 60));
    }, []);

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
        return;
      }
      const durationTotalMinutes = durationHours * 60 + durationMinutes;
      const deepSleepTotalMinutes = deepSleepHours * 60 + deepSleepMinutes;
      const remSleepTotalMinutes = remSleepHours * 60 + remSleepMinutes;
      if (durationTotalMinutes <= 0) {
        return;
        }
        
        const recordedAtIso = new Date().toISOString();
      const notes = sleepBatchNotes.trim() || undefined;
      const entries = [
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
      setMetricEntries((prev: any) => [...prev, ...entries]);
      handleCloseSleepBatchSheet();
    }, [sleepBatchDurationHours, sleepBatchDurationMinutes, sleepBatchDeepSleepHours, sleepBatchDeepSleepMinutes, sleepBatchRemSleepHours, sleepBatchRemSleepMinutes, sleepBatchNotes, sleepBatchBedtime, metrics, setMetricEntries, handleCloseSleepBatchSheet]);


    let batchBedtimeControl = (
      <DateTimeInput
        value={sleepBatchBedtime}
        onChange={(_date) => {
          setSleepBatchBedtime(_date);
          applyDurationFromTimes(_date, sleepBatchWakeTime);
        }}
        showDate
        showTime
        buttonIcon="clock"
        maxDate={sleepBatchWakeTime}
      />
    );
    let batchWakeControl = (
      <DateTimeInput
        value={sleepBatchWakeTime}
        onChange={(_date) => {
          setSleepBatchWakeTime(_date);
          applyDurationFromTimes(sleepBatchBedtime, _date);
        }}
        minDate={sleepBatchBedtime}
        maxDate={new Date(sleepBatchBedtime.getTime() + 24 * 60 * 60 * 1000)}
        showDate
        showTime
        buttonIcon="alarm"
      />
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
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
          <ThemedText type="title3" style={styles.title}>{t('sleepBatchBottomSheet.title')}</ThemedText>
          <View style={styles.inputGroup}>
            <ThemedText type="default" style={styles.inputLabel}>{t('metrics:sleep_bedtime.name')}</ThemedText>
            {batchBedtimeControl}
          </View>
          <View style={styles.inputGroup}>
            <ThemedText type="default" style={styles.inputLabel}>{t('metrics:sleep_wake.name')}</ThemedText>
            {batchWakeControl}
          </View>
          <View style={styles.inputGroup}>
            <ThemedText type="default" style={styles.inputLabel}>{t('metrics:sleep_duration.name')}</ThemedText>
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
            <ThemedText type="caption" style={{ color: colors.textMuted }}>{t('sleepBatchBottomSheet.durationHint')}</ThemedText>
          </View>
          <View style={styles.inputGroup}>
            <ThemedText type="default" style={styles.inputLabel}>{t('metrics:deep_sleep.name')}</ThemedText>
            <View style={styles.sleepDurationInputRow}>
              <BottomSheetTextInput
                style={[styles.sleepDurationInput, { color: colors.text, borderColor: colors.border }]}
                value={sleepBatchDeepSleepHours}
                onChangeText={updateBatchDeepSleepHours}
                keyboardType="number-pad"
                placeholder={t('sleepBatchBottomSheet.hours')}
                placeholderTextColor={colors.textMuted}
              />
              <BottomSheetTextInput
                style={[styles.sleepDurationInput, { color: colors.text, borderColor: colors.border }]}
                value={sleepBatchDeepSleepMinutes}
                onChangeText={updateBatchDeepSleepMinutes}
                keyboardType="number-pad"
                placeholder={t('sleepBatchBottomSheet.minutes')}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <ThemedText type="default" style={styles.inputLabel}>{t('metrics:rem_sleep.name')}</ThemedText>
            <View style={styles.sleepDurationInputRow}>
              <BottomSheetTextInput
                style={[styles.sleepDurationInput, { color: colors.text, borderColor: colors.border }]}
                value={sleepBatchRemSleepHours}
                onChangeText={updateBatchRemSleepHours}
                keyboardType="number-pad"
                placeholder={t('sleepBatchBottomSheet.hours')}
                placeholderTextColor={colors.textMuted}
              />
              <BottomSheetTextInput
                style={[styles.sleepDurationInput, { color: colors.text, borderColor: colors.border }]}
                value={sleepBatchRemSleepMinutes}
                onChangeText={updateBatchRemSleepMinutes}
                keyboardType="number-pad"
                placeholder={t('sleepBatchBottomSheet.minutes')}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <ThemedText type="default" style={styles.inputLabel}>{t('sleepBatchBottomSheet.notesLabel')}</ThemedText>
            <BottomSheetTextInput
              style={[styles.sleepNotesInput, { color: colors.text, borderColor: colors.border }]}
              value={sleepBatchNotes}
              onChangeText={setSleepBatchNotes}
              placeholder={t('sleepBatchBottomSheet.notesPlaceholder')}
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>
          <View style={styles.sleepBatchButtonRow}>
            <AppButton onPress={handleCloseSleepBatchSheet} title={t('general.cancel')} variant="secondary" style={styles.sleepBatchButton} />
            <AppButton onPress={handleSaveSleepBatch} title={t('general.saveAll')} style={styles.sleepBatchButton} />
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
