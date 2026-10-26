import type { TrainingActivityType, TrainingIntensity } from '@/types/training';

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
  intensity?: TrainingIntensity;
  notes?: string;
  createdAt: string;
};

export type TrainingLogInput = Omit<TrainingLogEntry, 'id' | 'createdAt'>;

export type DailyTrainingTracking = DailyTracking<TrainingLogEntry[]>;

export type TrainingStorage = {
  dailyTrainingTracking: DailyTrainingTracking;
};
