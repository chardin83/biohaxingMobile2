import type { LifeStyleId } from '@/constants/lifeStyle';
import { NutritionTargetPeriod, NutritionTargetUnit } from '@/types/nutrition/nutritionTargets';
import type { TrainingActivityType } from '@/types/training';

export type TargetPeriod = 'daily' | 'weekly';

export type TargetSource = 'habit' | 'training' | 'nutrition' | 'metric';

export type BaseTargetDefinition = {
  trackingKey: string;
  amount: number;
  unit: string;
  period: TargetPeriod;
};

export type HabitTargetDefinition = BaseTargetDefinition & {
  source: 'habit';
  lifeStyleKeys?: readonly LifeStyleId[];
};

export type TrainingTargetDefinition = BaseTargetDefinition & {
  source: 'training';
  activityTypes: readonly TrainingActivityType[];
};

export type NutritionLabelGroup = 'fiberLabels' | 'polyphenolLabels' | 'mineralLabels' | 'vitaminLabels' | 'aminoAcidLabels' | 'trackingLabels' | 'macroLabels' | 'nutrientLabels';

export type NutritionTargetDefinition = Omit<BaseTargetDefinition, 'unit' | 'period'> & {
  source: 'nutrition';
  unit: NutritionTargetUnit;
  period: NutritionTargetPeriod;
  tag?: string;
  aiInstruction?: string;
  supplementIds?: string[];
  labelGroup?: NutritionLabelGroup;
  labelKey?: string;
  trackingKeys?: readonly string[];
};

export type TargetDefinition = HabitTargetDefinition | TrainingTargetDefinition | NutritionTargetDefinition;
// nutrition + metric lägger vi till
// när deras typer är klara

export type TargetProgress = {
  current: number;
  target: number;
  unit: string;
  isFulfilled: boolean;
};
