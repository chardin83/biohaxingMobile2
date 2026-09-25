import { useCallback } from 'react';

import { useStorage } from '@/app/context/StorageContext';
import { getHabitTrackedDates, isHabitSlotCompleted, logHabitTarget } from '@/services/targetProgress/habitTrackingService';

export const useHabitTracking = () => {
  const { dailyHabitTracking, addHabitEntry, updateHabitEntry } = useStorage();

  const logHabit = useCallback(
    ({ trackingKey, selectedDate, value, slot }: { trackingKey: string; selectedDate: string; value: number; slot?: string }) => {
      const existing = dailyHabitTracking[selectedDate]?.[trackingKey];

      const entry = logHabitTarget({
        existing,
        value,
        slot,
      });

      if (existing) {
        updateHabitEntry(selectedDate, trackingKey, entry);
      } else {
        addHabitEntry(selectedDate, trackingKey, entry);
      }
    },
    [dailyHabitTracking, addHabitEntry, updateHabitEntry]
  );

  const isSlotCompleted = useCallback(
    ({ trackingKey, selectedDate, slot }: { trackingKey: string; selectedDate: string; slot: string }) =>
      isHabitSlotCompleted({
        trackingKey,
        selectedDate,
        slot,
        dailyHabitTracking,
      }),
    [dailyHabitTracking]
  );

  const getTrackedDates = useCallback(
    (trackingKeys: Set<string>) =>
      getHabitTrackedDates({
        trackingKeys,
        dailyHabitTracking,
      }),
    [dailyHabitTracking]
  );

  return {
    logHabit,
    isHabitSlotCompleted: isSlotCompleted,
    getTrackedDates,
  };
};
