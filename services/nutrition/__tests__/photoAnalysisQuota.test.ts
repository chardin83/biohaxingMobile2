import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFreePhotoAnalysesRemaining, refundFreePhotoAnalysis, reserveFreePhotoAnalysis } from '../photoAnalysisQuota';

beforeEach(async () => { await AsyncStorage.clear(); });

it('persists the three included analyses and refuses additional analyses', async () => {
  expect(await getFreePhotoAnalysesRemaining()).toBe(3);
  expect(await reserveFreePhotoAnalysis()).toBe(true);
  expect(await getFreePhotoAnalysesRemaining()).toBe(2);
  const results = await Promise.all([reserveFreePhotoAnalysis(), reserveFreePhotoAnalysis(), reserveFreePhotoAnalysis()]);
  expect(results).toEqual([true, true, false]);
  expect(await getFreePhotoAnalysesRemaining()).toBe(0);
  expect(await AsyncStorage.getItem('freePhotoAnalysesUsed')).toBe('3');
});

it('returns an analysis when processing fails without exceeding the free allowance', async () => {
  await reserveFreePhotoAnalysis();
  await refundFreePhotoAnalysis();
  expect(await getFreePhotoAnalysesRemaining()).toBe(3);
  await refundFreePhotoAnalysis();
  expect(await getFreePhotoAnalysesRemaining()).toBe(3);
});
