import {
  emitUserProfile,
} from './userProfileEvents';
import {
  clearUserProfileStorage,
  getUserProfile,
  saveUserProfileStorage,
} from './userProfileStorage';
import type {
  UserProfile,
} from './userProfileTypes';

export { getUserProfile };

export const saveUserProfile = async (
  profile: UserProfile
): Promise<UserProfile> => {
  await saveUserProfileStorage(profile);

  emitUserProfile(profile);

  return profile;
};

export const updateUserProfile = async (
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const current = await getUserProfile();

  const updated: UserProfile = {
    ...current,
    ...updates,
  };

  await saveUserProfileStorage(updated);

  emitUserProfile(updated);

  return updated;
};

export const clearUserProfile =
  async (): Promise<void> => {
    await clearUserProfileStorage();

    emitUserProfile({});
  };