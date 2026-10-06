import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';

import { buildRecoveryTrend, calculateRecoveryScore, getRecoveryLevel } from '../recoveryStatus';

function history(metricId: MetricEntry['metricId'], baseline: number, current: number, unit = 'ms'): MetricEntry[] {
  return [
    { metricId, value: baseline, unit, recordedAt: '2026-10-04T12:00:00' },
    { metricId, value: current, unit, recordedAt: '2026-10-05T12:00:00' },
  ];
}

it('scores matching personal baselines as normal recovery', () => {
  expect(calculateRecoveryScore(history('resting_hr', 60, 60), history('sleep_duration', 480, 480, 'min'), history('hrv_rmssd', 50, 50))).toBe(70);
});

it('weights resting heart rate 30%, sleep 25%, and HRV 45%', () => {
  // Component scores: 100, 35, 70 => 30 + 8.75 + 31.5 = 70.25.
  expect(calculateRecoveryScore(history('resting_hr', 60, 30), history('sleep_duration', 480, 240, 'min'), history('hrv_sdnn', 50, 50))).toBe(70);
});

it('uses daily means and excludes samples outside the preceding 28 days', () => {
  const hrv = history('hrv_rmssd', 50, 40);
  hrv.push({ ...hrv[1], value: 60, recordedAt: '2026-10-05T13:00:00' }, { ...hrv[0], value: 1000, recordedAt: '2026-09-01T12:00:00' });
  expect(calculateRecoveryScore(history('resting_hr', 60, 60), history('sleep_duration', 8, 8, 'hours'), hrv)).toBe(70);
});

it('requires all current measurements on the same day and baseline data', () => {
  expect(calculateRecoveryScore([], [], [])).toBeNull();
  const hrv = history('hrv_rmssd', 50, 50);
  hrv[1].recordedAt = '2026-10-06T12:00:00';
  expect(calculateRecoveryScore(history('resting_hr', 60, 60), history('sleep_duration', 8, 8, 'hours'), hrv)).toBeNull();
  expect(calculateRecoveryScore(history('resting_hr', 60, 60).slice(1), history('sleep_duration', 8, 8, 'hours'), history('hrv_rmssd', 50, 50))).toBeNull();
});

it.each([
  [0, 'lowRecovery'],
  [39, 'lowRecovery'],
  [40, 'reducedRecovery'],
  [59, 'reducedRecovery'],
  [60, 'normalRecovery'],
  [79, 'normalRecovery'],
  [80, 'wellRecovered'],
  [100, 'wellRecovered'],
])('maps score %s to %s', (score, level) => {
  expect(getRecoveryLevel(Number(score))).toBe(level);
});

it('builds historical scores using only each day and its preceding baseline', () => {
  const resting = history('resting_hr', 60, 60);
  const sleep = history('sleep_duration', 480, 480, 'min');
  const hrv = history('hrv_rmssd', 50, 50);
  expect(buildRecoveryTrend(resting, sleep, hrv)).toEqual([{ date: '2026-10-05', value: 70 }]);
  const future = { recordedAt: '2026-10-06T12:00:00', value: 1000 };
  expect(buildRecoveryTrend([...resting, { ...resting[1], ...future }], [...sleep, { ...sleep[1], ...future }], [...hrv, { ...hrv[1], ...future }])[0]).toEqual(
    { date: '2026-10-05', value: 70 }
  );
});
