import type {
  TrainingActivityFilter,
  TrainingActivityType,
  TrainingIntensity,
  TrainingIntensityFilter,
} from '@/types/training';

import type {
  DailyTracking,
} from '../types/trackingTypes';

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

export type DailyTrainingTracking =
  DailyTracking<TrainingLogEntry[]>;

export type TrainingStorage = {
  trainingPlanSettings: Record<
    string,
    TrainingPlanSettings
  >;

  dailyTrainingTracking: DailyTrainingTracking;
};