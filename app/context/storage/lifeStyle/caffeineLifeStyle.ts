import type { ClockTime } from '@/types/ClockTime';
import { hasCaffeine } from '@/utils/drinkCaffeine';
import { DEFAULT_BEDTIME } from '@/utils/sleepTimeUtils';

import type { DailyDrinkTracking, DrinkEntry } from '../drinks/drinkTypes';
import type { LifeStyleDay, LifeStyleLog } from './lifeStyleTypes';

const CAFFEINE_BEFORE_SLEEP_THRESHOLD_HOURS = 8;

function isCloseToBedtime(entry: DrinkEntry, bedtime?: ClockTime): boolean {
  if (!bedtime) return false;
  const [hours, minutes] = bedtime.split(':').map(Number);
  const recordedAt = new Date(entry.recordedAt);
  if (
    !Number.isFinite(recordedAt.getTime()) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  )
    return false;
  const plannedSleep = new Date(recordedAt);
  plannedSleep.setHours(hours, minutes, 0, 0);
  if (plannedSleep < recordedAt) plannedSleep.setDate(plannedSleep.getDate() + 1);
  return plannedSleep.getTime() - recordedAt.getTime() < CAFFEINE_BEFORE_SLEEP_THRESHOLD_HOURS * 60 * 60 * 1000;
}

function syncCaffeineTag(day: LifeStyleDay, id: 'caffeine' | 'caffeineBeforeSleep', entries: DrinkEntry[]): LifeStyleDay {
  const current = day[id];
  const latest = entries.reduce<DrinkEntry | undefined>(
    (previous, entry) => (!previous || entry.recordedAt > previous.recordedAt ? entry : previous),
    undefined
  );
  if (!latest) {
    if (current?.source !== 'journal') return day;
    const updated = { ...day };
    delete updated[id];
    return updated;
  }
  if (current?.value === true && current.source === 'journal' && current.recordedAt === latest.recordedAt) return day;
  return { ...day, [id]: { value: true, recordedAt: latest.recordedAt, source: 'journal' } };
}

export function syncCaffeineLifeStyle(log: LifeStyleLog, drinks: DailyDrinkTracking, bedtime: ClockTime = DEFAULT_BEDTIME): LifeStyleLog {
  let next = log;
  const dates = new Set([...Object.keys(log), ...Object.keys(drinks)]);
  for (const date of dates) {
    const caffeinatedDrinks = (drinks[date] ?? []).filter(hasCaffeine);
    const closeToBedtime = caffeinatedDrinks.filter(entry => isCloseToBedtime(entry, bedtime));
    const caffeineDay = syncCaffeineTag(log[date] ?? {}, 'caffeine', caffeinatedDrinks);
    const day = syncCaffeineTag(caffeineDay, 'caffeineBeforeSleep', closeToBedtime);
    if (day === log[date] || (!log[date] && !Object.keys(day).length)) continue;
    if (next === log) next = { ...log };
    if (Object.keys(day).length) next[date] = day;
    else delete next[date];
  }
  return next;
}
