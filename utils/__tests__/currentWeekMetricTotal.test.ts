import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';

import { getCurrentWeekMetricTotal } from '../metricDateUtils';

const entry = (date: string, value: number): MetricEntry => ({ metricId: 'weighted_training_minutes', recordedAt: `${date}T12:00:00`, value, unit: 'min', origin: 'training' });

it('sums Monday through today and excludes previous weeks and future dates', () => {
  const entries = [entry('2026-10-25', 100), entry('2026-10-26', 20), entry('2026-10-27', 30), entry('2026-10-28', 40), entry('2026-10-29', 500)];
  expect(getCurrentWeekMetricTotal(entries, new Date(2026, 9, 28))).toBe(90);
  expect(getCurrentWeekMetricTotal(entries, new Date(2026, 9, 26))).toBe(20);
});

it('keeps Sunday in the same week and handles a week crossing New Year', () => {
  expect(getCurrentWeekMetricTotal([entry('2026-10-26', 20), entry('2026-11-01', 30)], new Date(2026, 10, 1))).toBe(50);
  expect(getCurrentWeekMetricTotal([entry('2026-12-27', 100), entry('2026-12-28', 20), entry('2027-01-01', 30)], new Date(2027, 0, 1))).toBe(50);
});

it('distinguishes measured zero from missing data and ignores invalid values', () => {
  const now = new Date(2026, 9, 26);
  expect(getCurrentWeekMetricTotal([], now)).toBeUndefined();
  expect(getCurrentWeekMetricTotal([entry('2026-10-26', NaN), entry('2026-10-26', -5), entry('invalid', 5)], now)).toBeUndefined();
  expect(getCurrentWeekMetricTotal([entry('2026-10-26', 0)], now)).toBe(0);
});
