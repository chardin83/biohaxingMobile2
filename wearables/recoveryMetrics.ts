import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import { getHRVHistory } from '@/utils/hrvHistory';
import { toLocalDateKey } from '@/utils/metricDateUtils';
import { buildRecoveryTrend, calculateRecoveryScore } from '@/utils/recoveryStatus';

// Only recalculate the sync window; saved history provides the preceding baseline.
export function buildSyncedRecoveryMetrics(saved: MetricEntry[], incoming: MetricEntry[]): MetricEntry[] {
  const inputIds = new Set(['resting_hr', 'sleep_duration', 'hrv_rmssd', 'hrv_sdnn']);
  const dates = incoming.filter(entry => inputIds.has(entry.metricId)).map(entry => toLocalDateKey(new Date(entry.recordedAt))).sort((a, b) => a.localeCompare(b));
  if (!dates.length) return [];
  const firstDate = dates[0];
  const lastDate = dates.at(-1)!;
  const baselineStart = new Date(`${firstDate}T12:00:00`);
  baselineStart.setDate(baselineStart.getDate() - 28);
  const startKey = toLocalDateKey(baselineStart);
  const merged = new Map<string, MetricEntry>();
  for (const entry of [...saved, ...incoming]) {
    if (!inputIds.has(entry.metricId)) continue;
    const date = toLocalDateKey(new Date(entry.recordedAt));
    if (date < startKey || date > lastDate) continue;
    merged.set(`${entry.metricId}|${entry.recordedAt}`, entry);
  }
  const entries = [...merged.values()].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const history = (id: MetricEntry['metricId']) => entries.filter(entry => entry.metricId === id);
  return buildRecoveryTrend(history('resting_hr'), history('sleep_duration'), getHRVHistory(history).entries)
    .filter(point => point.date >= firstDate)
    .map(point => ({
      metricId: 'recovery_status',
      origin: 'calculated' as const,
      value: point.value,
      unit: 'score_0_100',
      recordedAt: `${point.date}T00:00:00.000Z`,
      notes: 'Recovery score calculated during wearable sync',
    }));
}

export const RECOVERY_INPUT_METRIC_IDS = new Set(['resting_hr', 'sleep_duration', 'hrv_rmssd', 'hrv_sdnn']);

function getChangedRecoveryDays(previous: MetricEntry[], updated: MetricEntry[]): Set<string> {
  const inputKey = (entry: MetricEntry) => `${entry.metricId}|${entry.recordedAt}`;
  const before = new Map(previous.filter(entry => RECOVERY_INPUT_METRIC_IDS.has(entry.metricId)).map(entry => [inputKey(entry), entry]));
  const after = new Map(updated.filter(entry => RECOVERY_INPUT_METRIC_IDS.has(entry.metricId)).map(entry => [inputKey(entry), entry]));
  const changedDays = new Set<string>();
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const oldEntry = before.get(key);
    const newEntry = after.get(key);
    if (oldEntry?.value === newEntry?.value && oldEntry?.unit === newEntry?.unit) continue;
    changedDays.add(toLocalDateKey(new Date((newEntry ?? oldEntry)!.recordedAt)));
  }
  return changedDays;
}

// Recalculate only affected dates, including the following 28-day baseline window.
export function refreshRecoveryAfterMetricChanges(previous: MetricEntry[], updated: MetricEntry[]): MetricEntry[] {
  const changedDays = getChangedRecoveryDays(previous, updated);
  if (!changedDays.size) return updated;
  const windows = [...changedDays].map(start => {
    const end = new Date(`${start}T12:00:00`);
    end.setDate(end.getDate() + 28);
    return { start, end: toLocalDateKey(end) };
  });
  const affectedDays = new Set<string>(changedDays);
  for (const entry of updated) {
    if (!RECOVERY_INPUT_METRIC_IDS.has(entry.metricId) && entry.metricId !== 'recovery_status') continue;
    const date = toLocalDateKey(new Date(entry.recordedAt));
    if (windows.some(window => date >= window.start && date <= window.end)) affectedDays.add(date);
  }
  const recalculated: MetricEntry[] = [];
  for (const date of affectedDays) {
    const start = new Date(`${date}T12:00:00`);
    start.setDate(start.getDate() - 28);
    const startKey = toLocalDateKey(start);
    const entries = updated.filter(entry => {
      if (!RECOVERY_INPUT_METRIC_IDS.has(entry.metricId)) return false;
      const key = toLocalDateKey(new Date(entry.recordedAt));
      return key >= startKey && key <= date;
    }).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    const history = (id: MetricEntry['metricId']) => entries.filter(entry => entry.metricId === id);
    // Require current measurements for this exact day, even after a deletion.
    const hrv = getHRVHistory(history).entries;
    const series = [history('resting_hr'), history('sleep_duration'), hrv];
    if (series.some(items => !items.some(entry => toLocalDateKey(new Date(entry.recordedAt)) === date))) continue;
    const score = calculateRecoveryScore(series[0], series[1], series[2]);
    if (score !== null) recalculated.push({ metricId: 'recovery_status', origin: 'calculated' as const, value: score, unit: 'score_0_100', recordedAt: `${date}T00:00:00.000Z`, notes: 'Recalculated after source metric changes' });
  }
  return [...updated.filter(entry => entry.metricId !== 'recovery_status' || !affectedDays.has(toLocalDateKey(new Date(entry.recordedAt)))), ...recalculated]
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}
