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
