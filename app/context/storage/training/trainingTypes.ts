import type { TrainingActivityType, TrainingIntensity, TrainingIntensityInterval } from '@/types/training';

import type { SampleProvenance } from '../metrics/metricTypes';
import type { DailyTracking } from '../types/trackingTypes';

export type TrainingLogEntry = SampleProvenance & {
  origin?: 'manual' | 'healthkit' | 'healthconnect';
  startTime?: string;
  endTime?: string;
  activityName?: string;
  id: string;
  date: string;
  activityType: TrainingActivityType;
  durationMinutes: number;
  distanceKm?: number;
  averageHeartRate?: number;
  intensity?: TrainingIntensity;
  highIntensityMinutes?: number;
  highIntensityIntervals?: TrainingIntensityInterval[];
  lowIntensityMinutes?: number;
  lowIntensityIntervals?: TrainingIntensityInterval[];
  moderateMinutes?: number;
  moderateIntervals?: TrainingIntensityInterval[];
  intensityMinutes?: number;
  intensityIntervals?: TrainingIntensityInterval[];
  notes?: string;
  createdAt: string;
};

export type TrainingLogInput = Omit<TrainingLogEntry, 'id' | 'createdAt'>;

export type DailyTrainingTracking = DailyTracking<TrainingLogEntry[]>;

export type TrainingStorage = {
  dailyTrainingTracking: DailyTrainingTracking;
};
