import type { NutritionData } from '@/app/context/storage/nutrition/nutritionTypes';
import type { DetectedDrink } from '@/services/gptServices';
import type { WeeklyTrackingSignals } from '@/utils/analyzeNutrition';

export type SelectedImageFile = {
  uri: string;
  name: string;
  type: string;
};

export type ReviewDrink = DetectedDrink & {
  confirmed: boolean;
};

export type PendingAnalysisReview = {
  analysis: NutritionData | null;
  weeklyTrackingSignals: WeeklyTrackingSignals;
  detectedDrinks?: ReviewDrink[];
  evidence: {
    sources: string[];
    inferred: string[];
    confidence: 'high' | 'medium' | 'low' | 'unknown';
  } | null;
  aiDescription: string | null;
  evidenceMessage: string | null;
  statusMessage: string | null;
};
