import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDailyRange, getTrackingKeys, removeDailyValue, saveDailyValue } from '../shared/trackingStorage';
import type { DailyTrainingTracking, TrainingLogEntry, TrainingPlanSettings, TrainingStorage } from './trainingTypes';

const TRAINING_PLAN_SETTINGS_KEY = 'trainingPlanSettings';
const DAILY_TRAINING_NAMESPACE = 'dailyTrainingTracking';

type DailyTrainingValue = DailyTrainingTracking[string];

const saveDailyTrainingTracking = (dateKey: string, value: DailyTrainingValue): Promise<void> => saveDailyValue(DAILY_TRAINING_NAMESPACE, dateKey, value);

const removeDailyTrainingTracking = (dateKey: string): Promise<void> => removeDailyValue(DAILY_TRAINING_NAMESPACE, dateKey);

export const syncDailyTrainingTracking = (previous: DailyTrainingTracking, updated: DailyTrainingTracking): void => {
  const dateKeys = new Set([...Object.keys(previous), ...Object.keys(updated)]);

  dateKeys.forEach(dateKey => {
    const previousEntries = previous[dateKey];
    const updatedEntries = updated[dateKey];

    if (previousEntries === updatedEntries) {
      return;
    }

    if (!updatedEntries) {
      removeDailyTrainingTracking(dateKey).catch(error => {
        console.error(`Failed to remove training for ${dateKey}`, error);
      });
      return;
    }

    saveDailyTrainingTracking(dateKey, updatedEntries).catch(error => {
      console.error(`Failed to save training for ${dateKey}`, error);
    });
  });
};

export const addTrainingEntryToTracking = (tracking: DailyTrainingTracking, entry: TrainingLogEntry): DailyTrainingTracking => ({
  ...tracking,
  [entry.date]: [...(tracking[entry.date] ?? []), entry],
});

export const updateTrainingEntryInTracking = (
  tracking: DailyTrainingTracking,
  dateKey: string,
  entryId: string,
  updates: Partial<TrainingLogEntry>
): DailyTrainingTracking => {
  const entries = tracking[dateKey];

  if (!entries) {
    return tracking;
  }

  return {
    ...tracking,
    [dateKey]: entries.map(entry => (entry.id === entryId ? { ...entry, ...updates } : entry)),
  };
};

export const removeTrainingEntryFromTracking = (tracking: DailyTrainingTracking, dateKey: string, entryId: string): DailyTrainingTracking => {
  const entries = tracking[dateKey];

  if (!entries) {
    return tracking;
  }

  const updatedEntries = entries.filter(entry => entry.id !== entryId);

  const updated = { ...tracking };

  if (updatedEntries.length === 0) {
    delete updated[dateKey];
  } else {
    updated[dateKey] = updatedEntries;
  }

  return updated;
};

export const saveTrainingPlanSettings = (value: Record<string, TrainingPlanSettings>): Promise<void> =>
  AsyncStorage.setItem(TRAINING_PLAN_SETTINGS_KEY, JSON.stringify(value));

export const getTrainingStorage = async (): Promise<TrainingStorage> => {
  const [settings, dateKeys] = await Promise.all([AsyncStorage.getItem(TRAINING_PLAN_SETTINGS_KEY), getTrackingKeys(DAILY_TRAINING_NAMESPACE)]);

  const dailyTrainingTracking = await getDailyRange<DailyTrainingValue>(DAILY_TRAINING_NAMESPACE, dateKeys);

  return {
    trainingPlanSettings: settings ? JSON.parse(settings) : {},
    dailyTrainingTracking,
  };
};
