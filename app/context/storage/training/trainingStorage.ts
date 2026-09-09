import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  TrainingActivityFilter,
  TrainingActivityType,
  TrainingIntensity,
  TrainingIntensityFilter,
} from '@/types/training';

export type TrainingPlanSettings = {
  sessionsPerWeek?: number;
  sessionDurationMinutes?: number;
  activityType?: TrainingActivityFilter;
  minimumIntensity?: TrainingIntensityFilter;
};

export type TrainingLogEntry = {
  id: string;
  date: string;
  activityType: TrainingActivityType;
  durationMinutes: number;
  distanceKm?: number;
  intensity: TrainingIntensity;
  notes?: string;
  createdAt: string;
};

export type TrainingLogInput = {
  date: string;
  activityType: TrainingActivityType;
  durationMinutes: number;
  distanceKm?: number;
  intensity: TrainingIntensity;
  notes?: string;
};

const KEYS = {
  SETTINGS: 'trainingPlanSettings',
  ENTRIES: 'trainingEntries',
} as const;

export const getTrainingStorage = async () => {
  const [settings, entries] =
    await Promise.all([
      AsyncStorage.getItem(KEYS.SETTINGS),
      AsyncStorage.getItem(KEYS.ENTRIES),
    ]);

  return {
    trainingPlanSettings: settings
      ? JSON.parse(settings)
      : {},
    trainingEntries: entries
      ? JSON.parse(entries)
      : {},
  } as {
    trainingPlanSettings: Record<
      string,
      TrainingPlanSettings
    >;
    trainingEntries: Record<
      string,
      TrainingLogEntry[]
    >;
  };
};

export const saveTrainingPlanSettings = (
  value: Record<string, TrainingPlanSettings>
) =>
  AsyncStorage.setItem(
    KEYS.SETTINGS,
    JSON.stringify(value)
  );

export const saveTrainingEntries = (
  value: Record<string, TrainingLogEntry[]>
) =>
  AsyncStorage.setItem(
    KEYS.ENTRIES,
    JSON.stringify(value)
  );