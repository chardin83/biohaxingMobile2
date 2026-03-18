import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Picker } from '@react-native-picker/picker';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { DateTimeInput } from '@/components/ui/DateTimeInput';

interface RegisterMetricBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  isVisible: boolean;
  metricId?: string;
  metricName?: string;
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
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);
  const hasOpenedRef = React.useRef(false);
  const hasMetricName = Boolean(metricName);
  const hasMultipleUnits = (units?.length ?? 0) > 1;
  const hasSingleUnit = (units?.length ?? 0) === 1;
  const isSleepDurationMetric = metricId === 'sleep_duration';
  const parsedSleepDurationMinutes = React.useMemo(() => {
    const parsedValue = Number.parseInt(metricValue, 10);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }, [metricValue]);
  const sleepDurationHours = String(Math.floor(parsedSleepDurationMinutes / 60));
  const sleepDurationMinutes = String(parsedSleepDurationMinutes % 60);

  const updateSleepDurationValue = React.useCallback((nextHoursRaw: string, nextMinutesRaw: string) => {
    const normalizedHours = nextHoursRaw.replace(/[^0-9]/g, '');
    const normalizedMinutes = nextMinutesRaw.replace(/[^0-9]/g, '');

    if (!normalizedHours && !normalizedMinutes) {
      setMetricValue('');
      return;
    }

    const hours = normalizedHours ? Number.parseInt(normalizedHours, 10) : 0;
    const minutes = normalizedMinutes ? Math.min(Number.parseInt(normalizedMinutes, 10), 59) : 0;
    setMetricValue(String(hours * 60 + minutes));
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

  if (hasMultipleUnits && units) {
    unitField = (
      <View style={[styles.input, styles.pickerContainer, { borderColor: colors.border }]}> 
        <Picker
          selectedValue={metricUnit}
          onValueChange={setMetricUnit}
          style={{ color: colors.text }}
          dropdownIconColor={colors.text}
        >
          {units.map(unit => (
            <Picker.Item
              key={`${unit.system}-${unit.unit}`}
              label={unit.unit + (unit.system ? ` (${unit.system})` : '')}
              value={unit.unit}
            />
          ))}
        </Picker>
      </View>
    );
  } else if (hasSingleUnit && units) {
    unitField = (
      <View style={[styles.input, styles.singleUnitContainer, { borderColor: colors.border }]}> 
        <ThemedText type="defaultSemiBold">{units[0].unit}</ThemedText>
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

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.background }}
      animateOnMount
      index={0}
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
          {isSleepDurationMetric ? (
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
          ) : (
            <BottomSheetTextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={metricValue}
              onChangeText={setMetricValue}
              keyboardType="decimal-pad"
              placeholder="Ange värde"
              placeholderTextColor={colors.textMuted}
            />
          )}
        </View>

        {!isSleepDurationMetric && (
          <View style={styles.inputGroup}>
            <ThemedText type="default" style={styles.inputLabel}>
              Enhet
            </ThemedText>
            {unitField}
          </View>
        )}

        <DateTimeInput value={recordedAt} onChange={setRecordedAt} />

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