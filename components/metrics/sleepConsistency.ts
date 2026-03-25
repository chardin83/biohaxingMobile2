import { type MetricEntry } from '@/app/context/StorageContext';

const MINUTES_PER_DAY = 1440;
const MINUTES_PER_HALF_DAY = MINUTES_PER_DAY / 2;
const PERFECT_THRESHOLD_MINUTES = 5;
const GOOD_THRESHOLD_MINUTES = 30;

export const DEFAULT_TARGET_BEDTIME_MINUTES = 22 * 60 + 30;

export type ConsistencyLevel = 'low' | 'moderate' | 'good' | 'optimal';

export type SleepConsistencySummary = {
  latestTodayBedtimeMinutes?: number;
  weeklyAverageBedtimeMinutes?: number;
  weeklyDifferenceMinutes?: number;
  weeklyAverageAbsoluteDifferenceMinutes?: number;
  weeklyHitCount: number;
  daysWithData: number;
  level: ConsistencyLevel;
};

export type BedtimeDeviation = {
  differenceMinutes: number;
  isPerfect: boolean;
  isGood: boolean;
  direction: 'earlier' | 'late';
};

function normalizeMinutes(value: number) {
  return ((Math.round(value) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

function getCircularMeanMinutes(values: number[]) {
  if (values.length === 0) {
    return undefined;
  }

  let sinSum = 0;
  let cosSum = 0;
  for (const value of values) {
    const radians = (normalizeMinutes(value) / MINUTES_PER_DAY) * 2 * Math.PI;
    sinSum += Math.sin(radians);
    cosSum += Math.cos(radians);
  }

  const meanAngle = Math.atan2(sinSum / values.length, cosSum / values.length);
  const normalizedAngle = meanAngle < 0 ? meanAngle + 2 * Math.PI : meanAngle;
  return (normalizedAngle / (2 * Math.PI)) * MINUTES_PER_DAY;
}

function getSignedClockDifference(targetMinutes: number, actualMinutes: number) {
  const normalizedTarget = normalizeMinutes(targetMinutes);
  const normalizedActual = normalizeMinutes(actualMinutes);
  let diff = normalizedTarget - normalizedActual;

  if (diff > MINUTES_PER_HALF_DAY) {
    diff -= MINUTES_PER_DAY;
  } else if (diff < -MINUTES_PER_HALF_DAY) {
    diff += MINUTES_PER_DAY;
  }

  return diff;
}

function toLocalDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeeklyBounds(today: Date) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getLevelFromAverageAbsoluteDifference(averageAbsoluteDifferenceMinutes?: number): ConsistencyLevel {
  if (typeof averageAbsoluteDifferenceMinutes !== 'number') {
    return 'low';
  }

  if (averageAbsoluteDifferenceMinutes <= PERFECT_THRESHOLD_MINUTES) {
    return 'optimal';
  }

  if (averageAbsoluteDifferenceMinutes <= 15) {
    return 'good';
  }

  if (averageAbsoluteDifferenceMinutes <= GOOD_THRESHOLD_MINUTES) {
    return 'moderate';
  }

  return 'low';
}

export function getBedtimeDeviation(targetMinutes: number, actualMinutes: number): BedtimeDeviation {
  const differenceMinutes = getSignedClockDifference(targetMinutes, actualMinutes);
  const absoluteDifference = Math.abs(differenceMinutes);

  return {
    differenceMinutes,
    isPerfect: absoluteDifference <= PERFECT_THRESHOLD_MINUTES,
    isGood: absoluteDifference <= GOOD_THRESHOLD_MINUTES,
    direction: differenceMinutes > 0 ? 'earlier' : 'late',
  };
}

export function minutesToTimeString(minutesFromMidnight?: number) {
  if (typeof minutesFromMidnight !== 'number') {
    return undefined;
  }

  const normalized = normalizeMinutes(minutesFromMidnight);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getSleepConsistencySummary(
  entries: MetricEntry[],
  targetBedtimeMinutes = DEFAULT_TARGET_BEDTIME_MINUTES,
  now = new Date()
): SleepConsistencySummary {
  const todayKey = toLocalDateKey(now);
  const { start, end } = getWeeklyBounds(now);
  const latestEntryPerDay = new Map<string, MetricEntry>();

  for (const entry of entries) {
    const recordedAtDate = new Date(entry.recordedAt);
    if (Number.isNaN(recordedAtDate.getTime())) {
      continue;
    }

    if (recordedAtDate < start || recordedAtDate > end) {
      continue;
    }

    const dayKey = toLocalDateKey(recordedAtDate);
    const current = latestEntryPerDay.get(dayKey);
    if (!current || current.recordedAt < entry.recordedAt) {
      latestEntryPerDay.set(dayKey, entry);
    }
  }

  const latestTodayEntry = latestEntryPerDay.get(todayKey);
  const values = Array.from(latestEntryPerDay.values()).map(entry => normalizeMinutes(entry.value));

  const daysWithData = values.length;
  const weeklyAverageBedtimeMinutes = getCircularMeanMinutes(values);

  const weeklyDifferenceMinutes = typeof weeklyAverageBedtimeMinutes === 'number'
    ? getSignedClockDifference(targetBedtimeMinutes, weeklyAverageBedtimeMinutes)
    : undefined;

  const absoluteDifferences = values.map(value => Math.abs(getSignedClockDifference(targetBedtimeMinutes, value)));
  const weeklyAverageAbsoluteDifferenceMinutes = absoluteDifferences.length > 0
    ? absoluteDifferences.reduce((sum, value) => sum + value, 0) / absoluteDifferences.length
    : undefined;

  const weeklyHitCount = values.filter(value => Math.abs(targetBedtimeMinutes - value) <= PERFECT_THRESHOLD_MINUTES).length;

  return {
    latestTodayBedtimeMinutes: latestTodayEntry ? normalizeMinutes(latestTodayEntry.value) : undefined,
    weeklyAverageBedtimeMinutes,
    weeklyDifferenceMinutes,
    weeklyAverageAbsoluteDifferenceMinutes,
    weeklyHitCount,
    daysWithData,
    level: getLevelFromAverageAbsoluteDifference(weeklyAverageAbsoluteDifferenceMinutes),
  };
}
