import type { NutritionTargetPeriod } from '@/types/nutrition/nutritionTargets';
import { VerdictValue } from '@/types/verdict';

import type { TipTargetItem } from '../nutrition/nutritionTypes';

export interface ViewedTip {
  tipId: string;
  viewedAt: string;
  askedQuestions: string[];
  informationRead?: boolean;
  timingRead?: boolean;
  metricsRead?: boolean;
  foodsRead?: boolean;
  viewedAreaIds?: string[];
  xpEarned: number;
  verdict?: VerdictValue;
}

export type XpBreakdown = {
  education: number;
  nutrition: number;
};

export type NutritionXpClaim = {
  inputSignature: string;
  targets: TipTargetItem[];
  xp: number;
  awardedAt: string;
  period: NutritionTargetPeriod;
  periodKey: string;
  tipId: string;
};
