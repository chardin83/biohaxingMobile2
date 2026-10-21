import { buildBarcodeEnrichmentInput, getAiEstimatedBarcodeNutrients } from '../barcodeAnalysis';

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
