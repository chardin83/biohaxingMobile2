import { removeDrinkEntryFromTracking, removeDrinksForNutritionEntry, updateDrinkEntryInTracking,updateDrinkTimesForNutritionEntry } from '@/app/context/storage/drinks/drinkStorage';
import type { DrinkEntry } from '@/app/context/storage/drinks/drinkTypes';
import { syncCaffeineLifeStyle } from '@/app/context/storage/lifeStyle/caffeineLifeStyle';

const date = '2026-10-16';
function coffeeAt(hours: number, minutes = 0): DrinkEntry {
  return { id: `${hours}:${minutes}`, type: 'coffee', name: 'Coffee', source: 'manual', recordedAt: new Date(2026, 9, 16, hours, minutes).toISOString() };
}

it('adds and removes the bedtime tag when a linked meal time is edited', () => {
  const coffee = { ...coffeeAt(8), nutritionEntryId: 'coffee-meal' };
  const water: DrinkEntry = { ...coffeeAt(12), type: 'water', nutritionEntryId: 'other-meal' };
  const drinks = { [date]: [coffee, water] };
  const morningLog = syncCaffeineLifeStyle({}, drinks, '22:00');
  expect(morningLog[date].caffeineBeforeSleep).toBeUndefined();
  const eveningDrinks = updateDrinkTimesForNutritionEntry(drinks, date, 'coffee-meal', coffeeAt(20).recordedAt);
  expect(eveningDrinks[date][1]).toBe(water);
  const eveningLog = syncCaffeineLifeStyle(morningLog, eveningDrinks, '22:00');
  expect(eveningLog[date].caffeineBeforeSleep?.value).toBe(true);
  const restored = updateDrinkTimesForNutritionEntry(eveningDrinks, date, 'coffee-meal', coffeeAt(8).recordedAt);
  expect(syncCaffeineLifeStyle(eveningLog, restored, '22:00')[date].caffeineBeforeSleep).toBeUndefined();
});

it('adds the bedtime tag when editing the drink time directly', () => {
  const coffee = coffeeAt(8);
  const drinks = { [date]: [coffee] };
  const log = syncCaffeineLifeStyle({}, drinks, '22:00');
  const edited = updateDrinkEntryInTracking(drinks, date, coffee.id, { recordedAt: coffeeAt(20).recordedAt });
  expect(syncCaffeineLifeStyle(log, edited, '22:00')[date].caffeineBeforeSleep?.value).toBe(true);
});

it('removes automatic tags when the linked nutrition entry or the drink itself is deleted', () => {
  const drinks = { [date]: [{ ...coffeeAt(18), nutritionEntryId: 'meal-coffee' }] };
  const log = syncCaffeineLifeStyle({}, drinks, '22:00');
  expect(log[date].caffeineBeforeSleep?.value).toBe(true);
  const withoutMeal = removeDrinksForNutritionEntry(drinks, date, 'meal-coffee');
  expect(withoutMeal).toEqual({});
  expect(syncCaffeineLifeStyle(log, withoutMeal, '22:00')).toEqual({});
  const withoutDrink = removeDrinkEntryFromTracking(drinks, date, drinks[date][0].id);
  expect(syncCaffeineLifeStyle(log, withoutDrink, '22:00')).toEqual({});
});

it('keeps the coffee tag while another coffee remains and preserves unrelated drinks', () => {
  const morning = { ...coffeeAt(8), nutritionEntryId: 'morning' };
  const evening = { ...coffeeAt(18), nutritionEntryId: 'evening' };
  const water: DrinkEntry = { ...coffeeAt(12), type: 'water' };
  const drinks = { [date]: [morning, evening, water] };
  const log = syncCaffeineLifeStyle({}, drinks, '22:00');
  const remaining = removeDrinksForNutritionEntry(drinks, date, 'evening');
  expect(remaining[date]).toEqual([morning, water]);
  const updated = syncCaffeineLifeStyle(log, remaining, '22:00');
  expect(updated[date].caffeine?.value).toBe(true);
  expect(updated[date].caffeineBeforeSleep).toBeUndefined();
});

it('uses the same default 23:00 bedtime as the person card when no override is saved', () => {
  const log = syncCaffeineLifeStyle({}, { [date]: [coffeeAt(20, 51)] });
  expect(log[date].caffeine).toMatchObject({ value: true, source: 'journal' });
  expect(log[date].caffeineBeforeSleep?.value).toBe(true);
});

it('tags coffee at 20:51 before a saved 23:00 bedtime', () => {
  const log = syncCaffeineLifeStyle({}, { [date]: [coffeeAt(20, 51)] }, '23:00');
  expect(log[date].caffeineBeforeSleep?.value).toBe(true);
});

it.each([[14, 0, false], [14, 1, true], [16, 0, true], [21, 59, true], [8, 0, false]] as const)(
  'evaluates coffee at %s:%s against a 22:00 bedtime', (hours, minutes, close) => {
    const log = syncCaffeineLifeStyle({}, { [date]: [coffeeAt(hours, minutes)] }, '22:00');
    expect(log[date].caffeine?.value).toBe(true);
    expect(Boolean(log[date].caffeineBeforeSleep?.value)).toBe(close);
  }
);

it('uses the next planned bedtime across midnight', () => {
  const log = syncCaffeineLifeStyle({}, { [date]: [coffeeAt(23)] }, '02:00');
  expect(log[date].caffeineBeforeSleep?.value).toBe(true);
});

it('recalculates tags when entries or bedtime change and preserves manual answers', () => {
  const drinks = { [date]: [coffeeAt(18)] };
  const log = syncCaffeineLifeStyle({}, drinks, '22:00');
  expect(syncCaffeineLifeStyle(log, drinks, '22:00')).toBe(log);
  const changed = syncCaffeineLifeStyle(log, { [date]: [coffeeAt(8)] }, '22:00');
  expect(changed[date].caffeine?.value).toBe(true);
  expect(changed[date].caffeineBeforeSleep).toBeUndefined();
  expect(syncCaffeineLifeStyle(log, drinks, '03:00')[date].caffeineBeforeSleep).toBeUndefined();
  expect(syncCaffeineLifeStyle(log, {}, '22:00')).toEqual({});
  const manual = { [date]: { caffeine: { value: false, recordedAt: coffeeAt(8).recordedAt } } };
  expect(syncCaffeineLifeStyle(manual, {}, '22:00')).toBe(manual);
  expect(syncCaffeineLifeStyle({}, { [date]: [{ ...coffeeAt(18), type: 'water' }] }, '22:00')).toEqual({});
});

it.each(['coffee', 'tea', 'energy_drink'] as const)('logs caffeine from %s', type => {
  const log = syncCaffeineLifeStyle({}, { [date]: [{ ...coffeeAt(20), type }] }, '23:00');
  expect(log[date].caffeine?.value).toBe(true);
  expect(log[date].caffeineBeforeSleep?.value).toBe(true);
});

it('honors explicit caffeine information, including decaffeinated drinks', () => {
  expect(syncCaffeineLifeStyle({}, { [date]: [{ ...coffeeAt(20), caffeinated: false }] }, '23:00')).toEqual({});
  const log = syncCaffeineLifeStyle({}, { [date]: [{ ...coffeeAt(20), type: 'soft_drink', caffeinated: true }] }, '23:00');
  expect(log[date].caffeineBeforeSleep?.value).toBe(true);
});
