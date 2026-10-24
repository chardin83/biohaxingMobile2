import { act, renderHook } from '@testing-library/react-native';

import type { NutritionTrackingContribution, WeeklyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';
import { useCatalogColorTracking } from '@/hooks/nutrition/useCatalogColorTracking';
import { useNutritionBarcodeActions } from '@/hooks/nutrition/useNutritionBarcodeActions';
import { resolveNutritionTarget } from '@/services/targetProgress/nutritionTargetProgress';
import { getFoodProduct } from '@/utils/foodProduct';

const mockAddNutrition = jest.fn(() => ({ id: 'orange-entry' }));
let mockWeekly: WeeklyNutritionTracking = {};
let mockPlanTips = [{ tipId: 'eat_colorful_veggies' }];
const mockSetWeekly = jest.fn((update: (previous: WeeklyNutritionTracking) => WeeklyNutritionTracking) => { mockWeekly = update(mockWeekly); });
beforeEach(() => { mockWeekly = {}; mockPlanTips = [{ tipId: 'eat_colorful_veggies' }]; jest.clearAllMocks(); });
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ addNutritionEntry: mockAddNutrition, addDrinkEntry: jest.fn(), setWeeklyNutritionTracking: mockSetWeekly, plans: { nutrition: mockPlanTips } }) }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn().mockResolvedValue(undefined), ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => (key.endsWith('.orange') ? 'orange' : key) }) }));

it('persists catalog color for an active goal and makes it count in weekly progress', () => {
  const { result } = renderHook(() => useNutritionBarcodeActions({ selectedDate: '2026-10-24', onNutritionEntrySelected: jest.fn() }));
  act(() => result.current(getFoodProduct('orange', 'Apelsin'), 100, 'food'));
  expect(mockWeekly['2026-10-19']).toEqual([{ nutritionEntryId: 'orange-entry', date: '2026-10-24', signals: { vegetable_colors: [{ en: 'orange', local: 'orange' }] } }]);
  const progress = (selectedDate: string) => resolveNutritionTarget({
    target: { source: 'nutrition', trackingKey: 'vegetable_colors', period: 'weekly', unit: 'items', amount: 6 },
    selectedDate, dailyNutritionTracking: {}, weeklyNutritionTracking: mockWeekly,
  });
  expect(progress('2026-10-24')).toBe(1);
  act(() => result.current(getFoodProduct('orange', 'Apelsin'), 100, 'food'));
  expect(progress('2026-10-24')).toBe(1);
  expect(progress('2026-10-31')).toBe(0);
  expect(mockAddNutrition).toHaveBeenCalledWith('2026-10-24', expect.not.objectContaining({ vegetableColor: expect.anything() }));
});

it('counts repeated orange as one weekly color, combining catalog and AI contributions', () => {
  const contribution = (id: string, color: string): NutritionTrackingContribution => ({
    nutritionEntryId: id,
    date: '2026-10-24',
    signals: { vegetable_colors: [{ en: color, local: color }] },
  });
  const weekly: WeeklyNutritionTracking = {
    '2026-10-19': [contribution('catalog1', 'orange'), contribution('catalog2', 'orange'), contribution('ai', 'green')],
  };
  const input = {
    target: { source: 'nutrition' as const, trackingKey: 'vegetable_colors', period: 'weekly' as const, unit: 'items' as const, amount: 6 },
    selectedDate: '2026-10-24',
    dailyNutritionTracking: {},
    weeklyNutritionTracking: weekly,
  };
  expect(resolveNutritionTarget(input)).toBe(2);
  weekly['2026-10-19'] = weekly['2026-10-19'].filter(item => item.nutritionEntryId === 'ai');
  expect(resolveNutritionTarget(input)).toBe(1);
});

it('does not invent fruit and vegetable colors for eggs, uncertain varieties or zero amounts', () => {
  const { result } = renderHook(() => useNutritionBarcodeActions({ selectedDate: '2026-10-24', onNutritionEntrySelected: jest.fn() }));
  act(() => {
    result.current(getFoodProduct('eggs', 'Eggs'), 100, 'food');
    result.current(getFoodProduct('apples', 'Apple'), 100, 'food');
    result.current(getFoodProduct('orange', 'Orange'), 0, 'food');
  });
  expect(mockSetWeekly).not.toHaveBeenCalled();
});

it('does not persist colors without an active color goal', () => {
  mockPlanTips = [];
  const { result } = renderHook(() => useCatalogColorTracking('2026-10-24'));
  act(() => result.current('food-from-target-page', getFoodProduct('orange', 'Apelsin'), 100));
  expect(mockSetWeekly).not.toHaveBeenCalled();
});

it('tracks the saved food identity through the shared target-page color action', () => {
  const { result } = renderHook(() => useCatalogColorTracking('2026-10-24'));
  act(() => result.current('food-from-target-page', getFoodProduct('orange', 'Apelsin'), 100));
  expect(mockWeekly['2026-10-19'][0]).toMatchObject({ nutritionEntryId: 'food-from-target-page', signals: { vegetable_colors: [{ en: 'orange', local: 'orange' }] } });
});
