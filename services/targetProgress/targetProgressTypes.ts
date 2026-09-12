import { type DailyNutritionSummary,WeeklyTrackingItem } from '@/app/context/storage/nutrition/nutritionTypes';
import {  MetricEntry, TrainingLogEntry } from '@/app/context/StorageContext';


export type TargetPeriod = 'daily' | 'weekly';

export type TargetProgress = {
  current: number;
  target: number;
  unit: string;
  isFulfilled: boolean;
};

export type TargetDefinition = {
  trackingKey: string;
  amount: number;
  unit: string;
  period: TargetPeriod;
};

export type TargetProgressStorage = {
  dailyNutritionSummaries: Record<string, DailyNutritionSummary>;
  trainingEntries: Record<string, TrainingLogEntry[]>;
  metricEntries: MetricEntry[];
  weeklyTracking: Record<
    string,
    Record<string, WeeklyTrackingItem[] | number>
  >;
};