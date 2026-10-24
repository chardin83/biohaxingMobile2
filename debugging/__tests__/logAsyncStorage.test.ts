import AsyncStorage from '@react-native-async-storage/async-storage';
import { logAsyncStorage } from '../logAsyncStorage';

const options = { include: ['nutritionXpClaims', 'dailyHabitTracking'], exclude: [], keysOnly: false, date: '2026-10-24' };
let log: jest.SpyInstance;
beforeEach(async () => {
  await AsyncStorage.clear();
  log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  await AsyncStorage.setItem('nutritionXpClaims', JSON.stringify({
    'gi|daily|2026-10-24': { tipId: 'gi', period: 'daily', periodKey: '2026-10-24', targets: [{ isMet: true }] },
    'old|daily|2026-10-23': { tipId: 'old', period: 'daily', periodKey: '2026-10-23' },
    'weekly|weekly|2026-10-19': { tipId: 'weekly', period: 'weekly', periodKey: '2026-10-19' },
  }));
  await AsyncStorage.setItem('dailyHabitTracking:2026-10-24', JSON.stringify({ glycemic_index_review: { isFulfilled: true } }));
  await AsyncStorage.setItem('dailyHabitTracking:2026-10-23', '{}');
});
afterEach(() => log.mockRestore());

it('prints the global claims key with saved daily goals and current-week goals', async () => {
  await logAsyncStorage(options);
  const output = log.mock.calls.map(call => call.join(' ')).join('\n');
  expect(output).toContain('[AsyncStorage] nutritionXpClaims');
  expect(output).toContain('gi|daily|2026-10-24');
  expect(output).toContain('"isMet": true');
  expect(output).toContain('weekly|weekly|2026-10-19');
  expect(output).not.toContain('old|daily|2026-10-23');
  expect(output).toContain('dailyHabitTracking:2026-10-24');
  expect(output).not.toContain('dailyHabitTracking:2026-10-23');
});

it('prints all saved claims when the date filter is disabled', async () => {
  await logAsyncStorage({ ...options, date: null });
  expect(log.mock.calls.map(call => call.join(' ')).join('\n')).toContain('old|daily|2026-10-23');
});

it('respects exclusions and keys-only logging', async () => {
  await logAsyncStorage({ ...options, keysOnly: true });
  expect(log).toHaveBeenCalledWith('[AsyncStorage] Nycklar:', 'dailyHabitTracking:2026-10-24, nutritionXpClaims');
  log.mockClear();
  await logAsyncStorage({ ...options, exclude: ['nutritionXpClaims'] });
  expect(log.mock.calls.map(call => call.join(' ')).join('\n')).not.toContain('nutritionXpClaims');
});
