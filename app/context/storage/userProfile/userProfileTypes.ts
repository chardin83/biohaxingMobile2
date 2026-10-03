import { ClockTime } from '@/types/ClockTime';

export type NutritionDistribution = 'balanced' | 'lowCarb' | 'ketogenic' | 'lowFat' | 'custom';

export interface UserProfile {
  maxHeartRate?: number;
  birthDate?: string;
  bedtime?: ClockTime;
  nutritionDistribution?: NutritionDistribution;
  nutritionGoals?: {
    protein: number;
    carbohydrates: number;
    fat: number;
  };
}
