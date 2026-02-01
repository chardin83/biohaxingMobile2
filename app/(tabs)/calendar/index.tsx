import { useTheme } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import CalendarComponent from '@/components/CalendarComponent';
import DayEdit from '@/components/DayEdit';

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const calendarRef = useRef<any>(null);
  const { colors } = useTheme();

  const handleDayPress = (day: string) => {
    setSelectedDate(day);
    //calendarRef.current?.addMarkForDate?.(day);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <CalendarComponent onDayPress={handleDayPress} ref={calendarRef} />
        {selectedDate && (
          <View
            style={[
              styles.dropdownContainer,
              {
                backgroundColor: colors.secondary,
                shadowColor: colors.buttonGlow,
              },
            ]}
          >
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
    // backgroundColor tas bort här!
  },
  scrollContainer: {
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  dropdownContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    padding: 12,
    // backgroundColor tas bort här!
    // shadowColor tas bort här!
    borderRadius: globalStyles.borders.borderRadius,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});
