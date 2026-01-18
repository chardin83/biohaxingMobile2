import React, { useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import CalendarComponent from '@/components/CalendarComponent';
import DayEdit from '@/components/DayEdit';
import { Colors } from '@/constants/Colors';

import { borders } from '../../theme/styles';

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendarRef = useRef<any>(null);

  const handleDayPress = (day: string) => {
    setSelectedDate(day);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <CalendarComponent onDayPress={handleDayPress} ref={calendarRef} />
        {selectedDate && (
          <View style={styles.dropdownContainer}>
            <DayEdit selectedDate={selectedDate} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  dropdownContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: Colors.dark.secondary,
    borderRadius: borders.radius,
    shadowColor: Colors.dark.buttonGlow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});
