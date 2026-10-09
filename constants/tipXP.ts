import { XP_FOR_AREA_VIEW, XP_FOR_CHAT_QUESTION, XP_FOR_INFORMATION_READ, XP_FOR_RELATED_FOODS_READ, XP_FOR_RELATED_METRICS_READ, XP_FOR_TIMING_READ, XP_FOR_VERDICT } from './XP';

export const INSIGHT_QUESTION_TYPES = ['studies', 'experts', 'risks'] as const;
export type InsightQuestionType = (typeof INSIGHT_QUESTION_TYPES)[number];

/** Each insight question earns XP once per tip. */
export function getInsightQuestionXP(askedQuestions: readonly string[], questionType: string): number {
  return askedQuestions.includes(questionType) ? 0 : XP_FOR_CHAT_QUESTION;
}

export const INFORMATION_READ_SECONDS = 5;

export type TipReadingSection = 'information' | 'timing' | 'metrics' | 'foods';

export function getTipReadingXP(section: TipReadingSection): number {
  const awards: Record<TipReadingSection, number> = { information: XP_FOR_INFORMATION_READ, timing: XP_FOR_TIMING_READ, metrics: XP_FOR_RELATED_METRICS_READ, foods: XP_FOR_RELATED_FOODS_READ };
  return awards[section];
}

export const TIP_READING_FIELDS = { information: 'informationRead', timing: 'timingRead', metrics: 'metricsRead', foods: 'foodsRead' } as const;

export const MAX_TIP_EDUCATION_XP = XP_FOR_RELATED_FOODS_READ + XP_FOR_RELATED_METRICS_READ + XP_FOR_TIMING_READ + XP_FOR_INFORMATION_READ + XP_FOR_CHAT_QUESTION * INSIGHT_QUESTION_TYPES.length + XP_FOR_VERDICT;

export function getAreaViewXP(viewedAreaIds: readonly string[], areaId: string): number {
  return viewedAreaIds.includes(areaId) ? 0 : XP_FOR_AREA_VIEW;
}
