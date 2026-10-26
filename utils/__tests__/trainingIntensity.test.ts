import { calculateWorkoutIntensity } from '../trainingIntensity';

const start = '2026-10-20T10:00:00Z';
const end = '2026-10-20T11:00:00Z';
const point = (minute: number, value: number) => ({ time: Date.parse(start) + minute * 60000, value });

it('interpolates threshold crossings and retains exact intervals for overlap deduplication', () => {
  const result = calculateWorkoutIntensity([point(0, 120), point(10, 160), point(20, 160), point(30, 120)], start, end, 140)!;
  expect(result.intensityMinutes).toBe(20);
  expect(result.intensityIntervals).toEqual([
    { startTime: '2026-10-20T10:05:00.000Z', endTime: '2026-10-20T10:10:00.000Z' },
    { startTime: '2026-10-20T10:10:00.000Z', endTime: '2026-10-20T10:20:00.000Z' },
    { startTime: '2026-10-20T10:20:00.000Z', endTime: '2026-10-20T10:25:00.000Z' },
  ]);
});

it('distinguishes measured zero from missing, invalid or too sparse heart-rate data', () => {
  expect(calculateWorkoutIntensity([point(0, 100), point(10, 110)], start, end, 140)).toEqual({ intensityMinutes: 0, intensityIntervals: [] });
  for (const points of [[], [point(0, 160)], [point(0, 160), point(20, 160)], [point(0, 0), point(10, NaN)]]) {
    expect(calculateWorkoutIntensity(points, start, end, 140)).toBeUndefined();
  }
  expect(calculateWorkoutIntensity([point(0, 160), point(10, 160)], start, end, NaN)).toBeUndefined();
});

it('separates light, moderate and vigorous time while interpolating both boundaries', () => {
  const result = calculateWorkoutIntensity([point(0, 80), point(10, 160), point(20, 80)], start, end, 140, 100)!;
  expect(result.moderateMinutes).toBe(10);
  expect(result.intensityMinutes).toBe(5);
  expect(result.moderateIntervals).toEqual([
    { startTime: '2026-10-20T10:02:30.000Z', endTime: '2026-10-20T10:07:30.000Z' },
    { startTime: '2026-10-20T10:12:30.000Z', endTime: '2026-10-20T10:17:30.000Z' },
  ]);
});

it('classifies exact thresholds into non-overlapping bands', () => {
  expect(calculateWorkoutIntensity([point(0, 100), point(10, 100)], start, end, 140, 100)).toMatchObject({ moderateMinutes: 10, intensityMinutes: 0 });
  expect(calculateWorkoutIntensity([point(0, 140), point(10, 140)], start, end, 140, 100)).toMatchObject({ moderateMinutes: 0, intensityMinutes: 10 });
  expect(calculateWorkoutIntensity([point(0, 80), point(10, 80)], start, end, 140, 100)).toMatchObject({ moderateMinutes: 0, intensityMinutes: 0 });
});
