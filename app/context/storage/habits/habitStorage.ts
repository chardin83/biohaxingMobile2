import { getDailyRange, getTrackingKeys, removeDailyValue, saveDailyValue } from '../shared/trackingStorage';
import type { DailyHabitTracking, HabitEntry, HabitStorage } from './habitTypes';

const DAILY_HABIT_NAMESPACE = 'dailyHabitTracking';

type DailyHabitValue = DailyHabitTracking[string];

// Private

const saveDailyHabitTracking = (dateKey: string, value: DailyHabitValue): Promise<void> => saveDailyValue(DAILY_HABIT_NAMESPACE, dateKey, value);

const removeDailyHabitTracking = (dateKey: string): Promise<void> => removeDailyValue(DAILY_HABIT_NAMESPACE, dateKey);

// Public

export const syncDailyHabitTracking = (previous: DailyHabitTracking, updated: DailyHabitTracking): void => {
  const dateKeys = new Set([...Object.keys(previous), ...Object.keys(updated)]);

  dateKeys.forEach(dateKey => {
    const previousValue = previous[dateKey];
    const updatedValue = updated[dateKey];

    if (previousValue === updatedValue) {
      return;
    }

    if (!updatedValue) {
      removeDailyHabitTracking(dateKey).catch(error => {
        console.error(`Failed to remove habits for ${dateKey}`, error);
      });
      return;
    }

    saveDailyHabitTracking(dateKey, updatedValue).catch(error => {
      console.error(`Failed to save habits for ${dateKey}`, error);
    });
  });
};

export const addHabitEntryToTracking = (tracking: DailyHabitTracking, dateKey: string, trackingKey: string, entry: HabitEntry): DailyHabitTracking => ({
  ...tracking,
  [dateKey]: {
    ...tracking[dateKey],
    [trackingKey]: entry,
  },
});

export const updateHabitEntryInTracking = (
  tracking: DailyHabitTracking,
  dateKey: string,
  trackingKey: string,
  updates: Partial<HabitEntry>
): DailyHabitTracking => {
  const entry = tracking[dateKey]?.[trackingKey];

  if (!entry) {
    return tracking;
  }

  return {
    ...tracking,
    [dateKey]: {
      ...tracking[dateKey],
      [trackingKey]: {
        ...entry,
        ...updates,
      },
    },
  };
};

export const removeHabitEntryFromTracking = (tracking: DailyHabitTracking, dateKey: string, trackingKey: string): DailyHabitTracking => {
  const day = tracking[dateKey];

  if (!day?.[trackingKey]) {
    return tracking;
  }

  const updatedDay = { ...day };
  delete updatedDay[trackingKey];

  const updated = { ...tracking };

  if (Object.keys(updatedDay).length === 0) {
    delete updated[dateKey];
  } else {
    updated[dateKey] = updatedDay;
  }

  return updated;
};

export const getHabitStorage = async (): Promise<HabitStorage> => {
  const dateKeys = await getTrackingKeys(DAILY_HABIT_NAMESPACE);

  const dailyHabitTracking = await getDailyRange<DailyHabitValue>(DAILY_HABIT_NAMESPACE, dateKeys);

  return {
    dailyHabitTracking,
  };
};
