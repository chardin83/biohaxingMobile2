import AsyncStorage from '@react-native-async-storage/async-storage';

import { toDateKey } from '@/utils/dateUtils';

type StorageLogOptions = {
  include: string[];
  exclude: string[];
  keysOnly: boolean;
  date?: string | null;
};

// Ändra här för att välja vad som skrivs ut vid omladdning.
export const STORAGE_LOG_OPTIONS: StorageLogOptions = {
  include: [
    'lifeStyleLog',
    'dailyNutritionTracking', // Måltider och näringsvärden, inklusive dryckers näring.
    'dailyDrinkTracking', // Drycker, tidpunkter och kopplingar till näringsposter.
    // 'weeklyNutritionTracking',
    //'dailyHabitTracking',
    // 'lifeStyleLog',
    // 'dailyTrainingTracking',
    // 'nutritionXpClaims',
  ], // Tom lista = alla.
  exclude: ['metricEntries'], // Döljer även metricEntries:... . Tom lista = dölj inget.
  keysOnly: false, // true = visa bara nyckelnamnen, utan innehåll.
  date: 'today', // 'today' = idag (lokalt datum), '2026-10-16' = vald dag, null = alla dagar.
};

const matchesNamespace = (key: string, namespaces: string[]) => namespaces.some(namespace => key === namespace || key.startsWith(namespace + ':'));

export async function logAsyncStorage(options: StorageLogOptions = STORAGE_LOG_OPTIONS): Promise<void> {
  const date = options.date === 'today' ? toDateKey(new Date()) : options.date;
  const allKeys = await AsyncStorage.getAllKeys();
  const keys = allKeys
    .filter(key => (options.include.length === 0 || matchesNamespace(key, options.include)) && !matchesNamespace(key, options.exclude))
    .filter(key => !date || key.endsWith(`:${date}`))
    .sort((a, b) => a.localeCompare(b));
  const dateSuffix = date ? ` för ${date}` : '';
  console.log(`[AsyncStorage] Visar ${keys.length} av ${allKeys.length} sparade nycklar${dateSuffix}`);
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
