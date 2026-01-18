// Central XP configuration for awards across the app
export const XP_FOR_VIEW = 10; // First time viewing a tip
export const XP_FOR_CHAT_QUESTION = 5; // Per unique question type (studies/experts/risks)
export const XP_PER_CHAT_MESSAGE = 2; // Per chat message
export const XP_FOR_VERDICT = 5; // First time setting a verdict

export type XpEventType = 'view' | 'chat-question' | 'chat-message' | 'verdict';

export const XP_LABELS: Record<XpEventType, string> = {
  'view': 'Tip viewed',
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
