import AsyncStorage from '@react-native-async-storage/async-storage';

import { getPlans, savePlans } from '@/app/context/storage/plans/planStorage';
import type { PlanTipEntry } from '@/app/context/storage/plans/planTypes';

// TEMPORARY: remove this file and the StorageContext call after creating test data.
const SEED_KEY = 'temporary-habit-test-data-v1';
const HABITS = [
  { tipId: 'sleep_timing_circadian', daysAgo: 56 },
  { tipId: 'box_breathing', daysAgo: 48 },
  { tipId: 'meditation_mindfulness', daysAgo: 40 },
  { tipId: 'sleep_environment_optimization', daysAgo: 32 },
  { tipId: 'sleep_hygiene_practices', daysAgo: 24 },
  { tipId: '4_7_8_breathing', daysAgo: 16 },
  { tipId: 'diaphragmatic_breathing', daysAgo: 8 },
  { tipId: 'pre_sleep_wind_down', daysAgo: 2 },
] as const;

export function createHabitTestPlans(now = new Date()): PlanTipEntry[] {
  return HABITS.map(({ tipId, daysAgo }) => {
    const start = new Date(now);
    start.setDate(start.getDate() - daysAgo);
    start.setHours(12, 0, 0, 0);
    const startedAt = start.toISOString();
    return {
      id: `test-habit-${tipId}`,
      tipId,
      planCategory: 'other',
      startedAt,
      createdBy: 'development-test-data',
      editedBy: 'development-test-data',
      editedAt: startedAt,
    };
  });
}

let seedPromise: Promise<void> | undefined;

export function seedHabitTestDataOnce(): Promise<void> {
  if (!__DEV__) return Promise.resolve();

  seedPromise ??= (async () => {
    if (await AsyncStorage.getItem(SEED_KEY)) return;

    const plans = await getPlans();
    const existingTipIds = new Set(plans.other.map(plan => plan.tipId));
    const added = createHabitTestPlans().filter(plan => !existingTipIds.has(plan.tipId));
    await savePlans({ ...plans, other: [...plans.other, ...added] });
    await AsyncStorage.setItem(SEED_KEY, 'done');
  })();

  return seedPromise;
}
