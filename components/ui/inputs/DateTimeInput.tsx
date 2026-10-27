import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { formatClockTime } from '@/utils/dateUtils';

import { IconSymbolName } from '../icon-symbol-map';
import { InputLabel } from './InputLabel';

interface DateTimeInputProps {
  value: Date;
  label?: string;
  onChange: (value: Date) => void;
  dateLabel?: string;
  buttonLabel?: string;
  timeLabel?: string;
  showDate?: boolean;
  showTime?: boolean;
  buttonIcon?: IconSymbolName;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  hasError?: boolean;
  onPickerOpenChange?: (isOpen: boolean) => void;
}

export function DateTimeInput({
  value,
  label,
  onChange,
  dateLabel,
  buttonLabel,
  timeLabel,
  showDate = false,
  showTime = true,
  buttonIcon = 'clock',
  minDate,
  maxDate,
  disabled = false,
  hasError = false,
  onPickerOpenChange,
}: Readonly<DateTimeInputProps>) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  if (!dateLabel) dateLabel = t('general.date');
  if (!timeLabel) timeLabel = t('general.time');

  const [showPicker, setShowPicker] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(showDate);
  const [showTimePicker, setShowTimePicker] = React.useState(showTime);

  const locale = i18n.language || 'sv-SE';

  const minimumDateProp = minDate ? { minimumDate: minDate } : {};
  const maximumDateProp = maxDate ? { maximumDate: maxDate } : {};
  const hasPickerMode = showDate || showTime;

  const buttonTitle = React.useMemo(() => {
    if (showDate && showTime) {
      return `${value.toLocaleDateString(locale)} ${formatClockTime(value, locale)}`;
    } else if (showDate) {
      return value.toLocaleDateString(locale);
    } else if (showTime) {
      return formatClockTime(value, locale);
    }
    return '';
  }, [value, showDate, showTime, locale]);

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      // Om både showDate och showTime: öppna time-picker direkt
      if (showDate && showTime) {
        setShowTimePicker(true);
        return;
      }
    }

    if (!selectedDate) {
      return;
    }

    // Om både showDate och showTime: använd hela selectedDate (iOS mode='datetime')
    if (showDate && showTime) {
      onChange(selectedDate);
      return;
    }

    const nextValue = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      value.getMilliseconds()
    );
    onChange(nextValue);
  };

  const handleTimeChange = (_event: unknown, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (!selectedTime) {
      return;
    }

    const nextValue = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      selectedTime.getSeconds(),
      selectedTime.getMilliseconds()
    );
    onChange(nextValue);
  };

  const handleTogglePicker = () => {
    if (!hasPickerMode || disabled) {
      return;
    }

    const next = !showPicker;
    if (next) {
      setShowDatePicker(showDate);
      setShowTimePicker(showTime);
    }
    setShowPicker(next);
    onPickerOpenChange?.(next);
  };

  return (
    <View style={styles.container}>
      <View>
        {label && <InputLabel label={label} />}
        <AppButton
          title={buttonLabel ?? buttonTitle}
          accessibilityLabel={label ? `${label}, ${buttonLabel ?? buttonTitle}` : undefined}
          icon={buttonIcon}
          onPress={handleTogglePicker}
          variant="secondary"
          disabled={disabled}
          style={hasError ? { borderColor: colors.error } : undefined}
        />
      </View>
      {showPicker && (
        <>
          {showDatePicker && (
            <View style={styles.group}>
              <ThemedText type="default" style={styles.label}>
                {dateLabel}
              </ThemedText>

              {Platform.OS === 'ios' ? (
                <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                  <DateTimePicker
                    textColor={colors.text}
                  value={value}
                    mode={showTime && showDate ? 'datetime' : 'date'}
                    display="spinner"
                    is24Hour
                    onChange={handleDateChange}
                    {...minimumDateProp}
                    {...maximumDateProp}
                  />
                </View>
              ) : (
                <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                  <DateTimePicker value={value} mode="date" display="default" is24Hour onChange={handleDateChange} {...minimumDateProp} {...maximumDateProp} />
                </View>
              )}
            </View>
          )}

          {showTimePicker && !showDatePicker && (
            <View style={styles.group}>
              <ThemedText type="default" style={styles.label}>
                {timeLabel}
              </ThemedText>

              <NativeViewGestureHandler disallowInterruption enabled={Platform.OS === 'ios'}>
              <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                <DateTimePicker
                  textColor={colors.text}
                  value={value}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  is24Hour
                  onChange={handleTimeChange}
                  {...minimumDateProp}
                  {...maximumDateProp}
                />
              </View>
              </NativeViewGestureHandler>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 16,
  },
  group: {
    gap: 8,
  },
  label: {
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
