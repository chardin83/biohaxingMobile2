jest.mock('@/hooks/nutrition/useFreePhotoAnalysesRemaining', () => ({ useFreePhotoAnalysesRemaining: () => 0 }));
import { fireEvent, render, renderHook } from '@testing-library/react-native';
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
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: mockReact.forwardRef(({ children, onDismiss }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ present: jest.fn(), dismiss: onDismiss }));
      return <View>{children}</View>;
    }),
    BottomSheetScrollView: View,
    BottomSheetBackdrop: () => null,
  };
});
jest.mock('@/components/ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0 }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, options?: { value?: unknown }) => {
  if (key.endsWith('.alcoholLabel')) return 'Alkohol';
  if (key.endsWith('.alcoholGrams')) return `${options?.value} g`;
  if (key.endsWith('.alcoholStandardDrinks')) return `${options?.value}`;
  if (key.endsWith('.alcoholAmount')) return `Alkohol: ${options?.value} g`;
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

it('shows caffeine before the extra nutrition panel', () => {
  const screen = render(<NutritionBreakdown nutrition={{ ...food, polyphenolByType: { polyphenols_total: 100 } }} keyPrefix="test" />);
  expect(screen.getByText('Koffein')).toBeTruthy();
  expect(screen.getByText('20 mg')).toBeTruthy();
  const output = JSON.stringify(screen.toJSON());
  expect(output.indexOf('Koffein')).toBeLessThan(output.indexOf('Polyfenoler'));
});

it('preserves caffeine values returned for analyzed food', () => {
  expect(extractStructuredAnalysis({ nutrition: { calories: 100, caffeineMg: 20 } }, null)?.caffeineMg).toBe(20);
  expect(extractStructuredAnalysis({ nutrition: { calories: 100, nutritionDetails: { caffeineMg: 20 } } }, null)?.caffeineMg).toBe(20);
  expect(extractStructuredAnalysis({ nutrition: { calories: 100 }, nutritionDetails: { caffeineMg: 20 } }, null)?.caffeineMg).toBe(20);
});

it('tracks alcohol portions, daily totals and removal', () => {
  const wine: NutritionEntry = { ...drink, id: 'wine', ...getDrinkNutritionData('red_wine', 'Wine', 150) };
  expect(wine.alcoholGrams).toBe(14.8);
  expect(scaleNutritionComposition(wine, 2).alcoholGrams).toBe(29.6);
  mockTracking = addNutritionEntryToTracking({}, date, wine);
  expect(mockTracking[date].totals.alcoholGrams).toBe(14.8);
  const { result, rerender } = renderHook(() => useNutritionLoggerData(date));
  expect(result.current.dailyNutrition.alcoholGrams).toBe(14.8);
  const screen = render(<NutritionBreakdown nutrition={wine} keyPrefix="alcohol" />);
  expect(screen.getByText('Alkohol')).toBeTruthy();
  expect(screen.getByText('14.8 g')).toBeTruthy();
  mockTracking = removeNutritionEntryFromTracking(mockTracking, date, 'wine');
  rerender({});
  expect(result.current.dailyNutrition.alcoholGrams ?? 0).toBe(0);
});

it('shows grams with the Swedish standard drink equivalent below', () => {
  const screen = render(<NutritionBreakdown nutrition={getDrinkNutritionData('white_wine', 'Wine', 150)} keyPrefix="wine" />);
  expect(screen.getByText('1.2')).toBeTruthy();
});

it('opens and closes the standard drink explanation from the alcohol info button', () => {
  const screen = render(<NutritionBreakdown nutrition={food} keyPrefix="info" />);
  expect(screen.queryByText('journal:nutritionLogger.alcoholInfo.description')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'journal:nutritionLogger.alcoholInfo.title' }));
  expect(screen.getByText('journal:nutritionLogger.alcoholInfo.description')).toBeTruthy();
  fireEvent.press(screen.getByText('common:general.understood'));
  expect(screen.queryByText('journal:nutritionLogger.alcoholInfo.description')).toBeNull();
});
