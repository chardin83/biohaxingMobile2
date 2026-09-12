import type {
  DailyHabitTracking,
} from '@/app/context/storage/habits/habitTypes';

import {
  getTargetDates,
} from './dateRange';
import type {
  HabitTargetDefinition,
} from './targetProgressTypes';

export const resolveHabitTarget = ({
  target,
  selectedDate,
  dailyHabitTracking,
}: {
  target:
    HabitTargetDefinition;
  selectedDate: string;
  dailyHabitTracking:
    DailyHabitTracking;
}): number => {
  const dates =
    getTargetDates(
      selectedDate,
      target.period
    );

  return dates.reduce(
    (total, date) => {
      const value =
        dailyHabitTracking[
          date
        ]?.[
          target.trackingKey
        ]?.value ?? 0;

      return total + value;
    },
    0
  );
};