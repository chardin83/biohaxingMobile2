import {
  useCallback,
} from 'react';

import {
  useStorage,
} from '@/app/context/StorageContext';
import {
  getHabitTrackedDates,
  isHabitSlotCompleted,
  logHabitTarget,
} from '@/services/targetProgress/habitTrackingService';

export const useHabitTracking = () => {
  const {
    dailyHabitTracking,
    setDailyHabitTracking,
  } = useStorage();

  const logHabit =
    useCallback(
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
          setDailyHabitTracking,
        });
      },
      [
        setDailyHabitTracking,
      ]
    );

  const isSlotCompleted =
    useCallback(
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
          dailyHabitTracking,
        });
      },
      [
        dailyHabitTracking,
      ]
    );

  const getTrackedDates =
    useCallback(
      (
        trackingKeys:
          Set<string>
      ) => {
        return getHabitTrackedDates({
          trackingKeys,
          dailyHabitTracking,
        });
      },
      [
        dailyHabitTracking,
      ]
    );

  return {
    logHabit,

    isHabitSlotCompleted:
      isSlotCompleted,

    getTrackedDates,
  };
};