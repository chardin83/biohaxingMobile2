import { WeeklyTrackingItem } from '@/app/context/storage/nutrition/nutritionTypes';

import { getWeekStartKey } from './dateRange';

export type WeeklyTracking = Record<
  string,
  Record<string, WeeklyTrackingItem[] | number>
>;

type LogHabitTargetParams = {
  trackingKey: string;
  selectedDate: string;
  value: number;
  slot?: string;
  setWeeklyTracking: (
    updater: (
      prev: WeeklyTracking
    ) => WeeklyTracking
  ) => void;
};

type GetHabitValueParams = {
  trackingKey: string;
  selectedDate: string;
  weeklyTracking: WeeklyTracking;
};

type GetHabitSlotValueParams = {
  trackingKey: string;
  selectedDate: string;
  slot: string;
  weeklyTracking: WeeklyTracking;
};

const getHabitKey = (
  trackingKey: string,
  date: string
): string =>
  `habit:${trackingKey}:${date}`;

const getHabitSlotKey = (
  trackingKey: string,
  date: string,
  slot: string
): string =>
  `habit:${trackingKey}:${date}:slot:${slot}`;

export const getHabitValue = ({
  trackingKey,
  selectedDate,
  weeklyTracking,
}: GetHabitValueParams): number => {
  const weekStartKey =
    getWeekStartKey(selectedDate);

  const habitKey =
    getHabitKey(
      trackingKey,
      selectedDate
    );

  const value =
    weeklyTracking[
      weekStartKey
    ]?.[habitKey];

  return typeof value === 'number'
    ? value
    : 0;
};

export const getHabitSlotValue = ({
  trackingKey,
  selectedDate,
  slot,
  weeklyTracking,
}: GetHabitSlotValueParams): number => {
  const weekStartKey =
    getWeekStartKey(selectedDate);

  const slotKey =
    getHabitSlotKey(
      trackingKey,
      selectedDate,
      slot
    );

  const value =
    weeklyTracking[
      weekStartKey
    ]?.[slotKey];

  return typeof value === 'number'
    ? value
    : 0;
};

export const isHabitSlotCompleted = ({
  trackingKey,
  selectedDate,
  slot,
  weeklyTracking,
}: GetHabitSlotValueParams): boolean => {
  return (
    getHabitSlotValue({
      trackingKey,
      selectedDate,
      slot,
      weeklyTracking,
    }) > 0
  );
};

export const logHabitTarget = ({
  trackingKey,
  selectedDate,
  value,
  slot,
  setWeeklyTracking,
}: LogHabitTargetParams): void => {
  const weekStartKey =
    getWeekStartKey(selectedDate);

  const key = slot
    ? getHabitSlotKey(
        trackingKey,
        selectedDate,
        slot
      )
    : getHabitKey(
        trackingKey,
        selectedDate
      );

  setWeeklyTracking(prev => {
    const currentWeek =
      prev[weekStartKey] ?? {};

    const nextWeek = {
      ...currentWeek,
      [key]: value,
    };

    if (slot) {
      const slotPrefix =
        `habit:${trackingKey}:${selectedDate}:slot:`;

      const total =
        Object.entries(nextWeek)
          .filter(
            ([entryKey]) =>
              entryKey.startsWith(
                slotPrefix
              )
          )
          .reduce(
            (
              sum,
              [, entryValue]
            ) =>
              sum +
              (
                typeof entryValue ===
                'number'
                  ? entryValue
                  : 0
              ),
            0
          );

      nextWeek[
        getHabitKey(
          trackingKey,
          selectedDate
        )
      ] = total;
    }

    return {
      ...prev,
      [weekStartKey]:
        nextWeek,
    };
  });
};

export const getHabitTrackedDates = ({
  trackingKeys,
  weeklyTracking,
}: {
  trackingKeys: Set<string>;
  weeklyTracking: WeeklyTracking;
}): string[] => {
  const dates = Object.values(weeklyTracking).flatMap(
    weekData =>
      Object.entries(weekData).flatMap(([key, value]) => {
        const match =
          /^habit:([^:]+):(\d{4}-\d{2}-\d{2})$/.exec(key);

        if (
          !match ||
          typeof value !== 'number' ||
          value <= 0
        ) {
          return [];
        }

        const trackingKey = match[1];
        const date = match[2];

        return trackingKeys.has(trackingKey)
          ? [date]
          : [];
      })
  );

  return Array.from(new Set(dates));
};