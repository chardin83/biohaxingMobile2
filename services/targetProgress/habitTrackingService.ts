import type {
  DailyHabitTracking,
  HabitEntry,
} from '@/app/context/storage/habits/habitTypes';

type SetDailyHabitTracking = (
  updater:
    | DailyHabitTracking
    | ((
        prev: DailyHabitTracking
      ) => DailyHabitTracking)
) => void;

export const logHabitTarget = ({
  trackingKey,
  selectedDate,
  value,
  slot,
  setDailyHabitTracking,
}: {
  trackingKey: string;
  selectedDate: string;
  value: number;
  slot?: string;
  setDailyHabitTracking:
    SetDailyHabitTracking;
}) => {
  setDailyHabitTracking(prev => {
    const day =
      prev[selectedDate] ?? {};

    const existing:
      HabitEntry =
      day[trackingKey] ?? {
        value: 0,
      };

    if (slot) {
      const slots = {
        ...(existing.slots ?? {}),
        [slot]: value > 0,
      };

      const newValue =
        Object.values(slots).filter(
          Boolean
        ).length;

      return {
        ...prev,
        [selectedDate]: {
          ...day,
          [trackingKey]: {
            ...existing,
            value: newValue,
            slots,
          },
        },
      };
    }

    return {
      ...prev,
      [selectedDate]: {
        ...day,
        [trackingKey]: {
          ...existing,
          value,
        },
      },
    };
  });
};

export const getHabitValue = ({
  trackingKey,
  selectedDate,
  dailyHabitTracking,
}: {
  trackingKey: string;
  selectedDate: string;
  dailyHabitTracking:
    DailyHabitTracking;
}): number => {
  return (
    dailyHabitTracking[
      selectedDate
    ]?.[trackingKey]?.value ?? 0
  );
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
  dailyHabitTracking:
    DailyHabitTracking;
}): boolean => {
  return (
    dailyHabitTracking[
      selectedDate
    ]?.[trackingKey]?.slots?.[
      slot
    ] ?? false
  );
};

export const getHabitTrackedDates = ({
  trackingKeys,
  dailyHabitTracking,
}: {
  trackingKeys: Set<string>;
  dailyHabitTracking:
    DailyHabitTracking;
}): string[] => {
  return Object.entries(
    dailyHabitTracking
  )
    .filter(([, day]) =>
      Object.entries(day).some(
        ([trackingKey, entry]) =>
          trackingKeys.has(
            trackingKey
          ) &&
          entry.value > 0
      )
    )
    .map(([date]) => date);
};