import type { Tip } from '@/locales/tips';

import { fromDateKey, getAge } from './dateUtils';

export function getTipUserAge(birthDate?: string, today = new Date()): number | undefined {
  if (!birthDate) return undefined;
  const birthday = fromDateKey(birthDate.slice(0, 10));
  if (!Number.isFinite(birthday.getTime()) || birthday > today) return undefined;
  return getAge(birthday, today);
}

export function matchesTipAge(tip: Pick<Tip, 'minAge'>, age: number | undefined): boolean {
  return tip.minAge === undefined || age === undefined || age >= tip.minAge;
}
