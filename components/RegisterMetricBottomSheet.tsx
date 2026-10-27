import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useBottomSheetDesign } from '@/components/ui/BottomSheetDesign';
import BottomSheetTextInput from '@/components/ui/inputs/BottomSheetTextInput';
import { DateTimeInput } from '@/components/ui/inputs/DateTimeInput';
import { InputLabel } from '@/components/ui/inputs/InputLabel';
import OptionSelector from '@/components/ui/inputs/OptionSelector';
import Notice from '@/components/ui/Notice';
import { SaveCancelButtons } from '@/components/ui/SaveCancelButtons';
import { translateMetricUnit } from '@/utils/translateMetricUnit';
import { RECOVERY_INPUT_METRIC_IDS } from '@/wearables/recoveryMetrics';

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
  onSave: () => void | Promise<void>;
  onClose: () => void;
}

function isValidMetricValue(metricValue: string, metricId?: string): boolean {
  if (metricValue.trim() === '') return false;
  const value = Number(metricValue.replace(',', '.').trim());
  if (!Number.isFinite(value)) return false;

  if (metricId === 'sleep_bedtime') {
    return Number.isInteger(value) && value >= 0 && value < 1440;
  }
  if (['sleep_duration', 'deep_sleep', 'rem_sleep'].includes(metricId ?? '')) {
    return Number.isInteger(value) && value >= 0 && value <= 1440;
  }
  return true;
}

function getMetricValidation({
  metricId,
  metricValue,
  metricUnit,
  units,
  recordedAt,
}: Pick<RegisterMetricBottomSheetProps, 'metricId' | 'metricValue' | 'metricUnit' | 'units' | 'recordedAt'>) {
  const isSleepTime = ['sleep_duration', 'deep_sleep', 'rem_sleep', 'sleep_bedtime'].includes(metricId ?? '');
  return {
    valueIsValid: isValidMetricValue(metricValue, metricId),
    unitIsValid: isSleepTime || units?.length === 1 || metricUnit.trim() !== '',
    dateIsValid: Number.isFinite(recordedAt.getTime()),
  };
}

type MetricUnitFieldProps = Pick<RegisterMetricBottomSheetProps, 'units' | 'metricUnit' | 'setMetricUnit' | 'colors'> & { errorText?: string };

function MetricUnitField({ units, metricUnit, setMetricUnit, colors, errorText }: Readonly<MetricUnitFieldProps>) {
  const { t } = useTranslation('metrics');
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

  if (uniqueUnits.length === 0) {
    return (
      <BottomSheetTextInput
        value={metricUnit}
        onChangeText={setMetricUnit}
        label={t('registration.unit')}
        isOptional={false}
        errorText={errorText}
        placeholder={t('registration.unitPlaceholder')}
        placeholderTextColor={colors.textMuted}
      />
    );
  }

  return (
    <View>
      <InputLabel label={t('registration.unit')} isOptional={false} hasError={Boolean(errorText)} />
      <OptionSelector
        value={metricUnit}
        onChange={setMetricUnit}
        error={Boolean(errorText)}
        accessibilityLabel={t('registration.unit')}
        options={uniqueUnits.map(unit => ({
          value: unit.unit,
          label: translateMetricUnit(unit.unit, t) + (unit.system ? ` (${unit.system})` : ''),
        }))}
      />
    </View>
  );
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
  const { t } = useTranslation('metrics');
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(false);
  const savingRef = React.useRef(false);
  const [showValidation, setShowValidation] = React.useState(false);
  const { valueIsValid, unitIsValid, dateIsValid } = getMetricValidation({ metricId, metricValue, metricUnit, units, recordedAt });
  const valueError = showValidation && !valueIsValid ? t('registration.valueError') : undefined;
  const unitError = showValidation && !unitIsValid ? t('registration.unitError') : undefined;

  React.useEffect(() => {
    if (isVisible) {
      setShowValidation(false);
      setSaveError(false);
    }
  }, [isVisible, metricId]);

  const handleSave = async () => {
    if (savingRef.current) return;
    setShowValidation(true);
    if (!valueIsValid || !unitIsValid || !dateIsValid) return;
    savingRef.current = true;
    setIsSaving(true);
    setSaveError(false);
    try {
      await onSave();
    } catch {
      setSaveError(true);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };
  const snapPoints = useMemo(() => providedSnapPoints ?? ['30%', '70%', '90%'], [providedSnapPoints]);
  const sheetDesign = useBottomSheetDesign(colors);
  const hasOpenedRef = React.useRef(false);
  const hasMetricName = Boolean(metricName);
  const isSleepMinutesMetric = ['sleep_duration', 'deep_sleep', 'rem_sleep'].includes(metricId ?? '');
  const isSleepBedtimeMetric = metricId === 'sleep_bedtime';
  const isSleepTimeMetric = ['sleep_duration', 'deep_sleep', 'rem_sleep', 'sleep_bedtime'].includes(metricId ?? '');
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

  const updateSleepDurationValue = React.useCallback(
    (nextHoursRaw: string, nextMinutesRaw: string) => {
      const normalizedHours = nextHoursRaw.replaceAll(/\D/g, '');
      const normalizedMinutes = nextMinutesRaw.replaceAll(/\D/g, '');

      if (!normalizedHours && !normalizedMinutes) {
        setMetricValue('');
        return;
      }

      const hours = normalizedHours ? Number.parseInt(normalizedHours, 10) : 0;
      const minutes = normalizedMinutes ? Math.min(Number.parseInt(normalizedMinutes, 10), 59) : 0;
      setMetricValue(String(hours * 60 + minutes));
    },
    [setMetricValue]
  );

  const handleBedtimeChange = React.useCallback(
    (selectedDate: Date) => {
      const minutesFromMidnight = selectedDate.getHours() * 60 + selectedDate.getMinutes();
      setMetricValue(String(minutesFromMidnight));
    },
    [setMetricValue]
  );

  if (!isVisible) {
    return null;
  }

  const handleSheetChange = (index: number) => {
    if (index >= 0) {
      hasOpenedRef.current = true;
      return;
    }

    if (index === -1 && hasOpenedRef.current && !savingRef.current) {
      hasOpenedRef.current = false;
      onClose();
    }
  };

  let valueField = (
    <BottomSheetTextInput
      value={metricValue}
      onChangeText={setMetricValue}
      keyboardType="decimal-pad"
      label={t('registration.value')}
      isOptional={false}
      errorText={valueError}
      placeholder={t('registration.valuePlaceholder')}
      placeholderTextColor={colors.textMuted}
    />
  );

  if (isSleepMinutesMetric) {
    valueField = (
      <View style={styles.sleepDurationRow}>
        <View style={styles.sleepDurationField}>
          <BottomSheetTextInput
            value={metricValue === '' ? '' : sleepDurationHours}
            onChangeText={hours => updateSleepDurationValue(hours, sleepDurationMinutes)}
            keyboardType="number-pad"
            label={t('registration.hours')}
            isOptional={false}
            errorText={valueError}
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.sleepDurationField}>
          <BottomSheetTextInput
            value={metricValue === '' ? '' : sleepDurationMinutes}
            onChangeText={minutes => updateSleepDurationValue(sleepDurationHours, minutes)}
            keyboardType="number-pad"
            label={t('registration.minutes')}
            isOptional={false}
            errorText={valueError}
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
    );
  }

  if (isSleepBedtimeMetric) {
    valueField = (
      <View>
        <InputLabel label={t('registration.bedtime')} isOptional={false} hasError={Boolean(valueError)} />
        <DateTimeInput hasError={Boolean(valueError)} value={bedtimePickerValue} onChange={handleBedtimeChange} showDate={false} showTime timeLabel="Laggtid" />
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
      enablePanDownToClose={!isSaving}
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
      animateOnMount
      index={initialSnapIndex}
      onChange={handleSheetChange}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.contentContainer, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
        {metricId && RECOVERY_INPUT_METRIC_IDS.has(metricId) && <Notice message={t('metrics:recoveryStatus.changeInfo')} />}
        <ThemedText type="title3" style={styles.title}>
          Registrera mätvärde
        </ThemedText>

        {hasMetricName && (
          <ThemedText type="defaultSemiBold" style={styles.metricName}>
            {metricName}
          </ThemedText>
        )}

        {valueField}

        {!isSleepTimeMetric && <MetricUnitField units={units} metricUnit={metricUnit} setMetricUnit={setMetricUnit} colors={colors} errorText={unitError} />}

        <View>
          <InputLabel label={t('registration.date')} isOptional={false} hasError={showValidation && !dateIsValid} />
          <DateTimeInput value={recordedAt} onChange={setRecordedAt} showDate showTime={false} hasError={showValidation && !dateIsValid} />
        </View>

        <BottomSheetTextInput
          label={t('registration.notes')}
          value={metricNotes}
          onChangeText={setMetricNotes}
          placeholder={t('registration.notesPlaceholder')}
        />

        {saveError && <Notice message={t('registration.saveError')} />}
        <SaveCancelButtons onCancel={onClose} onSave={handleSave} busy={isSaving} />
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
});
