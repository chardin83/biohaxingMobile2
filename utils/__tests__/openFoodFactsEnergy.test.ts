import { getOpenFoodFactsCalories, hasEnergyConflict } from '../openFoodFactsEnergy';

it('preserves supplied kcal and reports the Red Bull conflict', () => {
  expect(getOpenFoodFactsCalories({ 'energy-kcal_100g': 463, 'energy-kj_100g': 194, 'energy_100g': 194 })).toBe(463);
  expect(hasEnergyConflict(463, 194)).toBe(true);
  expect(hasEnergyConflict(46, 194)).toBe(false);
  expect(hasEnergyConflict(undefined, 194)).toBe(false);
});

it('keeps consistent kcal values and allows label rounding', () => {
  expect(getOpenFoodFactsCalories({ 'energy-kcal_100g': 46, 'energy_100g': 194 })).toBe(46);
});

it('converts kJ when kcal is absent and supports kcal-only products', () => {
  expect(getOpenFoodFactsCalories({ 'energy-kj_100g': 418.4 })).toBeCloseTo(100);
  expect(getOpenFoodFactsCalories({ 'energy-kcal_100g': 123 })).toBe(123);
});

it('preserves zero and leaves missing energy unknown', () => {
  expect(getOpenFoodFactsCalories({ 'energy-kcal_100g': 0, 'energy_100g': 0 })).toBe(0);
  expect(getOpenFoodFactsCalories({})).toBeUndefined();
});
