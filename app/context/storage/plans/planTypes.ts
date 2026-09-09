import { Plan } from "@/app/domain/Plan";
import { SupplementPlanEntry } from "@/app/domain/SupplementPlanEntry";
import { PlanCategory } from "@/types/planCategory";

export type PlanTipEntry = {
  startedAt: string;
  id?: string;
  createdBy: string;
  editedAt: string;
  editedBy: string;
  tipId: string;
  planCategory: Exclude<PlanCategory, 'supplement'>;
  comment?: string;
};

export type ArchivedPlanTipEntry = PlanTipEntry & {
  endedAt: string;
};

export type ArchivedSupplementPlanEntry = SupplementPlanEntry & {
  endedAt: string;
};

export type ReasonSummary = {
  text: string;
  createdAt: string;
};

export type PlansByCategory = {
  supplements: Plan[];
  training: PlanTipEntry[];
  nutrition: PlanTipEntry[];
  other: PlanTipEntry[];
  reasonSummary: ReasonSummary;
};

export type ArchivedPlansByCategory = {
  training: ArchivedPlanTipEntry[];
  nutrition: ArchivedPlanTipEntry[];
  other: ArchivedPlanTipEntry[];
  supplements: ArchivedSupplementPlanEntry[];
};

export const EMPTY_PLANS: PlansByCategory = {
  supplements: [],
  training: [],
  nutrition: [],
  other: [],
  reasonSummary: { text: '', createdAt: '' },
};

export const EMPTY_ARCHIVED_PLANS: ArchivedPlansByCategory = {
  training: [],
  nutrition: [],
  other: [],
  supplements: [],
};