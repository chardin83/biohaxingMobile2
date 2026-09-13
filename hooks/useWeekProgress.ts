import { useMemo, useState } from 'react';

import { formatMonthDayRange, fromDateKey, getFirstDayOfWeek, getLocalizedWeekdayLabels, toDateKey } from '@/utils/dateUtils';

export type PastWeek = {
  start: string;
  end: string;
  days: string[];
  label: string;
};

const getLast4Weeks = (weekOffset: number, language: string, firstDayOfWeek: number): PastWeek[] => {
  const today = new Date();
  const currentWeekStart = new Date(today);
  const day = currentWeekStart.getDay();
  const diff = (day - firstDayOfWeek + 7) % 7;

  currentWeekStart.setDate(currentWeekStart.getDate() - diff + weekOffset * 7);

  return Array.from({ length: 4 }, (_, index) => {
    const startDate = new Date(currentWeekStart);
    startDate.setDate(currentWeekStart.getDate() - (3 - index) * 7);

    const days = Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + dayIndex);
      return toDateKey(date);
    });

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return {
      start: toDateKey(startDate),
      end: toDateKey(endDate),
      days,
      label: formatMonthDayRange(startDate, endDate, language),
    };
  });
};

export const useProgressWeeks = (language: string) => {
  const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(language), [language]);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);

  const weeks = useMemo<PastWeek[]>(() => getLast4Weeks(weekOffset, language, firstDayOfWeek), [weekOffset, language, firstDayOfWeek]);

  const selectedWeek = useMemo<PastWeek>(() => weeks.find(week => week.start === selectedWeekStart) ?? weeks[3], [weeks, selectedWeekStart]);

  const dayLabels = useMemo(
    () =>
      getLocalizedWeekdayLabels(language, {
        format: 'short',
        weekStartsOn: firstDayOfWeek,
        stripDots: true,
      }),
    [language, firstDayOfWeek]
  );

  const dateRangeLabel = useMemo(() => {
    if (!weeks.length) {
      return '';
    }

    return formatMonthDayRange(fromDateKey(weeks[0].start), fromDateKey(weeks[3].end), language);
  }, [weeks, language]);

  const goBackWeeks = () => {
    setWeekOffset(previous => previous - 4);
    setSelectedWeekStart(null);
  };

  const goForwardWeeks = () => {
    setWeekOffset(previous => Math.min(previous + 4, 0));
    setSelectedWeekStart(null);
  };

  return {
    weeks,
    selectedWeek,
    selectedWeekStart,
    setSelectedWeekStart,
    dayLabels,
    dateRangeLabel,
    goBackWeeks,
    goForwardWeeks,
    canGoForward: weekOffset < 0,
  };
};
