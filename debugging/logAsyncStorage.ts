import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NutritionXpClaim } from '@/app/context/storage/xp/xpTyptes';
import { getTargetDates } from '@/services/targetProgress/dateRange';
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
    //'lifeStyleLog',
    //'dailyNutritionTracking', // Måltider och näringsvärden, inklusive dryckers näring.
    //'dailyDrinkTracking', // Drycker, tidpunkter och kopplingar till näringsposter.
    // 'weeklyNutritionTracking',
    //'dailyHabitTracking', // Bland annat glycemic_index_review från den dagliga GI-uppföljningen.
    // 'lifeStyleLog',
    // 'dailyTrainingTracking',
    'nutritionXpClaims',
  ], // Tom lista = alla.
  exclude: ['metricEntries'], // Döljer även metricEntries:... . Tom lista = dölj inget.
  keysOnly: false, // true = visa bara nyckelnamnen, utan innehåll.
  date: '2026-10-23', // 'today' = idag (lokalt datum), '2026-10-16' = vald dag, null = alla dagar.
};

const matchesNamespace = (key: string, namespaces: string[]) => namespaces.some(namespace => key === namespace || key.startsWith(namespace + ':'));

function filterNutritionClaims(claims: Record<string, NutritionXpClaim>, date: string) {
  const weekStart = getTargetDates(date, 'weekly')[0];
  return Object.fromEntries(
    Object.entries(claims).filter(([, claim]) => {
      const periodKey = claim.period === 'weekly' ? weekStart : date;
      return claim.periodKey === periodKey;
    })
  );
}

export async function logAsyncStorage(options: StorageLogOptions = STORAGE_LOG_OPTIONS): Promise<void> {
  const date = options.date === 'today' ? toDateKey(new Date()) : options.date;
  const allKeys = await AsyncStorage.getAllKeys();
  const keys = allKeys
    .filter(key => (options.include.length === 0 || matchesNamespace(key, options.include)) && !matchesNamespace(key, options.exclude))
    // Claims share one key for all dates; filter their records below instead.
    .filter(key => !date || key === 'nutritionXpClaims' || key.endsWith(`:${date}`))
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
      const parsed = JSON.parse(formatted);
      const filtered = key === 'nutritionXpClaims' && date && parsed ? filterNutritionClaims(parsed, date) : parsed;
      formatted = JSON.stringify(filtered, null, 2);
    } catch {
      // Plain string values are logged unchanged.
    }
    console.log(`[AsyncStorage] ${key}\n${formatted}`);
  }
}
