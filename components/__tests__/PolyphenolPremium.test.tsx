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
  useTranslation: () => ({ t: (key: string, options?: { value?: number }) => (key.endsWith('.polyphenols') ? `Polyfenoler: ${options?.value} mg` : key) }),
}));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ThemedModal', () => ({ ThemedModal: ({ children, visible }: any) => (visible ? children : null) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/PremiumOffer', () => () => {
  const { Text } = require('react-native');
  return <Text>Premium offer</Text>;
});
jest.mock('../journal/AlcoholInfoBottomSheet', () => () => null);

const nutrition = {
  name: 'Lunch',
  calories: 100,
  protein: 5,
  carbohydrates: 10,
  fat: 2,
  fiber: 8,
  polyphenolByType: { polyphenols_total: 100, catechins: 20 },
};
beforeEach(() => {
  mockPremium = false;
});

test('free users see the total with premium information and a working premium link', () => {
  const screen = render(<NutritionBreakdown nutrition={{ ...nutrition, polyphenolByType: { polyphenols_total: 100 } }} keyPrefix="test" />);
  fireEvent.press(screen.getByText('Polyfenoler'));
  expect(screen.getByText('100.0 mg')).toBeTruthy();
  expect(screen.getByText('journal:nutritionLogger.polyphenolTypesPremium')).toBeTruthy();
  expect(screen.queryByText('journal:nutritionLogger.polyphenolPremiumExpired')).toBeNull();
  fireEvent.press(screen.getByLabelText('common:premium.premium'));
  expect(screen.getByText('Premium offer')).toBeTruthy();
});

test('expired premium preserves old polyphenol types with a reactivation button', () => {
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="test" />);
  fireEvent.press(screen.getByText('Polyfenoler'));
  expect(screen.getByText(/polyphenolLabels.catechins/)).toBeTruthy();
  expect(screen.getByText('journal:nutritionLogger.polyphenolPremiumExpired')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('common:premium.premium'));
  expect(screen.getByText('Premium offer')).toBeTruthy();
});

test('trial analysis shows the types without claiming premium has expired', () => {
  const screen = render(<NutritionBreakdown nutrition={{ ...nutrition, analysisTier: 'trial' }} keyPrefix="test" />);
  fireEvent.press(screen.getByText('Polyfenoler'));
  expect(screen.getByText(/polyphenolLabels.catechins/)).toBeTruthy();
  expect(screen.getByText('journal:nutritionLogger.polyphenolTrialResult')).toBeTruthy();
  expect(screen.queryByText('journal:nutritionLogger.polyphenolPremiumExpired')).toBeNull();
});

test('premium users see all saved types without an upsell', () => {
  mockPremium = true;
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="test" />);
  fireEvent.press(screen.getByText('Polyfenoler'));
  expect(screen.getByText(/polyphenolLabels.catechins/)).toBeTruthy();
  expect(screen.queryByText('journal:nutritionLogger.polyphenolTypesPremium')).toBeNull();
  expect(screen.queryByText('journal:nutritionLogger.polyphenolPremiumExpired')).toBeNull();
});
