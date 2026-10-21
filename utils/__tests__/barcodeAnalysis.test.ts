import { buildBarcodeEnrichmentInput } from '../barcodeAnalysis';

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
    knownNutritionPer100: { calories: 0, protein: 0, caffeineMg: 20 },
  });
  expect(result.knownNutritionPer100.fiber).toBeUndefined();
});
