import AsyncStorage from '@react-native-async-storage/async-storage';

import { claimCoachQuestion, getCoachQuestionUsage, getCoachWeek, getNextCoachReset } from '../weeklyQuestions';

jest.mock('@/constants/Premium', () => ({
  ...jest.requireActual('@/constants/Premium'),
  PREMIUM: false,
}));

beforeEach(async () => {
  jest.requireMock('@/constants/Premium').PREMIUM = false;
  await AsyncStorage.clear();
});

it('persists each follow-up and refuses a fourth question, including simultaneous sends', async () => {
  const date = new Date(2026, 9, 9, 12);
  const results = await Promise.all(Array.from({ length: 4 }, () => claimCoachQuestion(date)));
  expect(results.map(result => result.allowed)).toEqual([true, true, true, false]);
  expect(await getCoachQuestionUsage(date)).toEqual({ week: '2026-10-05', used: 3 });
});

it('refills questions on Monday and preserves them across the weekend', async () => {
  await claimCoachQuestion(new Date(2026, 9, 11, 23, 59));
  expect((await getCoachQuestionUsage(new Date(2026, 9, 11, 23, 59))).used).toBe(1);
  expect((await getCoachQuestionUsage(new Date(2026, 9, 12, 0, 0))).used).toBe(0);
  const monday = await claimCoachQuestion(new Date(2026, 9, 12, 0, 0));
  expect(monday.usage).toEqual({ week: '2026-10-12', used: 1 });
});

it('uses local Monday boundaries for the next reset', () => {
  const sunday = new Date(2026, 9, 11, 23, 59);
  expect(getCoachWeek(sunday)).toBe('2026-10-05');
  expect(getNextCoachReset(sunday)).toEqual(new Date(2026, 9, 12));
  expect(getNextCoachReset(new Date(2026, 9, 12))).toEqual(new Date(2026, 9, 19));
});

it('allows Premium chat after the free quota is exhausted without spending free questions', async () => {
  const date = new Date(2026, 9, 9, 12);
  for (let index = 0; index < 3; index++) await claimCoachQuestion(date);
  jest.requireMock('@/constants/Premium').PREMIUM = true;
  for (let index = 0; index < 5; index++) {
    expect((await claimCoachQuestion(date)).allowed).toBe(true);
  }
  expect((await getCoachQuestionUsage(date)).used).toBe(3);
  jest.requireMock('@/constants/Premium').PREMIUM = false;
  expect((await claimCoachQuestion(date)).allowed).toBe(false);
});
