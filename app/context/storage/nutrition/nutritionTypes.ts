import { MineralType } from '@/constants/minerals';
import { NutritionComposition } from '@/types/nutritionProfile';
import { NutritionTargetPeriod, NutritionTargetUnit } from '@/types/nutritionTargets';

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

export type WeeklyNutritionValue = WeeklyTrackingItem[] | number;

export type WeeklyNutritionTracking = WeeklyTracking<Record<string, WeeklyNutritionValue>>;

export type WeeklyTrackingItem = { en: string; local: string };

export type MealNutrition = NutritionComposition & {
  id?: string;
  date: string;
  mealName?: string;
  mineralsConfidenceByType?: Partial<Record<MineralType, 'high' | 'medium' | 'low' | 'unknown'>>;
};

export type DailyNutritionSummary = {
  date: string;
  meals: MealNutrition[];
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
