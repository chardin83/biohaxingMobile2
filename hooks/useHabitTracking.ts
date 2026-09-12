import { useCallback } from 'react';

import { useStorage } from '@/app/context/StorageContext';
import {
  getHabitTrackedDates,
  isHabitSlotCompleted,
  logHabitTarget,
} from '@/services/targetProgress/habitTrackingService';

export const useHabitTracking = () => {
  const {
    weeklyTracking,
    setWeeklyTracking,
  } = useStorage();

  const logHabit = useCallback(
    ({
      trackingKey,
      selectedDate,
      value,
      slot,
    }: {
      trackingKey: string;
      selectedDate: string;
      value: number;
      slot?: string;
    }) => {
      logHabitTarget({
        trackingKey,
        selectedDate,
        value,
        slot,
        setWeeklyTracking,
      });
    },
    [setWeeklyTracking]
  );

  const isSlotCompleted = useCallback(
    ({
      trackingKey,
      selectedDate,
      slot,
    }: {
      trackingKey: string;
      selectedDate: string;
      slot: string;
    }) => {
      return isHabitSlotCompleted({
        trackingKey,
        selectedDate,
        slot,
        weeklyTracking,
      });
    },
    [weeklyTracking]
  );

  const getTrackedDates = useCallback(
    (trackingKeys: Set<string>) => {
      return getHabitTrackedDates({
        trackingKeys,
        weeklyTracking,
      });
    },
    [weeklyTracking]
  );

  return {
    logHabit,
    isHabitSlotCompleted: isSlotCompleted,
    getTrackedDates,
  };
};