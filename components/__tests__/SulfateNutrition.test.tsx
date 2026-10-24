import { act, renderHook } from '@testing-library/react-native';

import { addNutritionEntryToTracking } from '@/app/context/storage/nutrition/nutritionStorage';
import type { DailyNutritionTracking, NutritionEntry, WeeklyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';
import { MINERAL_TYPE_KEYS } from '@/constants/minerals';
import { useNutritionLoggerData } from '@/hooks/nutrition/useNutritionLoggerData';
import { useNutritionTipTargets } from '@/hooks/nutrition/useNutritionTipTargets';
import { useSaveNutritionProduct } from '@/hooks/nutrition/useSaveNutritionProduct';
import { tips } from '@/locales/tips';
import { normalizeNutritionTargets } from '@/services/targetProgress/normalizeNutritionTargets';
import { resolveNutritionTarget } from '@/services/targetProgress/nutritionTargetProgress';
import { FOOD_NUTRIENT_PROFILES } from '@/types/nutrition/foodProfiles';
import { extractTypedTotals } from '@/utils/analyzeNutrition';
import { getFoodProduct } from '@/utils/foodProduct';
import { scaleNutritionComposition } from '@/utils/nutritionComposition';

const mockAddNutrition = jest.fn().mockReturnValue({ id: 'nutrition-meal' });
const mockSetWeekly = jest.fn();
let mockTracking: DailyNutritionTracking = {};
let mockPlanTips = [{ tipId: 'sulfate' }];
const mockSignals: WeeklyNutritionTracking = {};
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ addNutritionEntry: mockAddNutrition, addDrinkEntry: jest.fn(), setWeeklyNutritionTracking: mockSetWeekly, plans: { nutrition: mockPlanTips }, userProfile: { weightKg: 70 }, dailyNutritionTracking: mockTracking, weeklyNutritionTracking: mockSignals, dailyDrinkTracking: {}, takenDates: {} }) }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn().mockResolvedValue(undefined), ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const date = '2026-10-17';
const entry: NutritionEntry = { id: 'meal', type: 'meal', recordedAt: `${date}T12:00:00Z`, name: 'Meal', calories: 100, protein: 5, fat: 0, carbohydrates: 0, fiber: 0, aminoAcidsByType: { methionine: 50, cysteine: 30 } };

it('removes sulfate from minerals and preserves separate food amino acid amounts', () => {
  expect(MINERAL_TYPE_KEYS).not.toContain('sulfate');
  mockTracking = addNutritionEntryToTracking({}, date, entry);
  const { result } = renderHook(() => useNutritionLoggerData(date));
  expect(result.current.dailyNutrition.aminoAcidsByType).toMatchObject({ methionine: 50, cysteine: 30 });
  expect(extractTypedTotals({ nutritionDetails: { aminoAcids: { methionine: 50, cysteine: 30 } } }, null).aminoAcidsByType).toMatchObject({ methionine: 50, cysteine: 30 });
});
it('does not create nutrition goals from a group identifier', () => {
  expect(tips.find(item => item.id === 'sulfate')).toBeUndefined();
  const { result } = renderHook(() => useNutritionTipTargets([date]));
  expect(result.current[date]?.sulfate).toBeUndefined();
});

it('preserves the combined food methionine and cysteine goal in protein rotation', () => {
  const tip = tips.find(item => item.id === 'protein_rotation')!;
  const targets = normalizeNutritionTargets(tip, 70, 140);
  const aminoTarget = targets.find(item => item.trackingKey === 'methionine')!;
  expect(aminoTarget).toMatchObject({ amount: 1050, unit: 'mg', period: 'daily', trackingKeys: ['methionine', 'cysteine'], labelKey: 'methionineCysteine' });
  expect(resolveNutritionTarget({ target: aminoTarget, selectedDate: date, dailyNutritionTracking: mockTracking, weeklyNutritionTracking: {} })).toBe(80);
  expect(normalizeNutritionTargets(tip)).toEqual([]);
});

it('reads sulfur-rich vegetable classification from the food catalog', () => {
  expect(FOOD_NUTRIENT_PROFILES.broccoli.sulfurRichVegetable).toBe(true);
  expect(FOOD_NUTRIENT_PROFILES.kale.sulfurRichVegetable).toBe(true);
  expect(FOOD_NUTRIENT_PROFILES.eggs).not.toHaveProperty('sulfurRichVegetable');
  expect(getFoodProduct('broccoli', 'Broccoli')).not.toHaveProperty('sulfurRichVegetable');
  expect(getFoodProduct('broccoli', 'Broccoli')).not.toHaveProperty('foodKey');
  expect(getFoodProduct('broccoli', 'Broccoli').composition).not.toHaveProperty('sulfurRichVegetable');
});

it.each(['cauliflower', 'cabbage', 'garlic', 'onions', 'leeks', 'brusselsSprouts'] as const)('saves %s nutrition without barcode sulfur tracking', key => {
  mockPlanTips = [{ tipId: 'sulfate' }];
  mockSetWeekly.mockClear();
  mockAddNutrition.mockClear();
  const product = getFoodProduct(key, key);
  expect(FOOD_NUTRIENT_PROFILES[key].sulfurRichVegetable).toBe(true);
  expect(product.composition?.aminoAcidsByType?.methionine).toBeGreaterThan(0);
  expect(product.composition?.aminoAcidsByType?.cysteine).toBeGreaterThan(0);
  expect(product.servings?.length).toBeGreaterThan(0);
  const { result } = renderHook(() => useSaveNutritionProduct({ selectedDate: date, onFoodSaved: jest.fn() }));
  act(() => result.current(product, 100, 'food'));
  expect(mockAddNutrition).toHaveBeenCalledWith(date, expect.objectContaining({ aminoAcidsByType: product.composition?.aminoAcidsByType }));
  expect(mockSetWeekly).not.toHaveBeenCalled();
});

it.each(['cauliflower', 'cabbage', 'garlic', 'onions', 'leeks', 'brusselsSprouts'] as const)('includes and scales vitamins and minerals for %s', key => {
  const product = getFoodProduct(key, key);
  const composition = product.composition!;
  expect(composition.vitaminsByType?.vitamin_c).toBeGreaterThan(0);
  expect(composition.vitaminsByType?.vitamin_b9).toBeGreaterThan(0);
  expect(composition.mineralsByType?.potassium).toBeGreaterThan(0);
  const half = scaleNutritionComposition(composition, 0.5);
  expect(half.vitaminsByType?.vitamin_c).toBeCloseTo(composition.vitaminsByType!.vitamin_c! / 2);
  expect(half.mineralsByType?.potassium).toBeCloseTo(composition.mineralsByType!.potassium! / 2);
});
it('stores microgram nutrients as milligrams to match catalog conventions', () => {
  expect(getFoodProduct('brusselsSprouts', 'Brussels sprouts').composition?.vitaminsByType?.vitamin_k).toBe(0.177);
  expect(getFoodProduct('garlic', 'Garlic').composition?.mineralsByType?.selenium).toBe(0.0142);
  expect(getFoodProduct('cauliflower', 'Cauliflower').composition?.vitaminsByType?.vitamin_b9).toBe(0.057);
});

it.each(['cauliflower', 'cabbage', 'garlic', 'onions', 'leeks', 'brusselsSprouts'] as const)('preserves and scales the measured fermentable fructan fraction for %s', key => {
  const composition = getFoodProduct(key, key).composition!;
  expect(composition.fiberByType?.fiber_total).toBe(composition.fiber);
  expect(composition.fiberByType?.fiber_fermentable).toBeGreaterThan(0);
  expect(composition.fiberSubtypeTotals?.inulin_type_fructans).toBe(composition.fiberByType?.fiber_fermentable);
  const half = scaleNutritionComposition(composition, 0.5);
  expect(half.fiberByType?.fiber_total).toBeCloseTo(composition.fiber / 2);
  expect(half.fiberSubtypeTotals?.inulin_type_fructans).toBeCloseTo(composition.fiberSubtypeTotals!.inulin_type_fructans! / 2);
});

it('sums and tracks the documented fermentable fraction without counting fructans twice', () => {
  const onion = getFoodProduct('onions', 'Onion').composition!;
  mockTracking = addNutritionEntryToTracking({}, date, { ...entry, ...onion, id: 'onion' });
  const { result } = renderHook(() => useNutritionLoggerData(date));
  expect(result.current.dailyNutrition.fiberByType?.fiber_fermentable).toBeCloseTo(1.97);
  expect(result.current.dailyNutrition.fiberSubtypeTotals?.inulin_type_fructans).toBeCloseTo(1.97);
  const target = { source: 'nutrition' as const, trackingKey: 'fiber_fermentable', amount: 1, unit: 'g' as const, period: 'daily' as const };
  expect(resolveNutritionTarget({ target, selectedDate: date, dailyNutritionTracking: mockTracking, weeklyNutritionTracking: {} })).toBeCloseTo(1.97);
});
