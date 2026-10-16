import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LIFE_STYLE_ITEMS, type LifeStyleId } from '@/constants/lifeStyle';
import type { ClockTime } from '@/types/ClockTime';

import type { DailyDrinkTracking } from '../drinks/drinkTypes';
import { syncAlcoholLifeStyle } from './alcoholLifeStyle';
import { syncCaffeineLifeStyle } from './caffeineLifeStyle';
import { clearLifeStyleStorage, getLifeStyleLog, saveLifeStyleDay } from './lifeStyleStorage';
import type { LifeStyleLog } from './lifeStyleTypes';

export type LifeStyleStorageValue = {
  lifeStyleLog: LifeStyleLog;
  lifeStyleLoading: boolean;
  lifeStyleError?: string;
  logLifeStyleEntry: (date: string, id: LifeStyleId, value: boolean) => Promise<void>;
  removeLifeStyleEntry: (date: string, id: LifeStyleId) => Promise<void>;
  clearLifeStyleLog: () => Promise<void>;
};

export function useLifeStyleStorage() {
  const [lifeStyleLog, setLifeStyleLog] = useState<LifeStyleLog>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const current = useRef<LifeStyleLog>({});
  const queue = useRef<Promise<void>>(Promise.resolve());
  const enqueue = useCallback((operation: () => Promise<void>) => {
    const result = queue.current.then(operation);
    queue.current = result.catch(() => undefined);
    return result;
  }, []);
  const publish = useCallback((log: LifeStyleLog) => {
    current.current = log;
    setLifeStyleLog(log);
    setError(undefined);
  }, []);

  useEffect(() => {
    enqueue(async () => publish(await getLifeStyleLog()))
      .catch(() => setError('lifeStyle.loadError'))
      .finally(() => setIsLoading(false));
  }, [enqueue, publish]);

  const logEntry = useCallback(
    (date: string, id: LifeStyleId, value: boolean) =>
      enqueue(async () => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Object.hasOwn(LIFE_STYLE_ITEMS, id) || typeof value !== 'boolean') throw new Error('Invalid lifestyle entry');
        const day = { ...current.current[date], [id]: { value, recordedAt: new Date().toISOString() } };
        await saveLifeStyleDay(date, day);
        publish({ ...current.current, [date]: day });
      }),
    [enqueue, publish]
  );

  const removeEntry = useCallback(
    (date: string, id: LifeStyleId) =>
      enqueue(async () => {
        const day = { ...current.current[date] };
        delete day[id];
        await saveLifeStyleDay(date, day);
        const next = { ...current.current };
        if (Object.keys(day).length) next[date] = day;
        else delete next[date];
        publish(next);
      }),
    [enqueue, publish]
  );

  const clearLog = useCallback(
    () =>
      enqueue(async () => {
        await clearLifeStyleStorage();
        publish({});
      }),
    [enqueue, publish]
  );

  const syncDrinkTags = useCallback((drinks: DailyDrinkTracking, bedtime?: ClockTime) => enqueue(async () => {
    const next = syncAlcoholLifeStyle(syncCaffeineLifeStyle(current.current, drinks, bedtime), drinks, bedtime);
    if (next === current.current) return;
    for (const date of new Set([...Object.keys(current.current), ...Object.keys(next)])) {
      if (next[date] === current.current[date]) continue;
      await saveLifeStyleDay(date, next[date] ?? {});
      const updated = { ...current.current };
      if (next[date]) updated[date] = next[date];
      else delete updated[date];
      publish(updated);
    }
  }), [enqueue, publish]);

  return useMemo(
    () => ({
      lifeStyleLog,
      lifeStyleLoading: isLoading,
      lifeStyleError: error,
      logLifeStyleEntry: logEntry,
      removeLifeStyleEntry: removeEntry,
      clearLifeStyleLog: clearLog,
      syncDrinkTags,
    }),
    [lifeStyleLog, isLoading, error, logEntry, removeEntry, clearLog, syncDrinkTags]
  );
}
