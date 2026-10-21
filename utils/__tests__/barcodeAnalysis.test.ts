import { buildBarcodeEnrichmentInput, getAiEstimatedBarcodeNutrients, getAiEstimatedBarcodeMicronutrients } from '../barcodeAnalysis';

test('sends declared zero values, leaves missing nutrients absent, and uses ml for drinks', () => {
  const result = buildBarcodeEnrichmentInput({
    product: {
      barcode: '1234567890123',
      name: 'Dryck',
      brand: 'Test',
      ingredientsText: 'Vatten, te',
      nutrition: { caloriesPer100g: 0, proteinPer100g: 0, caffeineMgPer100g: 20 },
    },
    amount: 250,
    productType: 'drink',
  });
  expect(result).toEqual({
    barcode: '1234567890123',
    name: 'Dryck',
    brand: 'Test',
    ingredientsText: 'Vatten, te',
    amount: 250,
    unit: 'ml',
    productType: 'drink',
    knownNutritionPer100: { calories: 0, protein: 0, caffeineMg: 20 },
  });
  expect(result.knownNutritionPer100.fiber).toBeUndefined();
});

const redBullContext = {
  product: {
    barcode: '90162602',
    name: 'Red Bull',
    nutrition: { caloriesPer100g: 463, energyKjPer100g: 194, carbohydratesPer100g: 11, proteinPer100g: 0, fatPer100g: 0, caffeineMgPer100g: 32 },
  },
  amount: 250,
  productType: 'drink' as const,
};

test('lets AI recalculate conflicting energy while preserving other label values', () => {
  const result = buildBarcodeEnrichmentInput(redBullContext);
  expect(result.knownNutritionPer100).toEqual({ calories: 463, carbohydrates: 11, protein: 0, fat: 0, caffeineMg: 32 });
  expect(result.energyReview).toEqual({ kcalPer100: 463, kjPer100: 194 });
  expect(result.amount).toBe(250);
});

test('locks manual calorie corrections rather than letting AI replace them', () => {
  const product = { ...redBullContext.product, nutrition: { ...redBullContext.product.nutrition, caloriesPer100g: 46, energyKjPer100g: 46 * 4.184 } };
  const result = buildBarcodeEnrichmentInput({ ...redBullContext, product });
  expect(result.knownNutritionPer100.calories).toBe(46);
  expect(result.energyReview).toBeUndefined();
});

test('keeps consistent source energy authoritative', () => {
  const product = { ...redBullContext.product, nutrition: { ...redBullContext.product.nutrition, caloriesPer100g: 46 } };
  const result = buildBarcodeEnrichmentInput({ ...redBullContext, product });
  expect(result.knownNutritionPer100.calories).toBe(46);
  expect(result.energyReview).toBeUndefined();
});

test('marks recalculated energy and missing caffeine or alcohol, but not known label values', () => {
  const context = {
    ...redBullContext,
    product: {
      ...redBullContext.product,
      nutrition: { caloriesPer100g: 463, energyKjPer100g: 194, proteinPer100g: 0, carbohydratesPer100g: 11, fatPer100g: 0, fiberPer100g: 0 },
    },
  };
  const analysis = { name: 'Red Bull', calories: 115, protein: 0, carbohydrates: 27.5, fat: 0, fiber: 0, caffeineMg: 80, alcoholGrams: 0 };
  expect(getAiEstimatedBarcodeNutrients(context, analysis)).toEqual(['calories', 'caffeineMg', 'alcoholGrams']);
  const manuallyCorrected = {
    ...context,
    product: { ...context.product, nutrition: { ...context.product.nutrition, caloriesPer100g: 46, energyKjPer100g: 46 * 4.184 } },
  };
  expect(getAiEstimatedBarcodeNutrients(manuallyCorrected, analysis)).toEqual(['caffeineMg', 'alcoholGrams']);
});

test('sends known vitamin and mineral values including zero and keeps absent types unknown', () => {
  const product = {
    ...redBullContext.product,
    nutrition: { ...redBullContext.product.nutrition, vitaminsMgPer100g: { vitamin_c: 80, vitamin_b12: 0.0025 }, mineralsMgPer100g: { calcium: 120, iron: 0 } },
  };
  const result = buildBarcodeEnrichmentInput({ ...redBullContext, product });
  expect(result.knownVitaminsMgPer100).toEqual({ vitamin_c: 80, vitamin_b12: 0.0025 });
  expect(result.knownMineralsMgPer100).toEqual({ calcium: 120, iron: 0 });
  expect(result.knownVitaminsMgPer100?.vitamin_d).toBeUndefined();
});

test('tracks only reported AI micronutrients missing in the original product, preserving known zero', () => {
  const context = {
    ...redBullContext,
    product: {
      ...redBullContext.product,
      nutrition: { ...redBullContext.product.nutrition, vitaminsMgPer100g: { vitamin_c: 80 }, mineralsMgPer100g: { calcium: 120, iron: 0 } },
    },
  };
  expect(
    getAiEstimatedBarcodeMicronutrients(context, {
      vitamins: { vitamin_c: 200, vitamin_d: 0.01, vitamin_b12: 0 },
      minerals: { calcium: 300, iron: 0, zinc: 2, totalMg: 302 },
    })
  ).toEqual({ aiEstimatedVitamins: ['vitamin_d', 'vitamin_b12'], aiEstimatedMinerals: ['zinc'] });
  expect(getAiEstimatedBarcodeMicronutrients(context)).toEqual({ aiEstimatedVitamins: [], aiEstimatedMinerals: [] });
});
