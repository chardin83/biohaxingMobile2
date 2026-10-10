import AsyncStorage from '@react-native-async-storage/async-storage';

import { COACH_WEEKLY_QUESTION_LIMIT, PREMIUM } from '@/constants/Premium';
import { toDateKey } from '@/utils/dateUtils';

const STORAGE_KEY = 'coachWeeklyQuestions';
export type CoachQuestionUsage = { week: string; used: number };

export function getCoachWeek(date = new Date()): string {
  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return toDateKey(monday);
}

export function getNextCoachReset(date = new Date()): Date {
  const monday = new Date(date);
  monday.setDate(monday.getDate() + 7 - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function getCoachQuestionUsage(date = new Date()): Promise<CoachQuestionUsage> {
  const week = getCoachWeek(date);
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  if (!value) return { week, used: 0 };
  const saved = JSON.parse(value) as CoachQuestionUsage;
  if (saved.week !== week) return { week, used: 0 };
  const used = Number.isInteger(saved.used) ? Math.max(0, Math.min(COACH_WEEKLY_QUESTION_LIMIT, saved.used)) : 0;
  return { week, used };
}

// Serialize claims so rapid taps cannot spend the same remaining question twice.
let pendingClaim: Promise<unknown> = Promise.resolve();
export function claimCoachQuestion(date = new Date()): Promise<{ allowed: boolean; usage: CoachQuestionUsage }> {
  const claim = pendingClaim.then(async () => {
    const usage = await getCoachQuestionUsage(date);
    if (PREMIUM) return { allowed: true, usage };
    if (usage.used >= COACH_WEEKLY_QUESTION_LIMIT) return { allowed: false, usage };
    const next = { ...usage, used: usage.used + 1 };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { allowed: true, usage: next };
  });
  pendingClaim = claim.catch(() => undefined);
  return claim;
}
