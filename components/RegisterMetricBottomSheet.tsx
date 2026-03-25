import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { DateTimeInput } from '@/components/ui/DateTimeInput';

interface RegisterMetricBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  isVisible: boolean;
  metricId?: string;
  metricName?: string;
  initialSnapIndex?: number;
  snapPoints?: string[];
  metricValue: string;
  setMetricValue: (value: string) => void;
  metricUnit: string;
  setMetricUnit: (value: string) => void;
  metricNotes: string;
  setMetricNotes: (value: string) => void;
  recordedAt: Date;
  setRecordedAt: (value: Date) => void;
  colors: any;
  units?: Array<{ unit: string; system: string }>;
  onSave: () => void;
  onClose: () => void;
}

export function RegisterMetricBottomSheet({
  bottomSheetRef,
  isVisible,
  metricId,
  metricName,
  initialSnapIndex = 0,
  snapPoints: providedSnapPoints,
  metricValue,
  setMetricValue,
  metricUnit,
  setMetricUnit,
  metricNotes,
  setMetricNotes,
  recordedAt,
  setRecordedAt,
  colors,
  units,
  onSave,
  onClose,
}: Readonly<RegisterMetricBottomSheetProps>) {
  const snapPoints = useMemo(() => providedSnapPoints ?? ['25%', '50%', '90%'], [providedSnapPoints]);
  const uniqueUnits = useMemo(() => {
    if (!units || units.length === 0) {
      return [];
    }

    const seen = new Set<string>();
    return units.filter(unit => {
      if (seen.has(unit.unit)) {
        return false;
      }
      seen.add(unit.unit);
      return true;
    });
  }, [units]);
  const hasOpenedRef = React.useRef(false);
  const hasMetricName = Boolean(metricName);
  const hasMultipleUnits = uniqueUnits.length > 1;
  const hasSingleUnit = uniqueUnits.length === 1;
  const [showBedtimePicker, setShowBedtimePicker] = React.useState(false);
  const isSleepDurationMetric = metricId === 'sleep_duration';
  const isSleepStageDurationMetric = metricId === 'deep_sleep' || metricId === 'rem_sleep';
  const isSleepMinutesMetric = isSleepDurationMetric || isSleepStageDurationMetric;
  const isSleepBedtimeMetric = metricId === 'sleep_bedtime';
  const isSleepTimeMetric = isSleepMinutesMetric || isSleepBedtimeMetric;
  const defaultBedtimeMinutes = 22 * 60 + 30;

  React.useEffect(() => {
    if (!isVisible || !isSleepBedtimeMetric || metricValue !== '') {
      return;
    }

    setMetricValue(String(defaultBedtimeMinutes));
  }, [defaultBedtimeMinutes, isSleepBedtimeMetric, isVisible, metricValue, setMetricValue]);

  const parsedSleepDurationMinutes = React.useMemo(() => {
    const parsedValue = Number.parseInt(metricValue, 10);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }, [metricValue]);
  const sleepDurationHours = String(Math.floor(parsedSleepDurationMinutes / 60));
  const sleepDurationMinutes = String(parsedSleepDurationMinutes % 60);
  const bedtimePickerValue = React.useMemo(() => {
    const nextValue = new Date(recordedAt);
    const normalizedMinutes = ((parsedSleepDurationMinutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalizedMinutes / 60);
    const minutes = normalizedMinutes % 60;
    nextValue.setHours(hours, minutes, 0, 0);
    return nextValue;
  }, [parsedSleepDurationMinutes, recordedAt]);
  const formattedBedtime = bedtimePickerValue.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const updateSleepDurationValue = React.useCallback((nextHoursRaw: string, nextMinutesRaw: string) => {
    const normalizedHours = nextHoursRaw.replaceAll(/\D/g, '');
    const normalizedMinutes = nextMinutesRaw.replaceAll(/\D/g, '');

    if (!normalizedHours && !normalizedMinutes) {
      setMetricValue('');
      return;
    }

    const hours = normalizedHours ? Number.parseInt(normalizedHours, 10) : 0;
    const minutes = normalizedMinutes ? Math.min(Number.parseInt(normalizedMinutes, 10), 59) : 0;
    setMetricValue(String(hours * 60 + minutes));
  }, [setMetricValue]);

  const handleBedtimeChange = React.useCallback((_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowBedtimePicker(false);
    }

    if (!selectedDate) {
      return;
    }

    const minutesFromMidnight = selectedDate.getHours() * 60 + selectedDate.getMinutes();
    setMetricValue(String(minutesFromMidnight));
  }, [setMetricValue]);

  let unitField = (
    <BottomSheetTextInput
      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      value={metricUnit}
      onChangeText={setMetricUnit}
      placeholder="t.ex. mg/dL"
      placeholderTextColor={colors.textMuted}
    />
  );

  if (hasMultipleUnits) {
    unitField = (
      <View style={[styles.input, styles.pickerContainer, { borderColor: colors.border }]}> 
        <Picker
          selectedValue={metricUnit}
          onValueChange={setMetricUnit}
          style={{ color: colors.text }}
          dropdownIconColor={colors.text}
        >
          {uniqueUnits.map(unit => (
            <Picker.Item
              key={`${unit.system}-${unit.unit}`}
              label={unit.unit + (unit.system ? ` (${unit.system})` : '')}
              value={unit.unit}
            />
          ))}
        </Picker>
      </View>
    );
  } else if (hasSingleUnit) {
    unitField = (
      <View style={[styles.input, styles.singleUnitContainer, { borderColor: colors.border }]}> 
        <ThemedText type="defaultSemiBold">{uniqueUnits[0].unit}</ThemedText>
      </View>
    );
  }

  if (!isVisible) {
    return null;
  }

  const handleSheetChange = (index: number) => {
    if (index >= 0) {
      hasOpenedRef.current = true;
      return;
    }

    if (index === -1 && hasOpenedRef.current) {
      hasOpenedRef.current = false;
      onClose();
    }
  };

  let valueField = (
    <BottomSheetTextInput
      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      value={metricValue}
      onChangeText={setMetricValue}
      keyboardType="decimal-pad"
      placeholder="Ange värde"
      placeholderTextColor={colors.textMuted}
    />
  );

  if (isSleepMinutesMetric) {
    valueField = (
      <View style={styles.sleepDurationRow}>
        <View style={styles.sleepDurationField}>
          <BottomSheetTextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={metricValue === '' ? '' : sleepDurationHours}
            onChangeText={hours => updateSleepDurationValue(hours, sleepDurationMinutes)}
            keyboardType="number-pad"
            placeholder="Timmar"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.sleepDurationField}>
          <BottomSheetTextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={metricValue === '' ? '' : sleepDurationMinutes}
            onChangeText={minutes => updateSleepDurationValue(sleepDurationHours, minutes)}
            keyboardType="number-pad"
            placeholder="Minuter"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
    );
  }

  if (isSleepBedtimeMetric) {
    let bedtimePickerControl = (
      <>
        <AppButton title={formattedBedtime} onPress={() => setShowBedtimePicker(true)} variant="secondary" />
        {showBedtimePicker && (
          <DateTimePicker
            value={bedtimePickerValue}
            mode="time"
            display="default"
            is24Hour
            onChange={handleBedtimeChange}
          />
        )}
      </>
    );

    if (Platform.OS === 'ios') {
      bedtimePickerControl = (
        <View style={[styles.pickerContainer, { borderColor: colors.border }]}> 
          <DateTimePicker
            value={bedtimePickerValue}
            mode="time"
            display="spinner"
            is24Hour
            onChange={handleBedtimeChange}
          />
        </View>
      );
    }

    valueField = (
      <View style={styles.inputGroup}>
        {bedtimePickerControl}
        <View style={[styles.input, styles.singleUnitContainer, { borderColor: colors.border }]}> 
          <ThemedText type="default">Använder klockslag (HH:mm)</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.background }}
      animateOnMount
      index={initialSnapIndex}
      onChange={handleSheetChange}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.contentContainer, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title3" style={styles.title}>
          Registrera mätvärde
        </ThemedText>

        {hasMetricName && (
          <ThemedText type="defaultSemiBold" style={styles.metricName}>
            {metricName}
          </ThemedText>
        )}

        <View style={styles.inputGroup}>
          <ThemedText type="default" style={styles.inputLabel}>
            Värde
          </ThemedText>
          {valueField}
        </View>

        {!isSleepTimeMetric && (
          <View style={styles.inputGroup}>
            <ThemedText type="default" style={styles.inputLabel}>
              Enhet
            </ThemedText>
            {unitField}
          </View>
        )}

        <DateTimeInput value={recordedAt} onChange={setRecordedAt} showTime={false} />

        <View style={styles.inputGroup}>
          <ThemedText type="default" style={styles.inputLabel}>
            Notering (valfritt)
          </ThemedText>
          <BottomSheetTextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
            value={metricNotes}
            onChangeText={setMetricNotes}
            placeholder="T.ex. fastande mätvärde"
            placeholderTextColor={colors.textMuted}
            multiline
          />
        </View>

        <View style={styles.buttonRow}>
          <AppButton onPress={onClose} title="Avbryt" variant="secondary" style={styles.button} />
          <AppButton onPress={onSave} title="Spara" style={styles.button} />
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  metricName: {
    marginBottom: 4,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    padding: 0,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sleepDurationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sleepDurationField: {
    flex: 1,
  },
  singleUnitContainer: {
    justifyContent: 'center',
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  button: {
    flex: 1,
  },
});