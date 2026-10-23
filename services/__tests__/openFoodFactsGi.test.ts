import { getProductByBarcode } from '../openFoodFacts';
jest.mock('../gptServices', () => ({}));
jest.mock('../../config', () => ({ OPEN_FOOD_FACTS_BASE_URL: 'https://example.test/product' }));

it.each([45, 0, undefined, -1])('imports valid barcode GI and leaves missing or invalid GI unknown: %s', async gi => {
  const mock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200,
    json: async () => ({ product: { code: 'gi-test', product_name: 'Food', nutriments: { 'glycemic-index_100g': gi } } }),
  } as Response);
  try {
    expect((await getProductByBarcode(`gi-test-${gi}`))?.nutrition.glycemicIndex).toBe(gi === undefined || gi < 0 ? undefined : gi);
  } finally { mock.mockRestore(); }
});
