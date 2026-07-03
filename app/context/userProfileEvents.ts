import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'userProfile';

export interface UserProfile {
  maxHeartRate?: number;
  birthDate?: string;
}

type Subscriber = (profile: UserProfile) => void;

const subs = new Set<Subscriber>();

export const subscribe = (fn: Subscriber) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

const emit = (profile: UserProfile) => {
  subs.forEach(fn => fn(profile));
};

export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);

    if (!value) {
      return {};
    }

    return JSON.parse(value) as UserProfile;
  } catch (err) {
    console.warn('userProfileStorage: failed to load', err);
    return {};
  }
};

export const saveUserProfile = async (profile: UserProfile) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    emit(profile);
  } catch (err) {
    console.warn('userProfileStorage: failed to save', err);
  }
};

export const updateUserProfile = async (
  updates: Partial<UserProfile>
) => {
  try {
    const current = await getUserProfile();

    const updated = {
      ...current,
      ...updates,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    emit(updated);

    return updated;
  } catch (err) {
    console.warn('userProfileStorage: failed to update', err);
  }
};