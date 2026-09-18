import { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import { getUserProfile } from '@/app/context/storage/userProfile/userProfileStore';
import { ClockTime } from '@/types/ClockTime';

import { BloodPressureReading, WearableAdapter } from './types';

export const WEARABLE_SYNC_INTERVAL_MS = 5 * 60 * 1000;

type UpsertMetricEntries = (entries: MetricEntry[]) => void;

function hasDeep(entry: any): entry is typeof entry & {
  stages: {
    deepMinutes: number;
  };
} {
  return typeof entry?.stages?.deepMinutes === 'number';
}

function hasRem(entry: any): entry is typeof entry & {
  stages: {
    remMinutes: number;
  };
} {
  return typeof entry?.stages?.remMinutes === 'number';
}

function hasBedtime(entry: any): entry is typeof entry & {
  bedtimeMinutes: number;
} {
  return typeof entry?.bedtimeMinutes === 'number';
}

function isValidBloodPressureReading(reading: BloodPressureReading) {
  return (
    typeof reading.systolic === 'number' &&
    Number.isFinite(reading.systolic) &&
    typeof reading.diastolic === 'number' &&
    Number.isFinite(reading.diastolic) &&
    typeof reading.recordedAt === 'string' &&
    !Number.isNaN(new Date(reading.recordedAt).getTime())
  );
}

function toRecordedAt(date: string) {
  return `${date}T00:00:00.000Z`;
}

function toBedtimeMinutes(startTime?: string) {
  if (!startTime) {
    return null;
  }

  const parsed = new Date(startTime);
  const timestamp = parsed.getTime();

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return parsed.getHours() * 60 + parsed.getMinutes();
}

export function shouldSyncWearableData(lastSyncAt?: string, intervalMs = WEARABLE_SYNC_INTERVAL_MS) {
  if (!lastSyncAt) {
    return true;
  }

  const lastSync = new Date(lastSyncAt).getTime();

  if (Number.isNaN(lastSync)) {
    return true;
  }

  return Date.now() - lastSync >= intervalMs;
}

function getMinutesBeforeBedtime(lastIntenseExerciseAt: string, bedtime: ClockTime): number | null {
  const intenseAt = new Date(lastIntenseExerciseAt);
  if (Number.isNaN(intenseAt.getTime())) {
    return null;
  }
  const [hours, minutes] = bedtime.split(':').map(Number);
  const bedtimeAt = new Date(intenseAt.getFullYear(), intenseAt.getMonth(), intenseAt.getDate(), hours, minutes, 0, 0);
  return Math.round((bedtimeAt.getTime() - intenseAt.getTime()) / 60000);
}

export async function syncWearableMetricsToStorage(adapter: WearableAdapter, upsertMetricEntries: UpsertMetricEntries, lookbackDays = 7) {
  const range = {
    start: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  };

  const [sleep, vo2Max, activity, energy, hrvs, restingHeartRates, bloodPressure, userProfile] = await Promise.all([
    adapter.getSleep(range),
    adapter.getVO2Max(range),
    adapter.getDailyActivity(range),
    adapter.getEnergySignal(range),

    adapter.getHRV(range).catch(error => {
      console.warn('[WearableSync] Failed to fetch HRV', error);

      return [];
    }),

    adapter.getRestingHeartRate(range).catch(error => {
      console.warn('[WearableSync] Failed to fetch resting heart rate', error);

      return [];
    }),

    adapter.getBloodPressure(range).catch(error => {
      console.warn('[WearableSync] Failed to fetch blood pressure', error);

      return [];
    }),
    getUserProfile(),
  ]);

  console.log(
    '[HealthConnectAdapter] intense exercise',
    JSON.stringify(
      activity.map(entry => ({
        date: entry.date,
        intensityMinutes: entry.intensityMinutes,
        lastIntenseExerciseAt: entry.lastIntenseExerciseAt,
      })),
      null,
      2
    )
  );

  const detectedVendor = (
    adapter as WearableAdapter & {
      vendor?: string;
    }
  ).vendor;

  const vendorSuffix = detectedVendor ? ` (${detectedVendor})` : '';

  const notesLabel = adapter.source === 'healthkit' ? `AppleHealth${vendorSuffix}` : `HealthConnect${vendorSuffix}`;

  //console.log('[WearableSync] Activity from adapter:', activity);

  //console.log('[WearableSync] Blood pressure from adapter:', bloodPressure);

  const bloodPressureEntries = bloodPressure.filter(isValidBloodPressureReading).flatMap(reading => {
    const readingNotes = reading.sourceName ? `${notesLabel} (${reading.sourceName})` : notesLabel;

    return [
      {
        metricId: 'systolic_bp',
        value: reading.systolic,
        unit: 'mmHg',
        recordedAt: reading.recordedAt,
        notes: readingNotes,
      } satisfies MetricEntry,

      {
        metricId: 'diastolic_bp',
        value: reading.diastolic,
        unit: 'mmHg',
        recordedAt: reading.recordedAt,
        notes: readingNotes,
      } satisfies MetricEntry,
    ];
  });

  const entries: MetricEntry[] = [
    ...sleep
      .filter(entry => typeof entry.durationMinutes === 'number')
      .map(
        entry =>
          ({
            metricId: 'sleep_duration',
            value: entry.durationMinutes,
            unit: 'min',
            recordedAt: toRecordedAt(entry.date),
            notes: notesLabel,
          }) satisfies MetricEntry
      ),

    ...sleep.filter(hasDeep).map(
      entry =>
        ({
          metricId: 'deep_sleep',
          value: entry.stages.deepMinutes,
          unit: 'min',
          recordedAt: toRecordedAt(entry.date),
          notes: notesLabel,
        }) satisfies MetricEntry
    ),

    ...sleep.filter(hasRem).map(
      entry =>
        ({
          metricId: 'rem_sleep',
          value: entry.stages.remMinutes,
          unit: 'min',
          recordedAt: toRecordedAt(entry.date),
          notes: notesLabel,
        }) satisfies MetricEntry
    ),

    ...sleep
      .map(entry => ({
        date: entry.date,
        bedtimeMinutes: toBedtimeMinutes(entry.startTime),
      }))
      .filter(hasBedtime)
      .map(
        entry =>
          ({
            metricId: 'sleep_bedtime',
            value: entry.bedtimeMinutes,
            unit: 'min_from_midnight',
            recordedAt: toRecordedAt(entry.date),
            notes: notesLabel,
          }) satisfies MetricEntry
      ),

    ...vo2Max.map(
      entry =>
        ({
          metricId: 'vo2_max',
          value: entry.value,
          unit: 'ml/kg/min',
          recordedAt: toRecordedAt(entry.date),
          notes: notesLabel,
        }) satisfies MetricEntry
    ),

    ...activity
      .filter(entry => typeof entry.lastIntenseExerciseAt === 'string' && Boolean(userProfile.bedtime))
      .map(entry => ({
        entry,
        minutes: getMinutesBeforeBedtime(entry.lastIntenseExerciseAt!, userProfile.bedtime!),
      }))
      .filter(
        (
          item
        ): item is typeof item & {
          minutes: number;
        } => item.minutes !== null
      )
      .map(({ entry, minutes }) => {
        console.log('[WearableSync] intense before bedtime', {
          date: entry.date,
          lastIntenseExerciseAt: entry.lastIntenseExerciseAt,
          bedtime: userProfile.bedtime,
          minutes,
        });
        return {
          metricId: 'intense_exercise_before_sleep',
          value: minutes,
          unit: 'min',
          recordedAt: toRecordedAt(entry.date),
          notes: notesLabel,
        } satisfies MetricEntry;
      }),

    ...activity
      .filter(entry => typeof entry.activeMinutes === 'number')
      .map(
        entry =>
          ({
            metricId: 'active_minutes',
            value: entry.activeMinutes as number,
            unit: 'min',
            recordedAt: toRecordedAt(entry.date),
            notes: notesLabel,
          }) satisfies MetricEntry
      ),

    ...activity
      .filter(entry => typeof entry.intensityMinutes === 'number')
      .map(
        entry =>
          ({
            metricId: 'intensity_minutes',
            value: entry.intensityMinutes as number,
            unit: 'min',
            recordedAt: toRecordedAt(entry.date),
            notes: notesLabel,
          }) satisfies MetricEntry
      ),

    ...energy
      .filter(entry => typeof entry.bodyBatteryLevel === 'number')
      .map(
        entry =>
          ({
            metricId: 'body_battery',
            value: entry.bodyBatteryLevel as number,
            unit: '%',
            recordedAt: toRecordedAt(entry.date),
            notes: notesLabel,
          }) satisfies MetricEntry
      ),

    ...hrvs
      .filter(entry => typeof entry.sdnnMs === 'number')
      .map(
        entry =>
          ({
            metricId: 'hrv',
            value: entry.sdnnMs as number,
            unit: 'ms',
            recordedAt: toRecordedAt(entry.date),
            notes: notesLabel,
          }) satisfies MetricEntry
      ),

    ...restingHeartRates
      .filter(entry => typeof entry.bpm === 'number')
      .map(
        entry =>
          ({
            metricId: 'resting_hr',
            value: entry.bpm,
            unit: 'bpm',
            recordedAt: toRecordedAt(entry.date),
            notes: notesLabel,
          }) satisfies MetricEntry
      ),

    ...bloodPressureEntries,
  ];

  upsertMetricEntries(entries);

  return {
    entryCount: entries.length,
    bloodPressureReadingCount: bloodPressure.length,
  };
}
