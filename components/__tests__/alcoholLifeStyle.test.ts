import type { DrinkEntry } from '@/app/context/storage/drinks/drinkTypes';
import { syncAlcoholLifeStyle } from '@/app/context/storage/lifeStyle/alcoholLifeStyle';

const date = '2026-10-16';
const drinkAt = (hours: number, minutes = 0, type: DrinkEntry['type'] = 'red_wine'): DrinkEntry => ({
  id: 'wine', type, name: 'Wine', source: 'manual',
  recordedAt: new Date(2026, 9, 16, hours, minutes).toISOString(),
});

it.each(['red_wine', 'white_wine', 'beer', 'spirits', 'oak_aged_spirits'] as const)('automatically tags %s', type => {
  expect(syncAlcoholLifeStyle({}, { [date]: [drinkAt(20, 0, type)] }, '23:00')[date]).toMatchObject({
    alcohol: { value: true, source: 'journal' }, alcoholBeforeSleep: { value: true, source: 'journal' },
  });
});
it.each([[18, 59, false], [19, 0, false], [19, 1, true], [22, 59, true]] as const)('uses a four hour window at %s:%s', (hours, minutes, expected) => {
  const day = syncAlcoholLifeStyle({}, { [date]: [drinkAt(hours, minutes)] }, '23:00')[date];
  expect(day.alcohol?.value).toBe(true);
  expect(Boolean(day.alcoholBeforeSleep)).toBe(expected);
});
it('recalculates after edits and removes automatic tags when the last drink is removed', () => {
  const log = syncAlcoholLifeStyle({}, { [date]: [drinkAt(21)] });
  const edited = syncAlcoholLifeStyle(log, { [date]: [drinkAt(12)] });
  expect(edited[date].alcohol?.value).toBe(true);
  expect(edited[date].alcoholBeforeSleep).toBeUndefined();
  expect(syncAlcoholLifeStyle(edited, {})).toEqual({});
});
it('handles bedtime after midnight and preserves manual entries', () => {
  const log = syncAlcoholLifeStyle({}, { [date]: [drinkAt(23)] }, '02:00');
  expect(log[date].alcoholBeforeSleep?.value).toBe(true);
  expect(syncAlcoholLifeStyle(log, { [date]: [drinkAt(23)] }, '02:00')).toBe(log);
  const manual = { [date]: { alcohol: { value: false, recordedAt: drinkAt(12).recordedAt } } };
  expect(syncAlcoholLifeStyle(manual, {})).toBe(manual);
});
it('does not tag non-alcoholic drink types', () => {
  expect(syncAlcoholLifeStyle({}, { [date]: [drinkAt(21, 0, 'coffee'), drinkAt(21, 0, 'water'), drinkAt(21, 0, 'drink')] })).toEqual({});
});
