import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserProfile } from './userProfileTypes';

const STORAGE_KEY = 'userProfile';

export const getUserProfile =
  async (): Promise<UserProfile> => {
    try {
      const value = await AsyncStorage.getItem(
        STORAGE_KEY
      );

      if (!value) {
        return {};
      }

      return JSON.parse(value) as UserProfile;
    } catch (err) {
      console.warn(
        'userProfileStorage: failed to load',
        err
      );

      return {};
    }
  };

export const saveUserProfileStorage = async (
  profile: UserProfile
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(profile)
    );
  } catch (err) {
    console.warn(
      'userProfileStorage: failed to save',
      err
    );

    throw err;
  }
};

export const clearUserProfileStorage =
  async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn(
        'userProfileStorage: failed to clear',
        err
      );

      throw err;
    }
  };