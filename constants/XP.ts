// Central XP configuration for awards across the app
// Temporary preview: disable to restore the user's actual XP and level.
export const PREVIEW_MAX_XP = true;
export const isMaxXpPreviewEnabled = () => __DEV__ && PREVIEW_MAX_XP;

export const XP_FOR_RELATED_FOODS_READ = 5; // Reading related foods, once per tip
export const XP_FOR_RELATED_METRICS_READ = 5; // Reading related metrics, once per tip
export const XP_FOR_TIMING_READ = 5; // Reading when a tip fits, once per tip
export const XP_FOR_INFORMATION_READ = 5; // Reading a tip information section once
export const XP_FOR_AREA_VIEW = 5; // Confirming each area has been read, once per tip
export const XP_FOR_CHAT_QUESTION = 5; // Per unique question type (studies/experts/risks)
export const XP_PER_CHAT_MESSAGE = 2; // Per chat message
export const XP_FOR_VERDICT = 5; // First time setting a verdict
export const XP_FOR_NUTRITION_TIP_DAILY_COMPLETION = 10; // Per tip/day when all daily targets are met
export const XP_FOR_NUTRITION_TIP_WEEKLY_COMPLETION = 25; // Per tip/week when all weekly targets are met

export type XpSource = 'education' | 'nutrition';

export type XpEventType = 'chat-question' | 'chat-message' | 'verdict';

export const XP_LABELS: Record<XpEventType, string> = {
  'chat-question': 'Insight question asked',
  'chat-message': 'Chat message',
  'verdict': 'Verdict set',
};

// Level thresholds centralized here for consistency
export interface Level {
  level: number;
  titleKey: string;
  requiredXP: number;
}

export const levels: Level[] = [
  { level: 1, titleKey: '1', requiredXP: 300 },
  { level: 2, titleKey: '2', requiredXP: 450 },
  { level: 3, titleKey: '3', requiredXP: 675 },
  { level: 4, titleKey: '4', requiredXP: 1013 },
  { level: 5, titleKey: '5', requiredXP: 1520 },
  { level: 6, titleKey: '6', requiredXP: 2280 },
  { level: 7, titleKey: '7', requiredXP: 3420 },
  { level: 8, titleKey: '8', requiredXP: 5130 },
  { level: 9, titleKey: '9', requiredXP: 7695 },
  { level: 10, titleKey: '10', requiredXP: 11543 },
];
