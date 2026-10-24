import { DRINK_TYPES, getDrinkNutritionData, getDrinkProduct } from '@/locales/drinkCatalog';
import { hasCaffeine } from '../drinkCaffeine';
import { getGlycemicIndexSummary } from '../glycemicIndex';

it.each(['soft_drink', 'juice', 'milk'] as const)('preserves the %s GI reference when changing drink volume', type => {
  const small = getDrinkNutritionData(type, type, 100);
  const large = getDrinkNutritionData(type, type, 300);
  const product = getDrinkProduct(type, type);
  expect(small.glycemicIndex).toBeGreaterThan(0);
  expect(large.glycemicIndex).toBe(small.glycemicIndex);
  expect(large.carbohydrates).toBeCloseTo(small.carbohydrates * 3, 1);
  expect(product.nutrition.glycemicIndex).toBe(small.glycemicIndex);
  expect(product.nutrition.glycemicIndexIsEstimate).toBe(true);
  expect(large.glycemicIndexIsEstimate).toBe(true);
});

it.each(['sugar_free_soft_drink', 'sugar_free_energy_drink'] as const)('makes %s selectable without inventing a numeric GI', type => {
  expect(DRINK_TYPES).toContain(type);
  const drink = getDrinkNutritionData(type, type, 330);
  expect(drink.carbohydrates).toBe(0);
  expect(drink.glycemicIndex).toBeUndefined();
  const known = getDrinkNutritionData('soft_drink', 'Soda', 100);
  expect(getGlycemicIndexSummary([known, drink])).toEqual(getGlycemicIndexSummary([known]));
});

it('preserves caffeine and low energy in sugar-free energy drinks', () => {
  const drink = getDrinkNutritionData('sugar_free_energy_drink', 'Sugar-free energy drink', 250);
  expect(drink).toMatchObject({ calories: 8, caffeineMg: 80, carbohydrates: 0 });
  expect(hasCaffeine({ type: 'sugar_free_energy_drink' })).toBe(true);
  expect(getDrinkProduct('sugar_free_energy_drink', 'Sugar-free').caffeinated).toBe(true);
});
