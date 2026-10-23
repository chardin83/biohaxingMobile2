import { USDA_FOOD_NUTRIENT_PROFILES, USDA_FOOD_SOURCES } from '@/types/nutrition/foodCatalog';
import { FOOD_SUPPLEMENTARY_PROFILES } from '@/types/nutrition/foodCatalogSupplementary';
import { FOOD_NUTRIENT_PROFILES } from '@/types/nutrition/foodProfiles';
import { getFoodProduct } from '@/utils/foodProduct';

it('keeps complementary estimates and app metadata outside USDA records', () => {
  const allowed = new Set(['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'vitaminsByType', 'mineralsByType', 'aminoAcidsByType', 'fiberByType', 'caffeineMg', 'alcoholGrams']);
  for (const record of Object.values(USDA_FOOD_NUTRIENT_PROFILES)) {
    expect(Object.keys(record).every(key => allowed.has(key))).toBe(true);
  }
  expect(FOOD_SUPPLEMENTARY_PROFILES.garlic.fiberSubtypeTotals?.inulin_type_fructans).toBe(12.5);
  expect(USDA_FOOD_NUTRIENT_PROFILES.garlic).not.toHaveProperty('fiberSubtypeTotals');
  expect(USDA_FOOD_SOURCES.broccoli.ndbNumber).toBe(11090);
  expect(FOOD_SUPPLEMENTARY_PROFILES.broccoli).toBeDefined();
});
it('retains USDA nutrients and supplementary values when creating a catalog product', () => {
  const garlic = getFoodProduct('garlic', 'Garlic');
  expect(garlic.composition?.calories).toBe(USDA_FOOD_NUTRIENT_PROFILES.garlic.calories);
  expect(garlic.composition?.vitaminsByType).toEqual(USDA_FOOD_NUTRIENT_PROFILES.garlic.vitaminsByType);
  expect(garlic.composition?.fiberSubtypeTotals).toEqual(FOOD_SUPPLEMENTARY_PROFILES.garlic.fiberSubtypeTotals);
  expect(garlic.composition).not.toHaveProperty('sulfurRichVegetable');
  expect(garlic.servings).toEqual(FOOD_NUTRIENT_PROFILES.garlic.defaultServings);
});

it('uses imported USDA values and correct units for kale and chard', () => {
  expect(USDA_FOOD_SOURCES.kale.ndbNumber).toBe(11233);
  expect(USDA_FOOD_SOURCES.chard.ndbNumber).toBe(11147);
  expect(USDA_FOOD_NUTRIENT_PROFILES.kale.vitaminsByType.vitamin_c).toBe(93.4);
  expect(USDA_FOOD_NUTRIENT_PROFILES.chard.vitaminsByType.vitamin_c).toBe(30);
  expect(USDA_FOOD_NUTRIENT_PROFILES.chard.vitaminsByType.vitamin_k).toBe(0.83);
  expect(FOOD_NUTRIENT_PROFILES.kale.vitaminsByType?.vitamin_b7).toBe(FOOD_SUPPLEMENTARY_PROFILES.kale.vitaminsByType.vitamin_b7);
  expect(FOOD_NUTRIENT_PROFILES.kale.aminoAcidsByType?.glutamine).toBe(330);
});
it('keeps supplementary nutrients only where the matched USDA record has no value', () => {
  for (const [key, source] of Object.entries(USDA_FOOD_NUTRIENT_PROFILES)) {
    const extra = FOOD_SUPPLEMENTARY_PROFILES[key as keyof typeof FOOD_SUPPLEMENTARY_PROFILES] as Record<string, unknown>;
    for (const [field, amount] of Object.entries(source)) {
      if (typeof amount === 'object') {
        const remaining = (extra[field] ?? {}) as Record<string, unknown>;
        for (const nutrient of Object.keys(amount)) expect(remaining).not.toHaveProperty(nutrient);
      } else {
        expect(extra).not.toHaveProperty(field);
      }
    }
  }
});
it('deep-merges sourced nutrients while retaining the unverified missing groups', () => {
  expect(FOOD_NUTRIENT_PROFILES.kale.vitaminsByType).toMatchObject(USDA_FOOD_NUTRIENT_PROFILES.kale.vitaminsByType);
  expect(FOOD_NUTRIENT_PROFILES.kale.fiberByType?.fiber_total).toBe(4.1);
  expect(FOOD_NUTRIENT_PROFILES.kale.fiberByType?.fiber_fermentable).toBe(0.9);
  expect(USDA_FOOD_NUTRIENT_PROFILES.blackCurrants).not.toHaveProperty('fiber');
  expect(FOOD_NUTRIENT_PROFILES.blackCurrants.fiber).toBe(FOOD_SUPPLEMENTARY_PROFILES.blackCurrants.fiber);
});

it('makes cooked cooled pasta available as a catalog food with servings and its image', () => {
  const pasta = getFoodProduct('cookedCooledPasta', 'Cooked and cooled pasta');
  expect(FOOD_SUPPLEMENTARY_PROFILES.cookedCooledPasta).toBeDefined();
  expect(pasta.fromCatalog).toBe(true);
  expect(pasta.productType).toBe('food');
  expect(pasta.quantityValue).toBe(100);
  expect(pasta.quantityUnit).toBe('g');
  expect(pasta.servings?.map(serving => serving.grams)).toEqual([50, 100, 200]);
  expect(pasta.image).toBeTruthy();
  expect(pasta.composition?.calories).toBeGreaterThan(0);
  expect(pasta.composition?.fiberSubtypeTotals?.resistant_starch).toBe(1);
});

it('uses a boiled-potato baseline for cooled potatoes with an estimated chilled resistant-starch amount', () => {
  const potato = getFoodProduct('cookedCooledPotato', 'Cooked and cooled potato');
  expect(potato.composition).toMatchObject({
    calories: 87,
    protein: 1.9,
    carbohydrates: 20.1,
    fat: 0.1,
    fiber: 1.8,
    mineralsByType: { potassium: 379, magnesium: 22 },
  });
  expect(potato.composition?.fiberByType).toEqual({ fiber_total: 1.8, fiber_fermentable: 1.3 });
  expect(potato.composition?.fiberSubtypeTotals?.resistant_starch).toBe(1.3);
  expect(potato.image).toBeTruthy();
});

it('keeps jasmine and basmati as separate cooked baselines with a shared image', () => {
  const jasmine = getFoodProduct('cookedCooledJasmineRice', 'Jasmine');
  const basmati = getFoodProduct('cookedCooledBasmatiRice', 'Basmati');
  expect(jasmine.composition).toMatchObject({ calories: 115, protein: 2.4, carbohydrates: 25.7, fat: 0.2, fiber: 0 });
  expect(basmati.composition).toMatchObject({ calories: 115, protein: 3, carbohydrates: 25, fat: 0.3, fiber: 0.2 });
  expect(jasmine.image).toBeTruthy();
  expect(jasmine.image).toBe(basmati.image);
  for (const rice of [jasmine, basmati]) {
    expect(rice.fromCatalog).toBe(true);
    expect(rice.quantityValue).toBe(100);
    expect(rice.servings?.map(serving => serving.grams)).toEqual([50, 100, 200]);
    expect(rice.composition?.fiberSubtypeTotals?.resistant_starch).toBeGreaterThan(0);
  }
});

 it.each([['greenBanana', 2.8], ['cookedCooledPasta', 1], ['cookedCooledPotato', 1.3], ['cookedCooledJasmineRice', 0.74], ['cookedCooledBasmatiRice', 0.9]] as const)('preserves resistant starch for %s through catalog product creation', (key, amount) => {
  const product = getFoodProduct(key, key);
  expect(product.composition?.fiberSubtypeTotals?.resistant_starch).toBe(amount);
  expect(product.composition?.fiberByType?.fiber_fermentable).toBeGreaterThanOrEqual(amount);
});
