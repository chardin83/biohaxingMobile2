import AsyncStorage from '@react-native-async-storage/async-storage';

export const formatStorageSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
};

export const getStorageSize = async (namespaces: string[]): Promise<number> => {
  const keys = await AsyncStorage.getAllKeys();
  const matchingKeys = keys.filter(key => namespaces.some(namespace => key === namespace || key.startsWith(`${namespace}:`)));

  if (matchingKeys.length === 0) return 0;

  const values = await AsyncStorage.multiGet(matchingKeys);

  return values.reduce((total, [key, value]) => total + key.length + (value?.length ?? 0), 0);
};
