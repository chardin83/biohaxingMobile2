import type { DrinkType } from '@/services/gptServices';

import type { DailyTracking } from '../types/trackingTypes';

export type DrinkEntry = {
  id: string;
  type: DrinkType;
  name: string;
  amountMl?: number;
  sugarFree?: boolean;
  caffeinated?: boolean;
  recordedAt: string;
  source: 'meal_analysis' | 'manual';
};

export type DailyDrinkTracking = DailyTracking<DrinkEntry[]>;
