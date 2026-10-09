import { XP_FOR_AREA_VIEW, XP_FOR_CHAT_QUESTION, XP_FOR_VERDICT, XP_FOR_VIEW } from './XP';

export const INSIGHT_QUESTION_TYPES = ['studies', 'experts', 'risks'] as const;
export type InsightQuestionType = (typeof INSIGHT_QUESTION_TYPES)[number];

/** Each insight question earns XP once per tip. */
export function getInsightQuestionXP(askedQuestions: readonly string[], questionType: string): number {
  return askedQuestions.includes(questionType) ? 0 : XP_FOR_CHAT_QUESTION;
}

export const MAX_TIP_EDUCATION_XP = XP_FOR_VIEW + XP_FOR_CHAT_QUESTION * INSIGHT_QUESTION_TYPES.length + XP_FOR_VERDICT;

export function getAreaViewXP(viewedAreaIds: readonly string[], areaId: string): number {
  return viewedAreaIds.includes(areaId) ? 0 : XP_FOR_AREA_VIEW;
}

export function getMaxTipEducationXP(areaCount: number): number {
  return MAX_TIP_EDUCATION_XP + areaCount * XP_FOR_AREA_VIEW;
}
