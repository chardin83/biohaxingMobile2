import type {
  DailyTracking,
} from '../types/trackingTypes';

export type HabitEntry = {
  value: number;
  slots?: Record<string, boolean>;
};

export type DailyHabitTracking =
  DailyTracking<
    Record<string, HabitEntry>
  >;

export type HabitStorage = {
  dailyHabitTracking: DailyHabitTracking;
};