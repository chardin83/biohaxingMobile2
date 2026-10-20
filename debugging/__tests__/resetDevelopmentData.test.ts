import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFreePhotoAnalysesRemaining } from '@/services/nutrition/photoAnalysisQuota';

import { resetDevelopmentData } from '../resetDevelopmentData';

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('does not reset the trial counter with default development options', async () => {
  await AsyncStorage.setItem('premiumTrialPhotoAnalysesUsed', '3');
  await resetDevelopmentData();
  expect(await getFreePhotoAnalysesRemaining()).toBe(0);
});

it('resets only the trial counter when explicitly enabled', async () => {
  await AsyncStorage.setItem('premiumTrialPhotoAnalysesUsed', '3');
  await AsyncStorage.setItem('saved-meals', 'keep this');
  await resetDevelopmentData({ premiumTrials: true });
  expect(await getFreePhotoAnalysesRemaining()).toBe(3);
  expect(await AsyncStorage.getItem('saved-meals')).toBe('keep this');
});
