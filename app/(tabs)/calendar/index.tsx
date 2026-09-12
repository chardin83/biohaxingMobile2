import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import DayEdit, { type DayEditTab } from '@/components/calendar/DayEdit';
import CalendarComponent from '@/components/CalendarComponent';
import Container, { ContainerScrollRef } from '@/components/ui/Container';

const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Calendar() {
  const params = useLocalSearchParams<{
    selectedDate?: string;
    openTab?: 'supplements' | 'meal' | 'other';
    supplementId?: string;
  }>();
  const today = toLocalDateKey(new Date());
  const initialDate = params.selectedDate ?? today;
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [activeDayEditTab, setActiveDayEditTab] = useState<DayEditTab>(params.openTab ?? 'meal');
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

  useEffect(() => {
    if (params.selectedDate) {
      setSelectedDate(params.selectedDate);
    }
  }, [params.selectedDate]);

  useEffect(() => {
    if (params.openTab) {
      setActiveDayEditTab(params.openTab);
    }
  }, [params.openTab]);

  return (
    <Container
      ref={containerRef}
      background="gradient"
      gradientLocations={colors.gradients?.sunrise?.locations1 as any}
    >
      <CalendarComponent onDayPress={handleDayPress} selectedDate={selectedDate ?? undefined} ref={calendarRef} />
      {selectedDate && (
        <DayEdit
          key={selectedDate}
          selectedDate={selectedDate}
          onTipCompleted={handleTipCompleted}
          initialTab={params.openTab}
          activeTab={activeDayEditTab}
          onActiveTabChange={setActiveDayEditTab}
          preselectedSupplementId={params.supplementId}
        />

      )}
    </Container>
  );
}
