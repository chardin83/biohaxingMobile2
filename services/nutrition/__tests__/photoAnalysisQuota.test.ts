import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFreePhotoAnalysesRemaining, refundFreePhotoAnalysis, reserveFreePhotoAnalysis, resetFreePhotoAnalysisQuota } from '../photoAnalysisQuota';

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('persists the three included analyses and refuses additional analyses', async () => {
  expect(await getFreePhotoAnalysesRemaining()).toBe(3);
  expect(await reserveFreePhotoAnalysis()).toBe(true);
  expect(await getFreePhotoAnalysesRemaining()).toBe(2);
  const results = await Promise.all([reserveFreePhotoAnalysis(), reserveFreePhotoAnalysis(), reserveFreePhotoAnalysis()]);
  expect(results).toEqual([true, true, false]);
  expect(await getFreePhotoAnalysesRemaining()).toBe(0);
  expect(await AsyncStorage.getItem('premiumTrialPhotoAnalysesUsed')).toBe('3');
});

it('returns an analysis when processing fails without exceeding the free allowance', async () => {
  await reserveFreePhotoAnalysis();
  await refundFreePhotoAnalysis();
  expect(await getFreePhotoAnalysesRemaining()).toBe(3);
  await refundFreePhotoAnalysis();
  expect(await getFreePhotoAnalysesRemaining()).toBe(3);
});

it('explicitly resets trial quota without removing saved meals', async () => {
  await AsyncStorage.setItem('premiumTrialPhotoAnalysesUsed', '3');
  await AsyncStorage.setItem('saved-meals', JSON.stringify([{ name: 'Min middag' }]));
  await Promise.all([resetFreePhotoAnalysisQuota(), resetFreePhotoAnalysisQuota()]);
  expect(await getFreePhotoAnalysesRemaining()).toBe(3);
  expect(await AsyncStorage.getItem('saved-meals')).toBe(JSON.stringify([{ name: 'Min middag' }]));
  await reserveFreePhotoAnalysis();
  expect(await getFreePhotoAnalysesRemaining()).toBe(2);
  await resetFreePhotoAnalysisQuota();
  expect(await getFreePhotoAnalysesRemaining()).toBe(3);
});

it('starts a fresh premium trial allowance after older limited free analyses', async () => {
  await AsyncStorage.setItem('freePhotoAnalysesUsed', '3');
  expect(await getFreePhotoAnalysesRemaining()).toBe(3);
});
