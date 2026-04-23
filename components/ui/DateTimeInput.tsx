import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { formatClockTime } from '@/utils/sleepTimeUtils';

import { IconSymbolName } from './icon-symbol-map';

interface DateTimeInputProps {
  value: Date;
  onChange: (value: Date) => void;
  dateLabel?: string;
  timeLabel?: string;
  showDate?: boolean;
  showTime?: boolean;
  buttonIcon?: IconSymbolName;
  minDate?: Date;
  maxDate?: Date;
}

export function DateTimeInput({
  value,
  onChange,
  dateLabel,
  timeLabel,
  showDate = false,
  showTime = true,
  buttonIcon = 'clock',
  minDate,
  maxDate,
}: Readonly<DateTimeInputProps>) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  if (!dateLabel) dateLabel = t('general.date');
  if (!timeLabel) timeLabel = t('general.time');

  const [showPicker, setShowPicker] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const locale = i18n.language || 'sv-SE';
  const formattedDate = value.toLocaleDateString(locale);
  const formattedTime = formatClockTime(value, locale);

  // Generera knappens titel automatiskt, alltid från aktuellt value
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
    }

    if (!selectedDate) {
      return;
    }

    // Om både showDate och showTime: använd hela selectedDate (iOS mode='datetime')
    if (showDate && showTime) {
      onChange(selectedDate);
      return;
    }

    // Annars: bygg nytt Date-objekt med datum från selectedDate och tid från value
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

    // Skapa alltid ett nytt Date-objekt med både datum och tid från value/selectedTime
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


  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <AppButton
          title={buttonTitle}
          icon={buttonIcon}
          onPress={() => setShowPicker((v) => !v)}
          variant="secondary"
        />
        {showPicker && (
          <>
            {showDate && (
              <View style={styles.group}>
                <ThemedText type="default" style={styles.label}>
                  {dateLabel}
                </ThemedText>
                <View style={[styles.pickerContainer, { borderColor: colors.border }]}> 
                  <DateTimePicker
                    value={value}
                    mode={showTime && showDate ? 'datetime' : 'date'}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    is24Hour
                    onChange={handleDateChange}
                    minimumDate={minDate}
                    maximumDate={maxDate}
                  />
                </View>
              </View>
            )}
            {showTime && !showDate && (
              <View style={styles.group}>
                <ThemedText type="default" style={styles.label}>
                  {timeLabel}
                </ThemedText>
                <View style={[styles.pickerContainer, { borderColor: colors.border }]}> 
                  <DateTimePicker value={value} mode="time" display="spinner" is24Hour onChange={handleTimeChange} minimumDate={minDate} maximumDate={maxDate} />
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <ThemedText type="default" style={styles.label}>
          {dateLabel}
        </ThemedText>
        <AppButton title={formattedDate} onPress={() => setShowDatePicker(true)} variant="secondary" />
        {showDatePicker && (
          <DateTimePicker value={value} mode="date" display="default" onChange={handleDateChange} minimumDate={minDate} maximumDate={maxDate} />
        )}
      </View>

      {showTime && (
        <View style={styles.group}>
          <ThemedText type="default" style={styles.label}>
            {timeLabel}
          </ThemedText>
          <AppButton title={formattedTime} onPress={() => setShowTimePicker(true)} variant="secondary" />
          {showTimePicker && (
            <DateTimePicker value={value} mode="time" display="default" is24Hour onChange={handleTimeChange} minimumDate={minDate} maximumDate={maxDate} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
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