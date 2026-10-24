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
  // Kontrollsumma av periodens matlogg, tillskott och GI-uppföljning.
  // Upptäcker ändrat underlag så att målstatusen kan räknas om, utan att lagra hela underlaget igen.
  // Ändrade mål påverkar inte kontrollsumman: targets behåller målen och resultatet som gällde när de uppfylldes.
  inputSignature: string;
  targets: TipTargetItem[];
  xp: number;
  awardedAt: string;
  period: NutritionTargetPeriod;
  periodKey: string;
  tipId: string;
};
