import { tips } from '@/locales/tips';

import { getTipUserAge, matchesTipAge } from '../tipAge';

it('starts the balance tip at the 65th birthday', () => {
  const tip = tips.find(item => item.id === 'foot_balance_training')!;
  const today = new Date(2026, 9, 21);
  expect(tip.minAge).toBe(65);
  expect(matchesTipAge(tip, getTipUserAge('1961-10-22', today))).toBe(false);
  expect(matchesTipAge(tip, getTipUserAge('1961-10-21', today))).toBe(true);
  expect(matchesTipAge(tip, getTipUserAge('1950-01-01', today))).toBe(true);
});

it('does not infer age from missing or invalid profile data or filter unrestricted tips', () => {
  expect(getTipUserAge()).toBeUndefined();
  expect(getTipUserAge('invalid')).toBeUndefined();
  expect(getTipUserAge('2099-01-01')).toBeUndefined();
  expect(matchesTipAge({ minAge: 65 }, undefined)).toBe(true);
  expect(matchesTipAge({}, 30)).toBe(true);
});
