import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import PremiumBottomSheet, { type PremiumBottomSheetRef } from '../ui/PremiumBottomSheet';

const mockPresent = jest.fn();
const mockDismiss = jest.fn();
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 12 }) }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: mockReact.forwardRef(({ children }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss }));
      return mockReact.createElement(View, null, children);
    }),
    BottomSheetScrollView: View, BottomSheetBackdrop: View,
  };
});

it('works independently and passes the selected plan to the purchase callback', () => {
  const ref = React.createRef<PremiumBottomSheetRef>();
  const start = jest.fn();
  const screen = render(<PremiumBottomSheet ref={ref} onStartPremium={start} />);
  act(() => ref.current?.present());
  expect(mockPresent).toHaveBeenCalledTimes(1);
  expect(screen.getByText('premium.features.photo.title')).toBeTruthy();
  expect(screen.getByText('premium.features.goals.title')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'premium.start' }));
  expect(start).toHaveBeenLastCalledWith('yearly');
  fireEvent.press(screen.getByRole('radio', { name: 'premium.monthly.price' }));
  fireEvent.press(screen.getByRole('button', { name: 'premium.start' }));
  expect(start).toHaveBeenLastCalledWith('monthly');
  fireEvent.press(screen.getByText('premium.notNow'));
  expect(mockDismiss).toHaveBeenCalledTimes(1);
});
