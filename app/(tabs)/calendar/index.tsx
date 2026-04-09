import { useTheme } from '@react-navigation/native';
import React, { useRef, useState } from 'react';

import CalendarComponent from '@/components/CalendarComponent';
import DayEdit from '@/components/DayEdit';
import Container, { ContainerScrollRef } from '@/components/ui/Container';

const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Calendar() {
  const today = toLocalDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const calendarRef = useRef<any>(null);
  const containerRef = useRef<ContainerScrollRef>(null);
  const { colors } = useTheme();

  const handleDayPress = (day: string) => {
    setSelectedDate(day);
  };

  const handleTipCompleted = (targetY?: number) => {
    if (typeof targetY === 'number') {
      containerRef.current?.scrollTo({ y: Math.max(0, targetY - 120), animated: true });
      return;
    }
    containerRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <Container
      ref={containerRef}
      background="gradient"
      gradientLocations={colors.gradients?.sunrise?.locations3 as any}
    >
      <CalendarComponent onDayPress={handleDayPress} ref={calendarRef} />
      {selectedDate && (
        <DayEdit selectedDate={selectedDate} onTipCompleted={handleTipCompleted} />

      )}
    </Container>
  );
}
