import AsyncStorage from '@react-native-async-storage/async-storage';

import { getXpStorage, saveViewedTips } from '@/app/context/storage/xp/xpStorage';
import { getAreaViewXP } from '@/constants/tipXP';
import { XP_FOR_AREA_VIEW } from '@/constants/XP';

it('preserves claimed area rewards after reloading and allows other areas', async () => {
  await saveViewedTips([{ tipId: 'example', viewedAt: '2026-10-09', askedQuestions: [], viewedAreaIds: ['energy'], informationRead: true, timingRead: true, metricsRead: true, foodsRead: true, xpEarned: 15 }]);
  const { viewedTips } = await getXpStorage();
  expect(getAreaViewXP(viewedTips[0].viewedAreaIds ?? [], 'energy')).toBe(0);
  expect(getAreaViewXP(viewedTips[0].viewedAreaIds ?? [], 'sleepQuality')).toBe(XP_FOR_AREA_VIEW);
  expect(viewedTips[0].informationRead).toBe(true);
  expect(viewedTips[0].timingRead).toBe(true);
  expect(viewedTips[0].metricsRead).toBe(true);
  expect(viewedTips[0].foodsRead).toBe(true);
  expect(viewedTips[0].xpEarned).toBe(15);
  await AsyncStorage.clear();
});
