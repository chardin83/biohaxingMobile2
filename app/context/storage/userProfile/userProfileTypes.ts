import { ClockTime } from '@/types/ClockTime';

export type NutritionDistribution = 'balanced' | 'lowCarb' | 'ketogenic' | 'lowFat' | 'custom';

export interface UserProfile {
  maxHeartRate?: number;
  birthDate?: string;
  weightKg?: number;
  heightCm?: number;
  activityPal?: number;
  nutritionGuideCompleted?: boolean;
  nutritionGuideSkipped?: boolean;
  trackMacros?: boolean;
  biologicalSex?: 'female' | 'male' | 'intersex';
  bedtime?: ClockTime;
  nutritionDistribution?: NutritionDistribution;
  nutritionEnergySource?: 'henry' | 'custom';
  nutritionGoals?: {
    protein: number;
    carbohydrates: number;
    fat: number;
  };
}
