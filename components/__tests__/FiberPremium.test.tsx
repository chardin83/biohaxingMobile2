jest.mock('@/hooks/nutrition/useFreePhotoAnalysesRemaining', () => ({ useFreePhotoAnalysesRemaining: () => 0 }));
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import NutritionBreakdown from '../NutritionBreakdown';

let mockPremium = false;
jest.mock('@/constants/Premium', () => ({
  get PREMIUM() {
    return mockPremium;
  },
}));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: { value?: number }) => (key.endsWith('.fiber') ? `Fibrer: ${options?.value} g` : key) }),
}));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ThemedModal', () => ({ ThemedModal: ({ children, visible }: any) => (visible ? children : null) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/PremiumOffer', () => () => {
  const { Text } = require('react-native');
  return <Text>Premium offer</Text>;
});
jest.mock('../journal/AlcoholInfoBottomSheet', () => () => null);

const nutrition = { name: 'Lunch', calories: 100, protein: 5, carbohydrates: 10, fat: 2, fiber: 8, fiberByType: { fiber_total: 8, fiber_gel_forming: 3 } };

beforeEach(() => {
  mockPremium = false;
});

test('expired premium keeps previously analyzed fiber types visible and offers reactivation', () => {
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="test" />);
  fireEvent.press(screen.getByText('Fibrer'));
  expect(screen.getByText('8 g')).toBeTruthy();
  expect(screen.getByText('journal:nutritionLogger.fiberPremiumExpired')).toBeTruthy();
  expect(screen.getByText(/fiberLabels.fiber_gel_forming/)).toBeTruthy();
  fireEvent.press(screen.getAllByLabelText('common:premium.premium')[0]);
  expect(screen.getByText('Premium offer')).toBeTruthy();
});

test('free users can open fiber when only the total exists', () => {
  const screen = render(<NutritionBreakdown nutrition={{ ...nutrition, fiberByType: { fiber_total: 8 } }} keyPrefix="test" />);
  fireEvent.press(screen.getByText('Fibrer'));
  expect(screen.getByText('journal:nutritionLogger.fiberTypesPremium')).toBeTruthy();
  expect(screen.queryByText('journal:nutritionLogger.fiberPremiumExpired')).toBeNull();
  fireEvent.press(screen.getAllByLabelText('common:premium.premium')[0]);
  expect(screen.getByText('Premium offer')).toBeTruthy();
});

test('premium users keep the fiber breakdown without the upsell', () => {
  mockPremium = true;
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="test" />);
  fireEvent.press(screen.getByText('Fibrer'));
  expect(screen.queryByText('journal:nutritionLogger.fiberTypesPremium')).toBeNull();
  expect(screen.queryByText('journal:nutritionLogger.fiberPremiumExpired')).toBeNull();
  expect(screen.getByText(/fiberLabels.fiber_gel_forming/)).toBeTruthy();
});

test('previously analyzed subtypes remain visible even without category totals', () => {
  const screen = render(
    <NutritionBreakdown nutrition={{ ...nutrition, fiberByType: { fiber_total: 8 }, fiberSubtypeTotals: { pectin: 2 } }} keyPrefix="test" />
  );
  fireEvent.press(screen.getByText('Fibrer'));
  expect(screen.getByText('journal:nutritionLogger.fiberPremiumExpired')).toBeTruthy();
  expect(screen.getAllByText(/fiberSubtypeLabels.pectin/).length).toBeGreaterThan(0);
});

test('trial results show the full breakdown without claiming premium expired', () => {
  const screen = render(<NutritionBreakdown nutrition={{ ...nutrition, analysisTier: 'trial' }} keyPrefix="test" />);
  fireEvent.press(screen.getByText('Fibrer'));
  expect(screen.getByText(/fiberLabels.fiber_gel_forming/)).toBeTruthy();
  expect(screen.getByText('journal:nutritionLogger.fiberTrialResult')).toBeTruthy();
  expect(screen.queryByText('journal:nutritionLogger.fiberPremiumExpired')).toBeNull();
  expect(screen.queryByText('journal:nutritionLogger.reactivatePremium')).toBeNull();
});
