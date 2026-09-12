import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  DailyTrainingTracking,
  TrainingPlanSettings,
  TrainingStorage,
} from './trainingTypes';

const KEYS = {
  SETTINGS: 'trainingPlanSettings',
  ENTRIES: 'trainingEntries',
} as const;

export const getTrainingStorage =
  async (): Promise<TrainingStorage> => {
    const [settings, entries] =
      await Promise.all([
        AsyncStorage.getItem(
          KEYS.SETTINGS
        ),
        AsyncStorage.getItem(
          KEYS.ENTRIES
        ),
      ]);

    return {
      trainingPlanSettings:
        settings
          ? JSON.parse(settings)
          : {},

      dailyTrainingTracking:
        entries
          ? JSON.parse(entries)
          : {},
    };
  };

export const saveTrainingPlanSettings = (
  value: Record<
    string,
    TrainingPlanSettings
  >
) =>
  AsyncStorage.setItem(
    KEYS.SETTINGS,
    JSON.stringify(value)
  );

export const saveDailyTrainingTracking = (
  value: DailyTrainingTracking
) =>
  AsyncStorage.setItem(
    KEYS.ENTRIES,
    JSON.stringify(value)
  );