import AsyncStorage from '@react-native-async-storage/async-storage';

import { getXpStorage, saveViewedTips } from '@/app/context/storage/xp/xpStorage';
import { getAreaViewXP, getMaxTipEducationXP, MAX_TIP_EDUCATION_XP } from '@/constants/tipXP';
import { XP_FOR_AREA_VIEW } from '@/constants/XP';

it('preserves claimed area rewards after reloading and allows other areas', async () => {
  await saveViewedTips([{ tipId: 'example', viewedAt: '2026-10-09', askedQuestions: [], viewedAreaIds: ['energy'], xpEarned: 15 }]);
  const { viewedTips } = await getXpStorage();
  expect(getAreaViewXP(viewedTips[0].viewedAreaIds ?? [], 'energy')).toBe(0);
  expect(getAreaViewXP(viewedTips[0].viewedAreaIds ?? [], 'sleepQuality')).toBe(XP_FOR_AREA_VIEW);
  expect(viewedTips[0].xpEarned).toBe(15);
  expect(getMaxTipEducationXP(2)).toBe(MAX_TIP_EDUCATION_XP + 2 * XP_FOR_AREA_VIEW);
  await AsyncStorage.clear();
});
