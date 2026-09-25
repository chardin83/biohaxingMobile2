import AsyncStorage from '@react-native-async-storage/async-storage';

const getDailyKey = (namespace: string, dateKey: string): string => `${namespace}:${dateKey}`;

export const getDailyValue = async <T>(namespace: string, dateKey: string): Promise<T | undefined> => {
  const value = await AsyncStorage.getItem(getDailyKey(namespace, dateKey));

  return value ? (JSON.parse(value) as T) : undefined;
};

export const saveDailyValue = async <T>(namespace: string, dateKey: string, value: T): Promise<void> => {
  await AsyncStorage.setItem(getDailyKey(namespace, dateKey), JSON.stringify(value));
};

export const removeDailyValue = async (namespace: string, dateKey: string): Promise<void> => {
  await AsyncStorage.removeItem(getDailyKey(namespace, dateKey));
};

export const getTrackingKeys = async (namespace: string): Promise<string[]> => {
  const prefix = `${namespace}:`;
  const keys = await AsyncStorage.getAllKeys();

  return keys
    .filter(key => key.startsWith(prefix))
    .map(key => key.slice(prefix.length))
    .sort((a, b) => a.localeCompare(b));
};

export const getDailyRange = async <T>(namespace: string, dateKeys: string[]): Promise<Record<string, T>> => {
  if (dateKeys.length === 0) {
    return {};
  }

  const prefix = `${namespace}:`;

  const values = await AsyncStorage.multiGet(dateKeys.map(dateKey => `${prefix}${dateKey}`));

  return Object.fromEntries(
    values.flatMap(([key, value]) => {
      if (!value) {
        return [];
      }

      const dateKey = key.slice(prefix.length);

      return [[dateKey, JSON.parse(value) as T]];
    })
  );
};
