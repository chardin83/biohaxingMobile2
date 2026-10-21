import { getProductByBarcode } from '../openFoodFacts';

jest.mock('../gptServices', () => ({}));
jest.mock('../../config', () => ({ OPEN_FOOD_FACTS_BASE_URL: 'https://example.test/product' }));

it('imports the actual API nutrient shape, not the contributor input units', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      product: {
        code: 'micro-test-1',
        product_name: 'Vitamin drink',
        nutriments: { 'vitamin-c_100g': 0.08, 'vitamin-c_unit': 'mg', 'vitamin-c_value': 80, 'calcium_100g': 0.12, 'iron_100g': 0 },
      },
    }),
  } as Response);
  try {
    const result = await getProductByBarcode('micro-test-1');
    expect(result?.nutrition.vitaminsMgPer100g).toEqual({ vitamin_c: 80 });
    expect(result?.nutrition.mineralsMgPer100g).toEqual({ calcium: 120, iron: 0 });
  } finally {
    fetchMock.mockRestore();
  }
});
