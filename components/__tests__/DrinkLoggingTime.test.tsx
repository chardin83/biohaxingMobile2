import { act, renderHook } from '@testing-library/react-native';

import { useNutritionBarcodeActions } from '@/hooks/nutrition/useNutritionBarcodeActions';
import { getDrinkProduct } from '@/locales/drinkCatalog';
import { toRecordedAt } from '@/utils/dateUtils';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const mockAddNutrition = jest.fn().mockReturnValue({ id: 'nutrition-coffee' });
const mockAddDrink = jest.fn();
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ addNutritionEntry: mockAddNutrition, addDrinkEntry: mockAddDrink }) }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn().mockResolvedValue(undefined), ImpactFeedbackStyle: { Light: 'light' } }));

beforeEach(() => jest.clearAllMocks());

it('saves the selected drink time to both the drink and its nutrition entry on the journal day', () => {
  const selectedDate = '2026-10-15';
  const time = new Date(2026, 9, 16, 20, 51);
  const product = getDrinkProduct('coffee', 'Coffee');
  const { result } = renderHook(() => useNutritionBarcodeActions({ selectedDate, onNutritionEntrySelected: jest.fn() }));
  act(() => result.current(product, 200, 'drink', time));
  const recordedAt = toRecordedAt(selectedDate, time);
  expect(mockAddNutrition).toHaveBeenCalledWith(selectedDate, expect.objectContaining({ type: 'drink', recordedAt }));
  expect(mockAddDrink).toHaveBeenCalledWith(selectedDate, expect.objectContaining({ type: 'coffee', nutritionEntryId: 'nutrition-coffee', recordedAt }));
});

it('defaults to the current time when no time was provided', () => {
  jest.useFakeTimers();
  try {
    jest.setSystemTime(new Date(2026, 9, 16, 12, 34));
    const { result } = renderHook(() => useNutritionBarcodeActions({ selectedDate: '2026-10-16', onNutritionEntrySelected: jest.fn() }));
    act(() => result.current(getDrinkProduct('coffee', 'Coffee'), 200, 'drink'));
    expect(mockAddDrink).toHaveBeenCalledWith('2026-10-16', expect.objectContaining({ recordedAt: new Date().toISOString() }));
  } finally {
    jest.useRealTimers();
  }
});

it.each(['tea', 'energy_drink', 'sugar_free_energy_drink'] as const)('preserves caffeine information when logging %s', type => {
  const { result } = renderHook(() => useNutritionBarcodeActions({ selectedDate: '2026-10-16', onNutritionEntrySelected: jest.fn() }));
  act(() => result.current(getDrinkProduct(type, type), 200, 'drink'));
  expect(mockAddDrink).toHaveBeenCalledWith('2026-10-16', expect.objectContaining({ type, caffeinated: true }));
});

it('logs sugar-free energy drink macros and caffeine together', () => {
  const { result } = renderHook(() => useNutritionBarcodeActions({ selectedDate: '2026-10-16', onNutritionEntrySelected: jest.fn() }));
  act(() => result.current(getDrinkProduct('sugar_free_energy_drink', 'Sugar-free energy drink'), 250, 'drink'));
  expect(mockAddNutrition).toHaveBeenCalledWith('2026-10-16', expect.objectContaining({ carbohydrates: 0, caffeineMg: 80, glycemicIndex: undefined }));
  expect(mockAddDrink).toHaveBeenCalledWith('2026-10-16', expect.objectContaining({ type: 'sugar_free_energy_drink', caffeinated: true, amountMl: 250 }));
});

it('keeps a catalog drink GI reference unchanged while scaling its carbs', () => {
  const { result } = renderHook(() => useNutritionBarcodeActions({ selectedDate: '2026-10-16', onNutritionEntrySelected: jest.fn() }));
  act(() => result.current(getDrinkProduct('juice', 'Juice'), 200, 'drink'));
  expect(mockAddNutrition).toHaveBeenCalledWith('2026-10-16', expect.objectContaining({ carbohydrates: 21, glycemicIndex: 50, glycemicIndexIsEstimate: true }));
});
