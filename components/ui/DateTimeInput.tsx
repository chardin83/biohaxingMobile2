import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';

interface DateTimeInputProps {
  value: Date;
  onChange: (value: Date) => void;
  dateLabel?: string;
  timeLabel?: string;
  showTime?: boolean;
}

export function DateTimeInput({
  value,
  onChange,
  dateLabel = 'Datum',
  timeLabel = 'Tid',
  showTime = true,
}: Readonly<DateTimeInputProps>) {
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const formattedDate = value.toLocaleDateString('sv-SE');
  const formattedTime = value.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (!selectedDate) {
      return;
    }

    const nextValue = new Date(value);
    nextValue.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    onChange(nextValue);
  };

  const handleTimeChange = (_event: unknown, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (!selectedTime) {
      return;
    }

    const nextValue = new Date(value);
    nextValue.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    onChange(nextValue);
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <View style={styles.group}>
          <ThemedText type="default" style={styles.label}>
            {dateLabel}
          </ThemedText>
          <View style={[styles.pickerContainer, { borderColor: colors.border }]}> 
            <DateTimePicker value={value} mode="date" display="spinner" onChange={handleDateChange} />
          </View>
        </View>

        {showTime && (
          <View style={styles.group}>
            <ThemedText type="default" style={styles.label}>
              {timeLabel}
            </ThemedText>
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}> 
              <DateTimePicker value={value} mode="time" display="spinner" is24Hour onChange={handleTimeChange} />
            </View>
          </View>
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
          <DateTimePicker value={value} mode="date" display="default" onChange={handleDateChange} />
        )}
      </View>

      {showTime && (
        <View style={styles.group}>
          <ThemedText type="default" style={styles.label}>
            {timeLabel}
          </ThemedText>
          <AppButton title={formattedTime} onPress={() => setShowTimePicker(true)} variant="secondary" />
          {showTimePicker && (
            <DateTimePicker value={value} mode="time" display="default" is24Hour onChange={handleTimeChange} />
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