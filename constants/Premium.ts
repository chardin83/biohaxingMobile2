// Temporary development switch. Replace with subscription status when available.
export const PREMIUM = false;

/** All subscription allowances. A null premium limit means it is not decided yet. */
export const PREMIUM_QUOTAS = {
  free: {
    photoAnalyses: { limit: 3, period: 'total' },
    coachQuestions: { limit: 3, period: 'week' },
    aiPlans: { limit: 3, period: 'total' },
  },
  premium: {
    photoAnalyses: { limit: 100, period: 'month' },
    coachQuestions: { limit: null, period: 'week' },
    aiPlans: { limit: null, period: 'total' },
  },
} as const;

export const COACH_WEEKLY_QUESTION_LIMIT = PREMIUM_QUOTAS.free.coachQuestions.limit;
export const FREE_PHOTO_ANALYSIS_LIMIT = PREMIUM_QUOTAS.free.photoAnalyses.limit;
