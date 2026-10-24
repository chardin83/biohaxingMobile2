import { act, renderHook } from '@testing-library/react-native';

import { useStorage } from '@/app/context/StorageContext';

import { useSaveNutritionProduct } from '../useSaveNutritionProduct';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

jest.mock('@/app/context/StorageContext', () => ({ useStorage: jest.fn() }));
jest.mock('expo-haptics', () => ({ impactAsync: async () => {}, ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('@/utils/drinkCaffeine', () => ({ hasCaffeine: () => false }));

it('saves known micronutrients at the selected portion including zero and trace values', () => {
  const addNutritionEntry = jest.fn(() => ({ id: 'entry-1' }));
  jest.mocked(useStorage).mockReturnValue({ addNutritionEntry, addDrinkEntry: jest.fn() } as any);
  const { result } = renderHook(() => useSaveNutritionProduct({ selectedDate: '2026-10-21', onFoodSaved: jest.fn() }));
  act(() =>
    result.current(
      {
        barcode: '123',
        name: 'Milk',
        nutrition: {
          caloriesPer100g: 60,
          vitaminsMgPer100g: { vitamin_c: 80, vitamin_b12: 0.0025 },
          mineralsMgPer100g: { calcium: 120, iron: 0 },
        },
      },
      250,
      'drink'
    )
  );
  expect(addNutritionEntry).toHaveBeenCalledWith(
    '2026-10-21',
    expect.objectContaining({
      type: 'drink',
      calories: 150,
      vitaminsByType: { vitamin_c: 200, vitamin_b12: 0.00625 },
      mineralsByType: { calcium: 300, iron: 0 },
    })
  );
});

it('saves catalog composition, GI and tracking before running the screen callback', () => {
  const entry = { id: 'saved-food' };
  const addNutritionEntry = jest.fn(() => entry);
  const setWeeklyNutritionTracking = jest.fn();
  const onFoodSaved = jest.fn(() => {
    expect(addNutritionEntry).toHaveBeenCalledTimes(1);
    expect(setWeeklyNutritionTracking).toHaveBeenCalledTimes(1);
  });
  jest.mocked(useStorage).mockReturnValue({
    addNutritionEntry, addDrinkEntry: jest.fn(), setWeeklyNutritionTracking,
    plans: { nutrition: [{ tipId: 'plant_diversity_30_week' }] },
  } as any);
  const { result } = renderHook(() => useSaveNutritionProduct({ selectedDate: '2026-10-20', onFoodSaved }));
  act(() => result.current({
    barcode: '', name: 'Apelsin', fromCatalog: true, plantName: 'orange', nutrition: {},
    composition: { calories: 50, carbohydrates: 12, protein: 0, fat: 0, fiber: 0, glycemicIndex: 43 },
  }, 200, 'food', new Date(2026, 9, 24, 15, 30)));
  expect(addNutritionEntry).toHaveBeenCalledWith('2026-10-20', expect.objectContaining({
    type: 'meal', name: 'Apelsin', calories: 100, carbohydrates: 24, glycemicIndex: 43,
    recordedAt: new Date(2026, 9, 20, 15, 30).toISOString(),
  }));
  expect(onFoodSaved).toHaveBeenCalledWith(entry);
});
