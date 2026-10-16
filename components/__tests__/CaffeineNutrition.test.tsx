import { render, renderHook } from '@testing-library/react-native';
import React from 'react';

import { addNutritionEntryToTracking, removeNutritionEntryFromTracking } from '@/app/context/storage/nutrition/nutritionStorage';
import type { DailyNutritionTracking, NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import NutritionBreakdown from '@/components/NutritionBreakdown';
import { useNutritionLoggerData } from '@/hooks/nutrition/useNutritionLoggerData';
import { getDrinkNutritionData } from '@/locales/drinkCatalog';
import { extractStructuredAnalysis } from '@/utils/analyzeNutrition';
import { scaleNutritionComposition } from '@/utils/nutritionComposition';

let mockTracking: DailyNutritionTracking = {};
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ dailyNutritionTracking: mockTracking, dailyDrinkTracking: {} }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, options?: { value?: unknown }) => {
  if (key.endsWith('.caffeineAmount')) return `Koffein: ${options?.value} mg`;
  if (key.endsWith('.polyphenols')) return `Polyfenoler: ${options?.value} mg`;
  return key;
} }) }));

const date = '2026-10-16';
const food: NutritionEntry = { id: 'food', type: 'food', name: 'Chocolate', recordedAt: '2026-10-16T12:00:00Z', calories: 100, protein: 1, carbohydrates: 10, fat: 5, fiber: 1, caffeineMg: 20 };
const drink: NutritionEntry = { id: 'drink', type: 'drink', recordedAt: '2026-10-16T12:00:00Z', ...getDrinkNutritionData('coffee', 'Coffee', 200) };

beforeEach(() => { mockTracking = {}; });

it('scales caffeine in food and drink portions', () => {
  expect(scaleNutritionComposition(food, 0.5).caffeineMg).toBe(10);
  expect(getDrinkNutritionData('coffee', 'Coffee', 200).caffeineMg).toBe(90);
  expect(getDrinkNutritionData('energy_drink', 'Energy drink', 250).caffeineMg).toBe(80);
  expect(scaleNutritionComposition({ ...food, caffeineMg: 21 }, 0.5).caffeineMg).toBe(11);
  expect(Number.isInteger(getDrinkNutritionData('tea', 'Tea', 250).caffeineMg)).toBe(true);
});

it('stores caffeine as whole milligrams in both entries and daily totals', () => {
  const tracking = addNutritionEntryToTracking({}, date, { ...food, caffeineMg: 20.7 });
  expect(tracking[date].entries[0].caffeineMg).toBe(21);
  expect(tracking[date].totals.caffeineMg).toBe(21);
});

it('sums food and drink caffeine once and recalculates after removal', () => {
  mockTracking = addNutritionEntryToTracking(addNutritionEntryToTracking({}, date, food), date, drink);
  expect(mockTracking[date].totals.caffeineMg).toBe(110);
  const { result, rerender } = renderHook(() => useNutritionLoggerData(date));
  expect(result.current.dailyNutrition.caffeineMg).toBe(110);
  mockTracking = removeNutritionEntryFromTracking(mockTracking, date, 'drink');
  rerender({});
  expect(result.current.dailyNutrition.caffeineMg).toBe(20);
});

it('shows caffeine as the last nutrient after polyphenols', () => {
  const screen = render(<NutritionBreakdown nutrition={{ ...food, polyphenolByType: { polyphenols_total: 100 } }} keyPrefix="test" />);
  expect(screen.getByText('Koffein')).toBeTruthy();
  expect(screen.getByText('20 mg')).toBeTruthy();
  const output = JSON.stringify(screen.toJSON());
  expect(output.indexOf('Polyfenoler')).toBeLessThan(output.indexOf('Koffein'));
});

it('preserves caffeine values returned for analyzed food', () => {
  expect(extractStructuredAnalysis({ nutrition: { calories: 100, caffeineMg: 20 } }, null)?.caffeineMg).toBe(20);
  expect(extractStructuredAnalysis({ nutrition: { calories: 100, nutritionDetails: { caffeineMg: 20 } } }, null)?.caffeineMg).toBe(20);
  expect(extractStructuredAnalysis({ nutrition: { calories: 100 }, nutritionDetails: { caffeineMg: 20 } }, null)?.caffeineMg).toBe(20);
});
