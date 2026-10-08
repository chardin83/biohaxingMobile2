import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { getBedtimeDeviation, minutesToTimeString, timeStringToMinutes } from '@/components/metrics/sleepConsistency';
import type { ClockTime } from '@/types/ClockTime';
import { toDateKey } from '@/utils/dateUtils';

// Same default shown in PersonSettings. Compare clock times across midnight.
export type SleepScheduleAssessment = {
  status: 'noData' | 'fulfilled' | 'notFulfilled';
  actualBedtime?: string;
  targetBedtime?: ClockTime;
  deviationMinutes?: number;
};

export const getSleepScheduleAssessment = (date: string, entries: MetricEntry[], profile: UserProfile): SleepScheduleAssessment => {
  const bedtime = profile.bedtime ?? '23:00';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(bedtime)) return { status: 'noData' };
  const nightlyEntries = entries.filter(entry => {
    const recordedAt = new Date(entry.recordedAt);
    return !Number.isNaN(recordedAt.getTime()) && toDateKey(recordedAt) === date;
  });
  const latestBedtime = nightlyEntries
    .filter(entry => entry.metricId === 'sleep_bedtime' && Number.isFinite(entry.value) && entry.value >= 0 && entry.value < 1440)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
  if (!latestBedtime) return { status: 'noData' };
  const deviation = getBedtimeDeviation(timeStringToMinutes(bedtime), latestBedtime.value);
  return {
    status: deviation.isGood ? 'fulfilled' : 'notFulfilled',
    actualBedtime: minutesToTimeString(latestBedtime.value),
    targetBedtime: bedtime,
    deviationMinutes: Math.abs(Math.round(deviation.differenceMinutes)),
  };
};

export const getSleepScheduleValue = (date: string, entries: MetricEntry[], profile: UserProfile): number =>
  getSleepScheduleAssessment(date, entries, profile).status === 'fulfilled' ? 1 : 0;
