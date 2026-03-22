import { MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import { buildTrendData } from '@/utils/metrics';

export type MetricHistoryEntry = {
  recordedAt: string;
  value: number;
  unit: string;
};

export type TrainingLoadStatus = 'high' | 'optimal' | 'low' | 'none';

function toUtcDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function getWeekStartDate(date: string) {
  const utcDate = toUtcDate(date);
  const day = utcDate.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  utcDate.setUTCDate(utcDate.getUTCDate() - diffToMonday);
  return utcDate.toISOString().slice(0, 10);
}

export function getIsoWeekInfo(date: string) {
  const target = toUtcDate(date);
  const weekday = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - weekday);

  const isoYear = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const dayOfYear = Math.floor((target.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const isoWeek = Math.ceil(dayOfYear / 7);

  return { isoYear, isoWeek };
}

export function buildDailyTrainingLoadTrendData(
  activeEntries: MetricHistoryEntry[],
  intensityEntries: MetricHistoryEntry[]
): MetricTrendPoint[] {
  const activeByDate = new Map(buildTrendData(activeEntries).map(point => [point.date, point.value]));
  const intensityByDate = new Map(buildTrendData(intensityEntries).map(point => [point.date, point.value]));

  const dates = Array.from(new Set([...activeByDate.keys(), ...intensityByDate.keys()])).sort((a, b) =>
    a.localeCompare(b)
  );

  return dates.map(date => {
    const active = activeByDate.get(date) ?? 0;
    const vigorous = intensityByDate.get(date) ?? 0;
    const moderate = Math.max(active - vigorous, 0);
    return {
      date,
      value: moderate + vigorous * 2,
    };
  });
}

export function buildWeeklyTrainingLoadTrendData(
  activeEntries: MetricHistoryEntry[],
  intensityEntries: MetricHistoryEntry[]
): MetricTrendPoint[] {
  const dailyPoints = buildDailyTrainingLoadTrendData(activeEntries, intensityEntries);
  const weeklyMap = new Map<string, number>();

  dailyPoints.forEach(point => {
    const weekStart = getWeekStartDate(point.date);
    const current = weeklyMap.get(weekStart) ?? 0;
    weeklyMap.set(weekStart, current + point.value);
  });

  return Array.from(weeklyMap.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([date, value]) => ({ date, value: Math.round(value) }));
}

export function getCurrentWeekTrainingLoad(activeEntries: MetricHistoryEntry[], intensityEntries: MetricHistoryEntry[]) {
  const dailyPoints = buildDailyTrainingLoadTrendData(activeEntries, intensityEntries);
  if (dailyPoints.length === 0) {
    return { hasData: false, load: null, moderateMinutes: 0, vigorousMinutes: 0 };
  }

  const today = new Date().toISOString().slice(0, 10);
  const currentWeekStart = getWeekStartDate(today);

  const activeByDate = new Map(buildTrendData(activeEntries).map(point => [point.date, point.value]));
  const intensityByDate = new Map(buildTrendData(intensityEntries).map(point => [point.date, point.value]));

  const weekDates = Array.from(new Set([...activeByDate.keys(), ...intensityByDate.keys()]))
    .filter(date => date >= currentWeekStart && date <= today)
    .sort((a, b) => a.localeCompare(b));

  const totals = weekDates.reduce(
    (acc, date) => {
      const active = activeByDate.get(date) ?? 0;
      const vigorous = intensityByDate.get(date) ?? 0;
      const moderate = Math.max(active - vigorous, 0);
      return {
        moderateMinutes: acc.moderateMinutes + moderate,
        vigorousMinutes: acc.vigorousMinutes + vigorous,
      };
    },
    { moderateMinutes: 0, vigorousMinutes: 0 }
  );

  const hasData = weekDates.length > 0;
  const load = hasData ? totals.moderateMinutes + totals.vigorousMinutes * 2 : null;
  return { hasData, load, ...totals };
}

export function getTrainingLoadStatus(load: number): TrainingLoadStatus {
  if (load <= 0) return 'none';
  if (load > 300) return 'high';
  if (load < 150) return 'low';
  return 'optimal';
}
