import type { ClockTime } from '@/types/ClockTime';

import type { DailyTracking } from '../types/trackingTypes';

export type HabitEntry = {
  value: number;
  isFulfilled?: boolean;
  targetAmount?: number;
  sourceRevision?: string;
  sleepSchedule?: {
    status: 'noData' | 'fulfilled' | 'notFulfilled';
    actualBedtime?: string;
    targetBedtime?: ClockTime;
    deviationMinutes?: number;
  };
  slots?: Record<string, boolean>;
};

export type DailyHabitTracking = DailyTracking<Record<string, HabitEntry>>;

export type HabitStorage = {
  dailyHabitTracking: DailyHabitTracking;
};
