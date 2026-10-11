import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';

import { formatLatestMetricValue, getLatestMetricEntries } from '../latestMetricOverview';

const now = new Date(2026, 9, 11, 12);
const entry = (date: Date, value = 60): MetricEntry => ({ metricId: 'resting_hr', value, unit: 'bpm', recordedAt: date.toISOString() });
const t = (key: string, options?: Record<string, unknown>) => String(options?.defaultValue ?? key);

it('selects the latest valid value regardless of ordering and preserves missing history', () => {
  const latest = entry(now, 65);
  expect(getLatestMetricEntries([latest, entry(new Date(2026, 9, 1)), entry(new Date(2026, 9, 12)), { ...latest, value: NaN }], now).resting_hr).toBe(latest);
  expect(getLatestMetricEntries([], now).resting_hr).toBeUndefined();
});

it('omits the date today and includes a parenthesized date for older values', () => {
  expect(formatLatestMetricValue(entry(now), 'sv', t, now)).toBe('60 bpm');
  expect(formatLatestMetricValue(entry(new Date(2026, 9, 10)), 'sv', t, now)).toMatch(/^60 bpm \(.*2026\)$/);
});

it('formats clock times and recovery scores as readable values', () => {
  expect(formatLatestMetricValue({ ...entry(now), unit: 'min_from_midnight', value: 1350 }, 'sv', t, now)).toBe('22:30');
  expect(formatLatestMetricValue({ ...entry(now), unit: 'score_0_100', value: 70 }, 'sv', t, now)).toBe('70/100');
});
