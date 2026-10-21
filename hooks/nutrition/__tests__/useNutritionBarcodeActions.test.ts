import { act, renderHook } from '@testing-library/react-native';

import { useStorage } from '@/app/context/StorageContext';

import { useNutritionBarcodeActions } from '../useNutritionBarcodeActions';

jest.mock('@/app/context/StorageContext', () => ({ useStorage: jest.fn() }));
jest.mock('expo-haptics', () => ({ impactAsync: async () => {}, ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('@/utils/drinkCaffeine', () => ({ hasCaffeine: () => false }));

it('saves known micronutrients at the selected portion including zero and trace values', () => {
  const addNutritionEntry = jest.fn(() => ({ id: 'entry-1' }));
  jest.mocked(useStorage).mockReturnValue({ addNutritionEntry, addDrinkEntry: jest.fn() } as any);
  const { result } = renderHook(() => useNutritionBarcodeActions({ selectedDate: '2026-10-21', onNutritionEntrySelected: jest.fn() }));
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
