import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import NutritionFoodsSection from '@/app/(stack)/dashboard/area/[areaId]/details/sections/NutritionFoodsSection';
import type { Tip } from '@/locales/tips';

const mockClaimReadingXP = jest.fn();
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ viewedTips: [], claimTipReadingXP: mockClaimReadingXP }) }));

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, options?: { defaultValue?: string }) => {
  if (key.startsWith('food:foods.')) {
    const foodKey = key.split('.')[1];
    return require('@/locales/sv/food.json').foods[foodKey]?.name ?? options?.defaultValue ?? key;
  }
  return key;
} }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/InformationCardLink', () => ({
  InformationCardLink: ({ title, sheetTitle, children, footer, accessory, onSheetChange }: any) => {
    const mockReact = require('react');
    const { View, Text } = require('react-native');
    return mockReact.createElement(View, { testID: 'foods-sheet', onSheetChange },
      mockReact.createElement(Text, null, title),
      mockReact.createElement(Text, null, sheetTitle),
      accessory, children, footer);
  },
}));

const tip: Tip = {
  id: 'example', title: 'example.title', descriptionKey: 'example.description', areas: [],
  nutritionFoods: [{ key: 'broccoli', detailsKey: 'vegetableInfo' }, { key: 'salmon' }],
};

it('shows food images and descriptions without an add-to-plan button', () => {
  const screen = render(<NutritionFoodsSection tip={tip} />);
  expect(screen.getByText('common:tipDetails.relatedFoodsTitle (2)')).toBeTruthy();
  expect(screen.getByText('common:tipDetails.relatedFoodsTitle')).toBeTruthy();
  expect(screen.getByText('Broccoli')).toBeTruthy();
  expect(screen.getByText('Lax')).toBeTruthy();
  expect(screen.getByLabelText('Broccoli').props.source).toBeTruthy();
  expect(screen.getByLabelText('Lax').props.source).toBeTruthy();
  expect(screen.getByText('tips:example.nutritionFoods.items.vegetableInfo.details')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});

it('awards foods XP only after reading and confirming', () => {
  jest.useFakeTimers();
  try {
    const screen = render(<NutritionFoodsSection tip={tip} />);
    fireEvent(screen.getByTestId('foods-sheet'), 'sheetChange', 0);
    act(() => jest.advanceTimersByTime(5000));
    expect(mockClaimReadingXP).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('common:tipDetails.iHaveRead'));
    expect(mockClaimReadingXP).toHaveBeenCalledWith('example', 'foods');
  } finally {
    jest.useRealTimers();
  }
});

it('hides the section when the tip has no related foods', () => {
  const screen = render(<NutritionFoodsSection tip={{ ...tip, nutritionFoods: [] }} />);
  expect(screen.queryByText('common:tipDetails.relatedFoodsTitle')).toBeNull();
});
