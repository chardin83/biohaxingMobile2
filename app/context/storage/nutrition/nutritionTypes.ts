import { MineralType } from "@/constants/minerals";
import { NutritionComposition } from "@/types/nutritionProfile";

export type WeeklyTrackingItem = { en: string; local: string };

export type MealNutrition =
  NutritionComposition & {
    id?: string;
    date: string;
    mealName?: string;
    mineralsConfidenceByType?: Partial<
      Record<
        MineralType,
        'high' | 'medium' | 'low' | 'unknown'
      >
    >;
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

export type WeeklyTracking = Record<
  string,
  Record<string, WeeklyTrackingItem[] | number>
>;