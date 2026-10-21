let mockTrialsRemaining = 3;
jest.mock('@/hooks/nutrition/useFreePhotoAnalysesRemaining', () => ({ useFreePhotoAnalysesRemaining: () => mockTrialsRemaining }));
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import NutritionBreakdown from '../NutritionBreakdown';

let mockPremium = false;
jest.mock('@/constants/Premium', () => ({
  get PREMIUM() {
    return mockPremium;
  },
}));
jest.mock('@react-navigation/native', () => ({
  useTheme: () => ({ colors: { infoWeak: '#eef7ff', infoDefault: '#cde7ff', goldTransparent: '#fff7df', goldSoft: '#eac66a' } }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { value?: number }) =>
      key.endsWith('.polyphenols')
        ? `Polyfenoler: ${options?.value} mg`
        : key.endsWith('.minerals')
          ? `Mineraler: ${options?.value} mg`
          : key.endsWith('.vitamins')
            ? `Vitaminer: ${options?.value} mg`
            : key.endsWith('.caffeineAmount')
              ? `Koffein: ${options?.value} mg`
              : key,
  }),
}));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ThemedModal', () => ({ ThemedModal: ({ children, visible }: any) => (visible ? children : null) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/PremiumOffer', () => () => {
  const { Text } = require('react-native');
  return <Text>Premium offer</Text>;
});
jest.mock('../journal/AlcoholInfoBottomSheet', () => () => null);

beforeEach(() => {
  mockTrialsRemaining = 3;
  mockPremium = false;
});

const nutrition = { name: 'Lunch', calories: 200, protein: 10, carbohydrates: 20, fat: 5, fiber: 3 };

test('shows the extra nutrient headings even without data and highlights Biohaxing values in blue', () => {
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="test" />);
  expect(screen.getByText('journal:nutritionLogger.microbiomeTitle')).toBeTruthy();
  expect(screen.getByText('Mineraler')).toBeTruthy();
  expect(screen.getByText('Vitaminer')).toBeTruthy();
  expect(screen.getByText('Polyfenoler')).toBeTruthy();
  expect(screen.getByText('Koffein')).toBeTruthy();
  for (const id of ['nutrition-biohaxing-extras']) {
    expect(require('react-native').StyleSheet.flatten(screen.getByTestId(id).props.style).backgroundColor).toBe('#eef7ff');
  }
  fireEvent.press(screen.getByText('journal:nutritionLogger.microbiomeTitle'));
  expect(screen.getByText('journal:nutritionLogger.extraNutritionMissing')).toBeTruthy();
  expect(screen.getAllByText('—').length).toBeGreaterThan(0);
});

test('protein opens a blue Biohaxing panel even when amino acid values are missing', () => {
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="test" />);
  expect(screen.queryByTestId('nutrition-amino-acids')).toBeNull();
  fireEvent.press(screen.getByText('journal:nutritionLogger.protein'));
  const panel = screen.getByTestId('nutrition-amino-acids');
  expect(require('react-native').StyleSheet.flatten(panel.props.style).backgroundColor).toBe('#eef7ff');
  expect(screen.getByText('journal:nutritionLogger.aminoAcidsBiohaxingInfo')).toBeTruthy();
  expect(screen.getByText('journal:nutritionLogger.extraNutritionMissing')).toBeTruthy();
  fireEvent.press(screen.getByText('journal:nutritionLogger.protein'));
  expect(screen.queryByTestId('nutrition-amino-acids')).toBeNull();
});

test('protein shows the existing amino acid amounts in the blue panel', () => {
  const screen = render(<NutritionBreakdown nutrition={{ ...nutrition, aminoAcidsByType: { lysine: 1200 } }} keyPrefix="test" />);
  fireEvent.press(screen.getByText('journal:nutritionLogger.protein'));
  expect(screen.getByText(/aminoAcidLabels.lysine.*1.2 g/)).toBeTruthy();
  expect(screen.queryByText('journal:nutritionLogger.extraNutritionMissing')).toBeNull();
});

test('all extra panels turn gold once Premium and trial access are unavailable', () => {
  mockTrialsRemaining = 0;
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="test" />);
  for (const id of ['nutrition-biohaxing-extras']) {
    expect(require('react-native').StyleSheet.flatten(screen.getByTestId(id).props.style).backgroundColor).toBe('#fff7df');
  }
  fireEvent.press(screen.getByText('journal:nutritionLogger.protein'));
  expect(require('react-native').StyleSheet.flatten(screen.getByTestId('nutrition-amino-acids').props.style).backgroundColor).toBe('#fff7df');
  expect(
    screen.getByTestId('nutrition-extras-premium-footer').findAll(node => node.props.children === 'journal:nutritionLogger.biohaxingPremiumRequired').length
  ).toBeGreaterThan(0);
});

test('active Premium keeps the panels blue even when no trial analyses remain', () => {
  mockTrialsRemaining = 0;
  mockPremium = true;
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="test" />);
  expect(require('react-native').StyleSheet.flatten(screen.getByTestId('nutrition-biohaxing-extras').props.style).backgroundColor).toBe('#eef7ff');
  fireEvent.press(screen.getByText('journal:nutritionLogger.protein'));
  expect(require('react-native').StyleSheet.flatten(screen.getByTestId('nutrition-amino-acids').props.style).backgroundColor).toBe('#eef7ff');
  expect(screen.queryByText('journal:nutritionLogger.biohaxingPremiumRequired')).toBeNull();
});

test('uses a shared panel including vitamins and keeps one shared Premium link and separate links for amino acids and fiber', () => {
  mockTrialsRemaining = 0;
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="test" />);
  const panel = screen.getByTestId('nutrition-biohaxing-extras');
  for (const id of ['nutrition-minerals', 'nutrition-vitamins', 'nutrition-microbiome', 'nutrition-polyphenols', 'nutrition-caffeine', 'nutrition-alcohol']) {
    expect(panel.findAll(node => node.props.testID === id).length).toBeGreaterThan(0);
    expect(require('react-native').StyleSheet.flatten(screen.getByTestId(id).props.style)?.backgroundColor).toBeUndefined();
  }
  for (const label of [
    'Mineraler',
    'Vitaminer',
    'Polyfenoler',
    'journal:nutritionLogger.microbiomeTitle',
    'journal:nutritionLogger.protein',
    'journal:nutritionLogger.fiber',
  ]) {
    fireEvent.press(screen.getByText(label));
  }
  expect(screen.queryByText('journal:nutritionLogger.extraNutritionMissing')).toBeNull();
  expect(screen.getByText('journal:nutritionLogger.microbiomeBiohaxingInfo')).toBeTruthy();
  expect(screen.getByText('journal:nutritionLogger.mineralsBiohaxingInfo')).toBeTruthy();
  expect(screen.getByText('journal:nutritionLogger.vitaminsBiohaxingInfo')).toBeTruthy();
  expect(screen.getAllByLabelText('common:premium.premium')).toHaveLength(3);
  expect(panel.findAll(node => node.props.accessibilityLabel === 'common:premium.premium' && node.props.accessibilityRole === 'button').length).toBeGreaterThan(
    0
  );
  fireEvent.press(screen.getAllByLabelText('common:premium.premium')[0]);
  expect(screen.getByText('Premium offer')).toBeTruthy();
});

test('blue mineral and vitamin sections show descriptions and invite the extra analysis when values are missing', () => {
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="test" />);
  fireEvent.press(screen.getByText('Mineraler'));
  fireEvent.press(screen.getByText('Vitaminer'));
  expect(screen.getByText('journal:nutritionLogger.mineralsBiohaxingInfo')).toBeTruthy();
  expect(screen.getByText('journal:nutritionLogger.vitaminsBiohaxingInfo')).toBeTruthy();
  expect(screen.getAllByText('journal:nutritionLogger.extraNutritionMissing')).toHaveLength(2);
});

test('catalog nutrition stays blue and shows values without Premium offers or analysis explanations', () => {
  mockTrialsRemaining = 0;
  const screen = render(
    <NutritionBreakdown nutrition={{ ...nutrition, aminoAcidsByType: { lysine: 1200 }, mineralsByType: { iron: 2 } }} keyPrefix="catalog" existingDataOnly />
  );
  expect(require('react-native').StyleSheet.flatten(screen.getByTestId('nutrition-biohaxing-extras').props.style).backgroundColor).toBe('#eef7ff');
  for (const label of [
    'Mineraler',
    'Vitaminer',
    'Polyfenoler',
    'journal:nutritionLogger.microbiomeTitle',
    'journal:nutritionLogger.protein',
    'journal:nutritionLogger.fiber',
  ]) {
    fireEvent.press(screen.getByText(label));
  }
  expect(screen.queryByLabelText('common:premium.premium')).toBeNull();
  expect(screen.queryByText('journal:nutritionLogger.extraNutritionMissing')).toBeNull();
  expect(screen.queryByText(/BiohaxingInfo$/)).toBeNull();
  expect(screen.getByText(/aminoAcidLabels.lysine.*1.2 g/)).toBeTruthy();
  expect(screen.getByText(/mineralLabels.iron.*2.0 mg/)).toBeTruthy();
});

test('active Premium hides promotional descriptions but still explains missing values', () => {
  mockPremium = true;
  mockTrialsRemaining = 0;
  const screen = render(<NutritionBreakdown nutrition={nutrition} keyPrefix="premium" />);
  for (const label of [
    'Mineraler',
    'Vitaminer',
    'Polyfenoler',
    'journal:nutritionLogger.microbiomeTitle',
    'journal:nutritionLogger.protein',
    'journal:nutritionLogger.fiber',
  ]) {
    fireEvent.press(screen.getByText(label));
  }
  expect(screen.queryByText(/BiohaxingInfo$/)).toBeNull();
  expect(screen.queryByLabelText('common:premium.premium')).toBeNull();
  expect(screen.getAllByText('journal:nutritionLogger.extraNutritionMissing')).toHaveLength(6);
});
