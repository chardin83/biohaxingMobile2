import AsyncStorage from '@react-native-async-storage/async-storage';

type StorageLogOptions = {
  include: string[];
  exclude: string[];
  keysOnly: boolean;
};

// Ändra här för att välja vad som skrivs ut vid omladdning.
export const STORAGE_LOG_OPTIONS: StorageLogOptions = {
  include: [
    'lifeStyleLog',
    // 'dailyNutritionTracking',
    // 'weeklyNutritionTracking',
    'dailyHabitTracking',
    // 'lifeStyleLog',
    // 'dailyTrainingTracking',
    // 'nutritionXpClaims',
  ], // Tom lista = alla.
  exclude: ['metricEntries'], // Döljer även metricEntries:... . Tom lista = dölj inget.
  keysOnly: false, // true = visa bara nyckelnamnen, utan innehåll.
};

const matchesNamespace = (key: string, namespaces: string[]) => namespaces.some(namespace => key === namespace || key.startsWith(namespace + ':'));

export async function logAsyncStorage(options: StorageLogOptions = STORAGE_LOG_OPTIONS): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const keys = allKeys
    .filter(key => (options.include.length === 0 || matchesNamespace(key, options.include)) && !matchesNamespace(key, options.exclude))
    .sort((a, b) => a.localeCompare(b));
  console.log(`[AsyncStorage] Visar ${keys.length} av ${allKeys.length} sparade nycklar`);
  if (options.keysOnly) {
    console.log('[AsyncStorage] Nycklar:', keys.join(', '));
    return;
  }
  const entries = await AsyncStorage.multiGet(keys);
  for (const [key, value] of entries) {
    let formatted = value ?? 'null';
    try {
      formatted = JSON.stringify(JSON.parse(formatted), null, 2);
    } catch {
      // Plain string values are logged unchanged.
    }
    console.log(`[AsyncStorage] ${key}\n${formatted}`);
  }
}
