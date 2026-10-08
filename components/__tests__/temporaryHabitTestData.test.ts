import AsyncStorage from '@react-native-async-storage/async-storage';

import { getPlans, savePlans } from '@/app/context/storage/plans/planStorage';
import { EMPTY_PLANS } from '@/app/context/storage/plans/planTypes';
import { tips } from '@/locales/tips';
import { createHabitTestPlans, seedHabitTestDataOnce } from '@/services/testData/temporaryHabitTestData';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));
jest.mock('@/app/context/storage/plans/planStorage', () => ({ getPlans: jest.fn(), savePlans: jest.fn() }));

it('creates valid habits with distinct local start dates in the last two months', () => {
  const today = new Date(2026, 9, 8, 9);
  const plans = createHabitTestPlans(today);
  expect(plans).toHaveLength(8);
  expect(new Set(plans.map(plan => plan.startedAt)).size).toBe(8);
  for (const plan of plans) {
    const start = new Date(plan.startedAt);
    expect(start.getHours()).toBe(12);
    expect(start.getTime()).toBeGreaterThan(new Date(2026, 7, 8).getTime());
    expect(start.getTime()).toBeLessThan(today.getTime());
    expect(tips.find(tip => tip.id === plan.tipId)?.habitTargets?.length).toBeGreaterThan(0);
  }
});

it('seeds once and preserves existing plans and their start dates', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
  jest.mocked(AsyncStorage.setItem).mockResolvedValue();
  const existing = { ...createHabitTestPlans()[0], startedAt: '2026-10-01T12:00:00Z' };
  jest.mocked(getPlans).mockResolvedValue({ ...EMPTY_PLANS, other: [existing] });
  jest.mocked(savePlans).mockResolvedValue();
  await Promise.all([seedHabitTestDataOnce(), seedHabitTestDataOnce()]);
  expect(savePlans).toHaveBeenCalledTimes(1);
  const saved = jest.mocked(savePlans).mock.calls[0][0];
  expect(saved.other).toHaveLength(8);
  expect(saved.other[0]).toBe(existing);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('temporary-habit-test-data-v1', 'done');
});
