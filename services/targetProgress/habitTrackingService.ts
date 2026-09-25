import type { DailyHabitTracking, HabitEntry } from '@/app/context/storage/habits/habitTypes';

export const logHabitTarget = ({ existing, value, slot }: { existing?: HabitEntry; value: number; slot?: string }): HabitEntry => {
  const current = existing ?? {
    value: 0,
  };

  if (slot) {
    const slots = {
      ...current.slots,
      [slot]: value > 0,
    };

    return {
      ...current,
      value: Object.values(slots).filter(Boolean).length,
      slots,
    };
  }

  return {
    ...current,
    value,
  };
};

export const getHabitValue = ({
  trackingKey,
  selectedDate,
  dailyHabitTracking,
}: {
  trackingKey: string;
  selectedDate: string;
  dailyHabitTracking: DailyHabitTracking;
}): number => {
  return dailyHabitTracking[selectedDate]?.[trackingKey]?.value ?? 0;
};

export const isHabitSlotCompleted = ({
  trackingKey,
  selectedDate,
  slot,
  dailyHabitTracking,
}: {
  trackingKey: string;
  selectedDate: string;
  slot: string;
  dailyHabitTracking: DailyHabitTracking;
}): boolean => {
  return dailyHabitTracking[selectedDate]?.[trackingKey]?.slots?.[slot] ?? false;
};

export const getHabitTrackedDates = ({ trackingKeys, dailyHabitTracking }: { trackingKeys: Set<string>; dailyHabitTracking: DailyHabitTracking }): string[] => {
  return Object.entries(dailyHabitTracking)
    .filter(([, day]) => Object.entries(day).some(([trackingKey, entry]) => trackingKeys.has(trackingKey) && entry.value > 0))
    .map(([date]) => date);
};
