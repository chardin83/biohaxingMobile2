import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PROFILE_SHARING } from '@/types/aiSharing';

import { markAppleHealthConnectionCompleted } from '../../health/appleHealthConnectionHistory';
import {
  getAppStorage,
  saveHealthSyncEnabled,
  saveHideHealthSyncPrompt,
  saveProfileSharing,
  saveShareArchivedPlans,
  saveShareHealthPlan,
  saveShareInterests,
} from '../appStorage';

beforeEach(async () => {
  await AsyncStorage.clear();
});
it('does not infer personal details consent from existing plan consent', async () => {
  await saveShareHealthPlan(true);
  const stored = await getAppStorage();
  expect(stored.shareHealthPlan).toBe(true);
  expect(stored.profileSharing.age).toBe(false);
});
it('persists personal details consent independently and supports revocation', async () => {
  await saveProfileSharing({ ...DEFAULT_PROFILE_SHARING, age: true, activityPal: true });
  expect((await getAppStorage()).profileSharing.age).toBe(true);
  await saveProfileSharing({ ...DEFAULT_PROFILE_SHARING });
  expect((await getAppStorage()).profileSharing.age).toBe(false);
});

it('stores interests and archives independently from health plan consent', async () => {
  await saveShareHealthPlan(true);
  expect((await getAppStorage()).shareInterests).toBe(false);
  expect((await getAppStorage()).shareArchivedPlans).toBe(false);
  await saveShareInterests(true);
  expect((await getAppStorage()).shareInterests).toBe(true);
  expect((await getAppStorage()).shareArchivedPlans).toBe(false);
  await saveShareArchivedPlans(true);
  expect((await getAppStorage()).shareArchivedPlans).toBe(true);
});

it('persists the hide-health prompt choice across reloads and can clear it', async () => {
  expect((await getAppStorage()).hideHealthSyncPrompt).toBe(false);
  await saveHideHealthSyncPrompt(true);
  expect((await getAppStorage()).hideHealthSyncPrompt).toBe(true);
  await saveHideHealthSyncPrompt(false);
  expect((await getAppStorage()).hideHealthSyncPrompt).toBe(false);
});

it('keeps Apple Health connection history when deletable health settings are reset', async () => {
  await markAppleHealthConnectionCompleted();
  await saveHealthSyncEnabled(true);
  await saveHealthSyncEnabled(false);
  await saveHideHealthSyncPrompt(false);
  const restored = await getAppStorage();
  expect(restored.healthSyncEnabled).toBe(false);
  expect(restored.hasConnectedAppleHealth).toBe(true);
});
