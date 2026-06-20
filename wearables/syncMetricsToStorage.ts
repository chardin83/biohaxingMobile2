import { MetricEntry } from '@/app/context/StorageContext';

import { WearableAdapter } from './types';

export const WEARABLE_SYNC_INTERVAL_MS = 5 * 60 * 1000;

type UpsertMetricEntries = (entries: MetricEntry[]) => void;

// Narrowing helpers so TS understands the filters guarantee numeric values
function hasDeep(entry: any): entry is (typeof entry & { stages: { deepMinutes: number } }) {
  return typeof entry?.stages?.deepMinutes === 'number';
}
function hasRem(entry: any): entry is (typeof entry & { stages: { remMinutes: number } }) {
  return typeof entry?.stages?.remMinutes === 'number';
}
function hasBedtime(entry: any): entry is (typeof entry & { bedtimeMinutes: number }) {
  return typeof entry?.bedtimeMinutes === 'number';
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

export async function syncWearableMetricsToStorage(
  adapter: WearableAdapter,
  upsertMetricEntries: UpsertMetricEntries,
  lookbackDays = 7
) {
  const range = {
    start: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  };

  console.log('Sleep range start:', range.start);
console.log('Sleep range end:', range.end);

  console.log('[sync] before getSleep');

  const [sleep, activity, energy] = await Promise.all([
    adapter.getSleep(range),
    adapter.getDailyActivity(range),
    adapter.getEnergySignal(range),
  ]);

  // Determine notes label after fetching sleep so adapter.vendor (set in getSleep) is available
  const detectedVendor = (adapter as any)?.vendor;
  const vendorSuffix = detectedVendor ? ` (${detectedVendor})` : '';
  const notesLabel = adapter.source === 'healthkit'
    ? `AppleHealth${vendorSuffix}`
    : 'wearable_sync';

  // fetch HRV / resting heart rate summaries if available
  let hrvs: any[] = [];
  try {
    hrvs = await adapter.getHRV(range);
  } catch {
    // ignore
  }

  const entries: MetricEntry[] = [
    ...sleep
      .filter(entry => typeof entry.durationMinutes === 'number')
      .map(entry => ({
        metricId: 'sleep_duration',
        value: entry.durationMinutes,
        unit: 'min',
        recordedAt: toRecordedAt(entry.date),
        notes: notesLabel,
      }) satisfies MetricEntry),
    ...sleep
      .filter(hasDeep)
      .map(entry => ({
        metricId: 'deep_sleep',
        value: entry.stages.deepMinutes,
        unit: 'min',
        recordedAt: toRecordedAt(entry.date),
        notes: notesLabel,
      }) satisfies MetricEntry),
    ...sleep
      .filter(hasRem)
      .map(entry => ({
        metricId: 'rem_sleep',
        value: entry.stages.remMinutes,
        unit: 'min',
        recordedAt: toRecordedAt(entry.date),
        notes: notesLabel,
      }) satisfies MetricEntry),
    ...sleep
      .map(entry => ({
        date: entry.date,
        bedtimeMinutes: toBedtimeMinutes(entry.startTime),
      }))
      .filter(hasBedtime)
      .map(entry => ({
        metricId: 'sleep_bedtime',
        value: entry.bedtimeMinutes,
        unit: 'min_from_midnight',
        recordedAt: toRecordedAt(entry.date),
        notes: notesLabel,
      }) satisfies MetricEntry),
    ...activity
      .filter(entry => typeof entry.steps === 'number')
      .map(entry => ({
        metricId: 'steps',
        value: entry.steps,
        unit: 'count',
        recordedAt: toRecordedAt(entry.date),
        notes: notesLabel,
      }) satisfies MetricEntry),
    ...activity
      .filter(entry => typeof entry.activeMinutes === 'number')
      .map(entry => ({
        metricId: 'active_minutes',
        value: entry.activeMinutes as number,
        unit: 'min',
        recordedAt: toRecordedAt(entry.date),
        notes: notesLabel,
      })),
    ...activity
      .filter(entry => typeof entry.intensityMinutes === 'number')
      .map(entry => ({
        metricId: 'intensity_minutes',
        value: entry.intensityMinutes,
        unit: 'min',
        recordedAt: toRecordedAt(entry.date),
        notes: notesLabel,
      })),
    ...energy
      .filter(entry => typeof entry.bodyBatteryLevel === 'number')
      .map(entry => ({
        metricId: 'body_battery',
        value: entry.bodyBatteryLevel,
        unit: '%',
        recordedAt: toRecordedAt(entry.date),
        notes: notesLabel,
      })),
    // Resting heart rate
    ...hrvs
      .filter((h: any) => typeof h.avgRestingHrBpm === 'number')
      .map((h: any) => ({
        metricId: 'resting_hr',
        value: h.avgRestingHrBpm,
        unit: 'bpm',
        recordedAt: toRecordedAt(h.date),
        notes: notesLabel,
      })),
  ];
    upsertMetricEntries(entries);

  return {
    entryCount: entries.length,
  };
}