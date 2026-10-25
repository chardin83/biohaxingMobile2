import AsyncStorage from '@react-native-async-storage/async-storage';

import { getAppleHealthConnectionHistory, markAppleHealthConnectionCompleted } from '../storage/health/appleHealthConnectionHistory';
import { getStoredPreferredTheme, resetPreferredTheme, setPreferredTheme, subscribe } from '../themeEvents';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

it('has no app theme override by default', async () => {
  expect(await getStoredPreferredTheme()).toBeNull();
});

it('removes a saved theme and immediately tells the active app to follow the device', async () => {
  await setPreferredTheme('dark');
  expect(await getStoredPreferredTheme()).toBe('dark');
  const updateTheme = jest.fn();
  const unsubscribe = subscribe(updateTheme);
  try {
    await resetPreferredTheme();
    expect(await AsyncStorage.getItem('preferredTheme')).toBeNull();
    expect(await getStoredPreferredTheme()).toBeNull();
    expect(updateTheme).toHaveBeenCalledWith('device');
  } finally { unsubscribe(); }
});

it('preserves Apple Health setup history when resetting the theme', async () => {
  await markAppleHealthConnectionCompleted();
  await setPreferredTheme('dark');
  await resetPreferredTheme();
  expect(await getAppleHealthConnectionHistory()).toBe(true);
});

it('reports storage failures instead of announcing a reset that was not saved', async () => {
  const updateTheme = jest.fn();
  const unsubscribe = subscribe(updateTheme);
  jest.mocked(AsyncStorage.removeItem).mockRejectedValueOnce(new Error('storage'));
  try {
    await expect(resetPreferredTheme()).rejects.toThrow('storage');
    expect(updateTheme).not.toHaveBeenCalled();
  } finally { unsubscribe(); }
});
