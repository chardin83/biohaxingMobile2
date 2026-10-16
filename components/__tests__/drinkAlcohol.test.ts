import { syncAlcoholLifeStyle } from '@/app/context/storage/lifeStyle/alcoholLifeStyle';
import { getDrinkProduct } from '@/locales/drinkCatalog';
import { getAlcoholPercent, withAlcoholPercent } from '@/utils/drinkAlcohol';

it.each([['red_wine', 12.5], ['white_wine', 12], ['beer', 5], ['spirits', 40]] as const)('defaults %s to %s percent', (type, percent) => {
  expect(getAlcoholPercent(getDrinkProduct(type, type))).toBe(percent);
});
it('updates alcohol and energy without changing other nutrients or the original product', () => {
  const wine = getDrinkProduct('white_wine', 'Wine');
  const updated = withAlcoholPercent(wine, 15);
  expect(updated.alcoholPercent).toBe(15);
  expect(updated.nutrition.alcoholGramsPer100g).toBeCloseTo(11.835);
  expect(updated.nutrition.caloriesPer100g).toBeCloseTo(82 + 3 * 0.789 * 7);
  expect(updated.nutrition.carbohydratesPer100g).toBe(wine.nutrition.carbohydratesPer100g);
  expect(wine.alcoholPercent).toBe(12);
  expect(getAlcoholPercent(getDrinkProduct('water', 'Water'))).toBeUndefined();
});
it('does not tag alcohol-free wine', () => {
  expect(syncAlcoholLifeStyle({}, { '2026-10-16': [{ id: 'wine', name: 'Wine', type: 'red_wine', alcoholPercent: 0, recordedAt: '2026-10-16T20:00:00Z', source: 'manual' }] })).toEqual({});
});
