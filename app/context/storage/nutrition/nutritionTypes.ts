import { MineralType } from '@/constants/minerals';
import { NutritionComposition } from '@/types/nutrition/nutritionProfile';
import { NutritionTargetPeriod, NutritionTargetUnit } from '@/types/nutrition/nutritionTargets';

import { DailyTracking, WeeklyTracking } from '../types/trackingTypes';

export type TipTargetItem = {
  tag: string;
  unit: NutritionTargetUnit;
  period: NutritionTargetPeriod;
  amount: number;
  actual: number;
  foodActual?: number;
  supplementActual?: number;
  isMet: boolean;
  label: string;
  trackedItems?: WeeklyTrackingItem[];
  supplementIds?: string[];
};

export type TipTargetProgress = Pick<
  TipTargetItem,
  'tag' | 'unit' | 'period' | 'actual' | 'foodActual' | 'supplementActual' | 'isMet' | 'trackedItems' | 'supplementIds'
>;

export type TipTargetUnit = NutritionTargetUnit;
export type TipTargetPeriod = NutritionTargetPeriod;

export type TipProgressItem = {
  tipId: string;
  title: string;
  areaId?: string;
  dateKey?: string;
  startedAt?: string;
  period: TipTargetPeriod;
  targets: Array<{
    tag: string;
    unit: TipTargetUnit;
    period: TipTargetPeriod;
    amount: number;
    actual: number;
    foodActual?: number;
    supplementActual?: number;
    isMet: boolean;
    label: string;
    trackedItems?: WeeklyTrackingItem[];
    supplementIds?: string[];
  }>;
  metCount: number;
  totalCount: number;
  isFulfilled: boolean;
  progress: number;
};

export type DailyNutritionTracking = DailyTracking<DailyNutritionSummary>;

export type WeeklyTrackingItem = { en: string; local: string };

export type WeeklyNutritionValue = WeeklyTrackingItem[] | number;

export type NutritionTrackingContribution = {
  nutritionEntryId: string;
  date: string;
  signals: Record<string, WeeklyNutritionValue>;
};

export type WeeklyNutritionTracking = WeeklyTracking<NutritionTrackingContribution[]>;

export type NutritionEntryType = 'meal' | 'food' | 'drink';

export type NutritionEntryBase = NutritionComposition & {
  id: string;
  recordedAt: string;
  name: string;
  mineralsConfidenceByType?: Partial<Record<MineralType, 'high' | 'medium' | 'low' | 'unknown'>>;
};

export type MealEntry = NutritionEntryBase & {
  type: Extract<NutritionEntryType, 'meal'>;
};

export type FoodEntry = NutritionEntryBase & {
  type: Extract<NutritionEntryType, 'food'>;
};

export type DrinkNutritionEntry = NutritionEntryBase & {
  type: Extract<NutritionEntryType, 'drink'>;
};

export type NutritionEntry = MealEntry | FoodEntry | DrinkNutritionEntry;

export type DailyNutritionSummary = {
  date: string;
  entries: NutritionEntry[];
  totals: {
    protein: number;
    calories: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
  goalsMet: {
    protein: boolean;
    calories: boolean;
    carbohydrates: boolean;
    fat: boolean;
    fiber: boolean;
  };
};
