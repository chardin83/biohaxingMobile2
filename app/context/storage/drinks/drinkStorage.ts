import { getDailyRange, getTrackingKeys, removeDailyValue, saveDailyValue } from '../shared/trackingStorage';
import type { DailyDrinkTracking, DrinkEntry } from './drinkTypes';

const DAILY_DRINK_NAMESPACE = 'dailyDrinkTracking';

export type DrinkStorage = {
  dailyDrinkTracking: DailyDrinkTracking;
};

type DailyDrinkValue = DailyDrinkTracking[string];

// Private

const saveDailyDrinkTracking = (dateKey: string, value: DailyDrinkValue): Promise<void> => saveDailyValue(DAILY_DRINK_NAMESPACE, dateKey, value);

const removeDailyDrinkTracking = (dateKey: string): Promise<void> => removeDailyValue(DAILY_DRINK_NAMESPACE, dateKey);

// Public

export const syncDailyDrinkTracking = (previous: DailyDrinkTracking, updated: DailyDrinkTracking): void => {
  const dateKeys = new Set([...Object.keys(previous), ...Object.keys(updated)]);

  dateKeys.forEach(dateKey => {
    const previousDrinks = previous[dateKey];
    const updatedDrinks = updated[dateKey];

    if (previousDrinks === updatedDrinks) {
      return;
    }

    if (!updatedDrinks) {
      removeDailyDrinkTracking(dateKey).catch(error => {
        console.error(`Failed to remove drinks for ${dateKey}`, error);
      });
      return;
    }

    saveDailyDrinkTracking(dateKey, updatedDrinks).catch(error => {
      console.error(`Failed to save drinks for ${dateKey}`, error);
    });
  });
};

export const addDrinkEntryToTracking = (tracking: DailyDrinkTracking, dateKey: string, entry: DrinkEntry): DailyDrinkTracking => ({
  ...tracking,
  [dateKey]: [...(tracking[dateKey] ?? []), entry],
});

export const updateDrinkEntryInTracking = (
  tracking: DailyDrinkTracking,
  dateKey: string,
  entryId: string,
  updates: Partial<DrinkEntry>
): DailyDrinkTracking => {
  const drinks = tracking[dateKey];

  if (!drinks) {
    return tracking;
  }

  return {
    ...tracking,
    [dateKey]: drinks.map(entry => (entry.id === entryId ? { ...entry, ...updates } : entry)),
  };
};

export const removeDrinkEntryFromTracking = (tracking: DailyDrinkTracking, dateKey: string, entryId: string): DailyDrinkTracking => {
  const drinks = tracking[dateKey];

  if (!drinks) {
    return tracking;
  }

  const updatedDrinks = drinks.filter(entry => entry.id !== entryId);

  const updated = { ...tracking };

  if (updatedDrinks.length === 0) {
    delete updated[dateKey];
  } else {
    updated[dateKey] = updatedDrinks;
  }

  return updated;
};

export const getDrinkStorage = async (): Promise<DrinkStorage> => {
  const dateKeys = await getTrackingKeys(DAILY_DRINK_NAMESPACE);

  const dailyDrinkTracking = await getDailyRange<DailyDrinkValue>(DAILY_DRINK_NAMESPACE, dateKeys);

  return {
    dailyDrinkTracking,
  };
};
