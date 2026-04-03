import { useTheme } from '@react-navigation/native';
import React, { useRef, useState } from 'react';

import CalendarComponent from '@/components/CalendarComponent';
import DayEdit from '@/components/DayEdit';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';

export default function Calendar() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const calendarRef = useRef<any>(null);
  const { colors } = useTheme();

  const handleDayPress = (day: string) => {
    setSelectedDate(day);
  };

  return (
    <Container
      background="gradient"
      gradientLocations={colors.gradients?.sunrise?.locations3 as any}
    >
      <CalendarComponent onDayPress={handleDayPress} ref={calendarRef} />
      {selectedDate && (
        <DayEdit selectedDate={selectedDate} />

      )}
    </Container>
  );
}
