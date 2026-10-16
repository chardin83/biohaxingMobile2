import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useLifeStyleStorage } from '@/app/context/storage/lifeStyle/useLifeStyleStorage';

const date = '2026-10-15';
beforeEach(async () => { await AsyncStorage.clear(); });

it('persists the bedtime tag when coffee is moved from morning to evening', async () => {
  const { result } = renderHook(useLifeStyleStorage);
  await waitFor(() => expect(result.current.lifeStyleLoading).toBe(false));
  const coffee = { id: 'coffee', type: 'coffee' as const, name: 'Coffee', source: 'manual' as const, recordedAt: new Date(2026, 9, 15, 8).toISOString() };
  await act(async () => { await result.current.syncCaffeine({ [date]: [coffee] }, '23:00'); });
  expect(result.current.lifeStyleLog[date].caffeineBeforeSleep).toBeUndefined();
  const eveningCoffee = { ...coffee, recordedAt: new Date(2026, 9, 15, 20, 51).toISOString() };
  await act(async () => { await result.current.syncCaffeine({ [date]: [eveningCoffee] }); });
  expect(result.current.lifeStyleLog[date].caffeineBeforeSleep?.value).toBe(true);
  expect(JSON.parse((await AsyncStorage.getItem(`lifeStyleLog:${date}`))!).caffeineBeforeSleep.value).toBe(true);
});

it('persists automatic coffee tags and removes them when the drink is deleted', async () => {
  const { result } = renderHook(useLifeStyleStorage);
  await waitFor(() => expect(result.current.lifeStyleLoading).toBe(false));
  await act(async () => {
    await result.current.syncCaffeine({ [date]: [{ id: 'coffee', type: 'coffee', name: 'Coffee', source: 'manual', recordedAt: new Date(2026, 9, 15, 18).toISOString() }] }, '22:00');
  });
  expect(result.current.lifeStyleLog[date].caffeineBeforeSleep?.value).toBe(true);
  expect(JSON.parse((await AsyncStorage.getItem(`lifeStyleLog:${date}`))!).caffeine.value).toBe(true);
  await act(async () => { await result.current.syncCaffeine({}, '22:00'); });
  expect(result.current.lifeStyleLog[date]).toBeUndefined();
  expect(await AsyncStorage.getItem(`lifeStyleLog:${date}`)).toBeNull();
});

it('stores concurrent answers independently of plans and habit target logs', async () => {
  const { result, unmount } = renderHook(useLifeStyleStorage);
  await waitFor(() => expect(result.current.lifeStyleLoading).toBe(false));
  await act(async () => {
    await Promise.all([
      result.current.logLifeStyleEntry(date, 'dimmedLights', true),
      result.current.logLifeStyleEntry(date, 'calmActivity', false),
      result.current.logLifeStyleEntry(date, 'reducedScreens', false),
    ]);
  });
  expect(result.current.lifeStyleLog[date]).toMatchObject({ dimmedLights: { value: true }, calmActivity: { value: false }, reducedScreens: { value: false } });
  expect(await AsyncStorage.getItem('dailyHabitTracking:' + date)).toBeNull();
  expect(JSON.parse((await AsyncStorage.getItem('lifeStyleLog:' + date))!)).toEqual(result.current.lifeStyleLog[date]);
  unmount();
  const restored = renderHook(useLifeStyleStorage);
  await waitFor(() => expect(restored.result.current.lifeStyleLog[date]?.calmActivity?.value).toBe(false));
});

it('distinguishes No from an unanswered item and can remove entries and clear the log', async () => {
  const { result } = renderHook(useLifeStyleStorage);
  await waitFor(() => expect(result.current.lifeStyleLoading).toBe(false));
  await act(async () => { await result.current.logLifeStyleEntry(date, 'dimmedLights', false); });
  expect(result.current.lifeStyleLog[date].dimmedLights?.value).toBe(false);
  expect(result.current.lifeStyleLog[date].calmActivity).toBeUndefined();
  await act(async () => { await result.current.removeLifeStyleEntry(date, 'dimmedLights'); });
  expect(result.current.lifeStyleLog[date]).toBeUndefined();
  expect(await AsyncStorage.getItem('lifeStyleLog:' + date)).toBeNull();
  await act(async () => {
    await result.current.logLifeStyleEntry(date, 'calmActivity', true);
    await result.current.clearLifeStyleLog();
  });
  expect(result.current.lifeStyleLog).toEqual({});
  expect(await AsyncStorage.getItem('lifeStyleLog:' + date)).toBeNull();
});

it('does not publish failed writes and allows retrying without losing other entries', async () => {
  const { result } = renderHook(useLifeStyleStorage);
  await waitFor(() => expect(result.current.lifeStyleLoading).toBe(false));
  const failingWrite = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Storage unavailable'));
  await act(async () => {
    await expect(result.current.logLifeStyleEntry(date, 'dimmedLights', true)).rejects.toThrow('Storage unavailable');
  });
  expect(result.current.lifeStyleLog).toEqual({});
  failingWrite.mockRestore();
  await act(async () => { await result.current.logLifeStyleEntry(date, 'dimmedLights', false); });
  expect(result.current.lifeStyleLog[date].dimmedLights?.value).toBe(false);
});
