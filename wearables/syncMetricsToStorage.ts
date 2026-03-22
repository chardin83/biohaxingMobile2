import { MetricEntry } from '@/app/context/StorageContext';

import { WearableAdapter } from './types';

export const WEARABLE_SYNC_INTERVAL_MS = 5 * 60 * 1000;

type UpsertMetricEntries = (entries: MetricEntry[]) => void;

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

export async function syncWearableMetricsToStorage(
  adapter: WearableAdapter,
  upsertMetricEntries: UpsertMetricEntries,
  lookbackDays = 7
) {
  const range = {
    start: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  };

  const [sleep, activity, energy] = await Promise.all([
    adapter.getSleep(range),
    adapter.getDailyActivity(range),
    adapter.getEnergySignal(range),
  ]);

  const entries: MetricEntry[] = [
    ...sleep
      .filter(entry => typeof entry.durationMinutes === 'number')
      .map(entry => ({
        metricId: 'sleep_duration',
        value: entry.durationMinutes,
        unit: 'min',
        recordedAt: toRecordedAt(entry.date),
        notes: 'wearable_sync',
      })),
    ...sleep
      .filter(entry => typeof entry.stages?.deepMinutes === 'number')
      .map(entry => ({
        metricId: 'deep_sleep',
        value: entry.stages?.deepMinutes,
        unit: 'min',
        recordedAt: toRecordedAt(entry.date),
        notes: 'wearable_sync',
      })),
    ...sleep
      .filter(entry => typeof entry.stages?.remMinutes === 'number')
      .map(entry => ({
        metricId: 'rem_sleep',
        value: entry.stages?.remMinutes,
        unit: 'min',
        recordedAt: toRecordedAt(entry.date),
        notes: 'wearable_sync',
      })),
    ...sleep
      .map(entry => ({
        date: entry.date,
        bedtimeMinutes: toBedtimeMinutes(entry.startTime),
      }))
      .filter(entry => typeof entry.bedtimeMinutes === 'number')
      .map(entry => ({
        metricId: 'sleep_bedtime',
        value: entry.bedtimeMinutes,
        unit: 'min_from_midnight',
        recordedAt: toRecordedAt(entry.date),
        notes: 'wearable_sync',
      })),
    ...activity
      .filter(entry => typeof entry.steps === 'number')
      .map(entry => ({
        metricId: 'steps',
        value: entry.steps,
        unit: 'count',
        recordedAt: toRecordedAt(entry.date),
        notes: 'wearable_sync',
      })),
    ...activity
      .filter(entry => typeof entry.activeMinutes === 'number')
      .map(entry => ({
        metricId: 'active_minutes',
        value: entry.activeMinutes as number,
        unit: 'min',
        recordedAt: toRecordedAt(entry.date),
        notes: 'wearable_sync',
      })),
    ...activity
      .filter(entry => typeof entry.intensityMinutes === 'number')
      .map(entry => ({
        metricId: 'intensity_minutes',
        value: entry.intensityMinutes,
        unit: 'min',
        recordedAt: toRecordedAt(entry.date),
        notes: 'wearable_sync',
      })),
    ...energy
      .filter(entry => typeof entry.bodyBatteryLevel === 'number')
      .map(entry => ({
        metricId: 'body_battery',
        value: entry.bodyBatteryLevel,
        unit: '%',
        recordedAt: toRecordedAt(entry.date),
        notes: 'wearable_sync',
      })),
  ];

  upsertMetricEntries(entries);

  return {
    entryCount: entries.length,
  };
}