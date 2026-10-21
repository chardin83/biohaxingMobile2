import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import ProductAmountBottomSheet, { type ProductAmountBottomSheetRef } from '../journal/ProductAmountBottomSheet';

let mockRemaining = 3;
let mockPremium = false;
jest.mock('@/constants/Premium', () => ({
  get PREMIUM() {
    return mockPremium;
  },
}));
jest.mock('@/services/nutrition/photoAnalysisQuota', () => ({ getFreePhotoAnalysesRemaining: async () => mockRemaining }));
beforeEach(() => {
  mockRemaining = 3;
  mockPremium = false;
});
jest.mock('@/services/gptServices', () => ({
  ALCOHOL_TYPES: ['red_wine', 'white_wine', 'beer', 'spirits', 'oak_aged_spirits'],
  isAlcohol: (type: string) => ['red_wine', 'white_wine', 'beer', 'spirits', 'oak_aged_spirits'].includes(type),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: ReactModule.forwardRef(({ children }: any, ref: any) => {
      ReactModule.useImperativeHandle(ref, () => ({ present: jest.fn(), dismiss: jest.fn() }));
      return <View>{children}</View>;
    }),
    BottomSheetScrollView: View,
  };
});
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'sv' } }) }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../NutritionBreakdown', () => () => null);
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/OptionSelector', () => () => null);
jest.mock('../ui/Notice', () => ({ message }: any) => {
  const { Text } = require('react-native');
  return <Text>{message}</Text>;
});
jest.mock('../ui/DateTimeInput', () => ({ DateTimeInput: () => null }));
jest.mock('../NumberStepper', () => ({
  __esModule: true,
  default: ({ onChange, accessibilityLabel }: any) => {
    const { Text } = require('react-native');
    return (
      <Text accessibilityLabel={accessibilityLabel} onPress={() => onChange(200)}>
        amount
      </Text>
    );
  },
}));
jest.mock('@/locales/drinkCatalog', () => ({ getDrinkImage: jest.fn() }));

const product = {
  barcode: '1234567890123',
  name: 'Yoghurt',
  brand: 'Test',
  ingredientsText: 'Mjölk, bakteriekultur',
  productType: 'food' as const,
  nutrition: { caloriesPer100g: 60, proteinPer100g: 4 },
};

test('sends the selected barcode product and portion to Premium analysis without saving first', async () => {
  const ref = React.createRef<ProductAmountBottomSheetRef>();
  const onSave = jest.fn();
  const onAnalyzePremium = jest.fn();
  const screen = render(<ProductAmountBottomSheet ref={ref} onSave={onSave} onAnalyzePremium={onAnalyzePremium} />);
  act(() => ref.current?.present(product));
  fireEvent.press(screen.getByLabelText('journal:nutritionLogger.barcodeProduct.amount'));
  await act(async () => {
    fireEvent.press(screen.getByText('journal:nutritionLogger.barcodeProduct.analyzePremium'));
  });
  expect(onAnalyzePremium).toHaveBeenCalledWith(product, 200, 'food', expect.any(Date));
  expect(onSave).not.toHaveBeenCalled();
});

test('normal barcode saving stays available and catalog foods do not offer barcode enrichment', () => {
  const ref = React.createRef<ProductAmountBottomSheetRef>();
  const onSave = jest.fn();
  const screen = render(<ProductAmountBottomSheet ref={ref} onSave={onSave} onAnalyzePremium={jest.fn()} />);
  act(() => ref.current?.present(product));
  fireEvent.press(screen.getByText('journal:nutritionLogger.barcodeProduct.add'));
  expect(onSave).toHaveBeenCalledWith(product, 100, 'food', undefined);
  act(() => ref.current?.present({ ...product, fromCatalog: true }));
  expect(screen.queryByText('journal:nutritionLogger.barcodeProduct.analyzePremium')).toBeNull();
});

test('opens the Premium purchase sheet instead of analyzing when all trials are used', async () => {
  mockRemaining = 0;
  const ref = React.createRef<ProductAmountBottomSheetRef>();
  const analyze = jest.fn();
  const discover = jest.fn();
  const screen = render(<ProductAmountBottomSheet ref={ref} onSave={jest.fn()} onAnalyzePremium={analyze} onDiscoverPremium={discover} />);
  act(() => ref.current?.present(product));
  await act(async () => {
    fireEvent.press(screen.getByText('journal:nutritionLogger.barcodeProduct.analyzePremium'));
  });
  expect(discover).toHaveBeenCalledTimes(1);
  expect(analyze).not.toHaveBeenCalled();
});

test('Premium users can analyze even with no trials remaining', async () => {
  mockRemaining = 0;
  mockPremium = true;
  const ref = React.createRef<ProductAmountBottomSheetRef>();
  const analyze = jest.fn();
  const discover = jest.fn();
  const screen = render(<ProductAmountBottomSheet ref={ref} onSave={jest.fn()} onAnalyzePremium={analyze} onDiscoverPremium={discover} />);
  act(() => ref.current?.present(product));
  await act(async () => {
    fireEvent.press(screen.getByText('journal:nutritionLogger.barcodeProduct.analyzePremium'));
  });
  expect(analyze).toHaveBeenCalledTimes(1);
  expect(discover).not.toHaveBeenCalled();
});

test('warns about conflicting energy and saves the manually entered kcal value', () => {
  const ref = React.createRef<ProductAmountBottomSheetRef>();
  const onSave = jest.fn();
  const screen = render(<ProductAmountBottomSheet ref={ref} onSave={onSave} />);
  act(() => ref.current?.present({ ...product, nutrition: { ...product.nutrition, caloriesPer100g: 463, energyKjPer100g: 194 } }));
  expect(screen.getByText('journal:nutritionLogger.barcodeProduct.energyConflict')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('journal:nutritionLogger.barcodeProduct.editCalories'));
  fireEvent.press(screen.getByText('journal:nutritionLogger.barcodeProduct.add'));
  expect(onSave).toHaveBeenCalledWith(
    expect.objectContaining({ nutrition: expect.objectContaining({ caloriesPer100g: 200, energyKjPer100g: expect.any(Number) }) }),
    100,
    'food',
    undefined
  );
  expect(onSave.mock.calls[0][0].nutrition.energyKjPer100g).toBeCloseTo(836.8);
  act(() => ref.current?.present(product));
  expect(screen.queryByText('journal:nutritionLogger.barcodeProduct.energyConflict')).toBeNull();
  fireEvent.press(screen.getByText('journal:nutritionLogger.barcodeProduct.add'));
  expect(onSave).toHaveBeenLastCalledWith(product, 100, 'food', undefined);
});

test.each([
  { quantityValue: 250, quantityUnit: 'ml', expected: 250 },
  { servingSize: '12 OZA (355 ml)', expected: 355 },
])('starts a scanned drink at its known volume: $expected ml', ({ expected, ...volume }) => {
  const ref = React.createRef<ProductAmountBottomSheetRef>();
  const onSave = jest.fn();
  const screen = render(<ProductAmountBottomSheet ref={ref} onSave={onSave} />);
  act(() => ref.current?.present({ ...product, productType: 'drink', ...volume }));
  fireEvent.press(screen.getByText('journal:nutritionLogger.barcodeProduct.add'));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining(volume), expected, 'drink', expect.any(Date));
});
