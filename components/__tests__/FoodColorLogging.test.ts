import { act, renderHook } from '@testing-library/react-native';

import type { NutritionTrackingContribution, WeeklyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';
import { useCatalogTracking } from '@/hooks/nutrition/useCatalogTracking';
import { useSaveNutritionProduct } from '@/hooks/nutrition/useSaveNutritionProduct';
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
  const { result } = renderHook(() => useSaveNutritionProduct({ selectedDate: '2026-10-24', onFoodSaved: jest.fn() }));
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
  const { result } = renderHook(() => useSaveNutritionProduct({ selectedDate: '2026-10-24', onFoodSaved: jest.fn() }));
  act(() => {
    result.current(getFoodProduct('eggs', 'Eggs'), 100, 'food');
    result.current(getFoodProduct('apples', 'Apple'), 100, 'food');
    result.current(getFoodProduct('orange', 'Orange'), 0, 'food');
  });
  expect(mockSetWeekly).not.toHaveBeenCalled();
});

it('does not persist colors without an active color goal', () => {
  mockPlanTips = [];
  const { result } = renderHook(() => useCatalogTracking('2026-10-24'));
  act(() => result.current('food-from-target-page', getFoodProduct('orange', 'Apelsin'), 100));
  expect(mockSetWeekly).not.toHaveBeenCalled();
});

it('tracks the saved food identity through the shared target-page color action', () => {
  const { result } = renderHook(() => useCatalogTracking('2026-10-24'));
  act(() => result.current('food-from-target-page', getFoodProduct('orange', 'Apelsin'), 100));
  expect(mockWeekly['2026-10-19'][0]).toMatchObject({ nutritionEntryId: 'food-from-target-page', signals: { vegetable_colors: [{ en: 'orange', local: 'orange' }] } });
});

it('counts catalog plants once per week across preparations and excludes animal foods', () => {
  mockPlanTips = [{ tipId: 'plant_diversity_30_week' }];
  const { result } = renderHook(() => useSaveNutritionProduct({ selectedDate: '2026-10-24', onFoodSaved: jest.fn() }));
  act(() => {
    for (const key of ['orange', 'orange', 'oats', 'oatBran', 'cookedCooledJasmineRice', 'cookedCooledBasmatiRice', 'eggs'] as const) {
      result.current(getFoodProduct(key, key), 100, 'food');
    }
  });
  const progress = (selectedDate: string) => resolveNutritionTarget({
    target: { source: 'nutrition', trackingKey: 'unique_plants', period: 'weekly', unit: 'items', amount: 30 },
    selectedDate, dailyNutritionTracking: {}, weeklyNutritionTracking: mockWeekly,
  });
  expect(progress('2026-10-24')).toBe(3);
  expect(progress('2026-10-31')).toBe(0);
  expect(mockWeekly['2026-10-19']).toHaveLength(6);
  expect(mockWeekly['2026-10-19'].every(item => !item.signals.vegetable_colors)).toBe(true);
  expect(getFoodProduct('orange', 'Apelsin').composition).not.toHaveProperty('plantName');
});

it('saves both active catalog goals in one contribution through the target-page action', () => {
  mockPlanTips = [{ tipId: 'plant_diversity_30_week' }, { tipId: 'eat_colorful_veggies' }];
  const { result } = renderHook(() => useCatalogTracking('2026-10-24'));
  act(() => result.current('target-food', getFoodProduct('orange', 'Apelsin'), 100));
  expect(mockWeekly['2026-10-19']).toEqual([{
    nutritionEntryId: 'target-food', date: '2026-10-24', signals: {
      unique_plants: [{ en: 'orange', local: 'Apelsin' }],
      vegetable_colors: [{ en: 'orange', local: 'orange' }],
    },
  }]);
});
