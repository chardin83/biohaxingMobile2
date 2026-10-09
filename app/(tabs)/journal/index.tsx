import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';

import DayEdit, { type DayEditTab } from '@/components/journal/DayEdit';
import { JournalGoalFocusContext } from '@/components/journal/JournalGoalAnchor';
import JournalComponent from '@/components/JournalComponent';
import Container, { ContainerScrollRef } from '@/components/ui/Container';

const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Journal() {
  const params = useLocalSearchParams<{
    selectedDate?: string;
    openTab?: DayEditTab;
    supplementId?: string;
    focusTipId?: string;
    focusRequestId?: string;
  }>();
  const today = toLocalDateKey(new Date());
  const initialDate = params.selectedDate ?? today;
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [activeDayEditTab, setActiveDayEditTab] = useState<DayEditTab>(params.openTab ?? 'meal');
  const journalRef = useRef<any>(null);
  const containerRef = useRef<ContainerScrollRef>(null);
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const handledFocusRequest = useRef<string | undefined>(undefined);
  const focusRequest = params.focusRequestId ?? params.focusTipId;
  const handleGoalFocus = useCallback((target: View) => {
    if (!focusRequest || handledFocusRequest.current === focusRequest) return;
    handledFocusRequest.current = focusRequest;
    containerRef.current?.scrollToElement(target);
  }, [focusRequest]);
  const goalFocus = useMemo(() => ({ tipId: params.focusTipId, requestId: focusRequest, onFocus: handleGoalFocus }), [params.focusTipId, focusRequest, handleGoalFocus]);

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
      contentContainerStyle={{ paddingBottom: Math.max(200, height / 2) }}
    >
      <JournalComponent onDayPress={handleDayPress} selectedDate={selectedDate ?? undefined} ref={journalRef} />
      {selectedDate && (
        <JournalGoalFocusContext.Provider value={goalFocus}>
          <DayEdit
            key={selectedDate}
            selectedDate={selectedDate}
            onTipCompleted={handleTipCompleted}
            initialTab={params.openTab}
            activeTab={activeDayEditTab}
            onActiveTabChange={setActiveDayEditTab}
            preselectedSupplementId={params.supplementId}
          />
        </JournalGoalFocusContext.Provider>
      )}
    </Container>
  );
}
