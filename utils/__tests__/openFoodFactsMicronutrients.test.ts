import { getOpenFoodFactsMicronutrients, scaleBarcodeMicronutrients } from '../openFoodFactsMicronutrients';

it('maps micronutrients from normalized grams to mg, including trace amounts and declared zero', () => {
  const result = getOpenFoodFactsMicronutrients({
    'vitamin-c_100g': 0.08,
    'vitamin-b12_100g': 0.0000025,
    'calcium_100g': 0.12,
    'selenium_100g': 0.000055,
    'iron_100g': 0,
  });
  expect(result.vitaminsMgPer100g?.vitamin_c).toBe(80);
  expect(result.vitaminsMgPer100g?.vitamin_b12).toBe(0.0025);
  expect(result.mineralsMgPer100g).toEqual({ calcium: 120, selenium: 0.055, iron: 0 });
  expect(result.mineralsMgPer100g?.magnesium).toBeUndefined();
  const scaled = scaleBarcodeMicronutrients(result, 2.5);
  expect(scaled.vitaminsByType?.vitamin_c).toBe(200);
  expect(scaled.vitaminsByType?.vitamin_b12).toBe(0.00625);
  expect(scaled.mineralsByType?.iron).toBe(0);
});

it('supports OFF vitamin aliases and ignores invalid values without inventing nutrients', () => {
  expect(
    getOpenFoodFactsMicronutrients({
      'vitamin-pp_100g': 0.008,
      'pantothenic-acid_100g': 0.002,
      'biotin_100g': 0.00005,
      'folates_100g': 0.0001,
      'calcium_100g': -1,
      'iron_100g': NaN,
      'zinc_100g': '2',
    })
  ).toEqual({
    vitaminsMgPer100g: { vitamin_b3: 8, vitamin_b5: 2, vitamin_b7: 0.05, vitamin_b9: 0.1 },
    mineralsMgPer100g: undefined,
  });
  expect(getOpenFoodFactsMicronutrients({})).toEqual({ vitaminsMgPer100g: undefined, mineralsMgPer100g: undefined });
});
