import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeChoice = 'device' | 'light' | 'dark';
const STORAGE_KEY = 'preferredTheme';

type Subscriber = (t: ThemeChoice) => void;
const subs: Set<Subscriber> = new Set();

export const subscribe = (fn: Subscriber) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

export const emit = (t: ThemeChoice) => {
  for (const s of subs) s(t);
};

export const setPreferredTheme = async (t: ThemeChoice) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, t);
    emit(t);
  } catch (err) {
    console.warn('themeEvents: failed to save', err);
  }
};

export const getStoredPreferredTheme = async (): Promise<ThemeChoice | null> => {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'device') return v;
    return null;
  } catch (err) {
    console.warn('themeEvents: failed to load', err);
    return null;
  }
};
