import type { NutritionTargetPeriod } from "@/types/nutritionTargets";
import { VerdictValue } from "@/types/verdict";

export interface ViewedTip {
  tipId: string;
  viewedAt: string;
  askedQuestions: string[];
  xpEarned: number;
  verdict?: VerdictValue;
}

export type XpBreakdown = {
  education: number;
  nutrition: number;
};

export type NutritionXpClaim = {
  xp: number;
  awardedAt: string;
  period: NutritionTargetPeriod;
  periodKey: string;
  tipId: string;
};