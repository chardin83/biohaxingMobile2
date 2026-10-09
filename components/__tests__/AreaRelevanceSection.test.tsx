import { fireEvent, render, within } from '@testing-library/react-native';
import React from 'react';

import AreaRelevanceSection from '@/components/sections/details/AreaRelevanceSection';
import type { Tip } from '@/locales/tips';

const mockClaimTipAreaXP = jest.fn();
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ viewedTips: [], claimTipAreaXP: mockClaimTipAreaXP }) }));

const mockPresent = jest.fn();
const mockDismiss = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }), useLocalSearchParams: () => ({ fromPlan: '1' }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('react-native-paper', () => ({ Icon: ({ source }: any) => {
  const mockReact = require('react');
  return mockReact.createElement(require('react-native').Text, null, source);
} }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0 }) }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../ui/CardLinkList', () => ({ CardLinkList: ({ rows }: any) => {
  const mockReact = require('react');
  const { Pressable, Text } = require('react-native');
  return rows.map((row: any) => mockReact.createElement(Pressable, { key: row.key, testID: row.key, accessibilityRole: 'button', onPress: row.onPress, subtitle: row.subtitle, icon: row.icon }, mockReact.createElement(Text, null, row.title)));
} }));
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: mockReact.forwardRef(({ children, onDismiss }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss }));
      return mockReact.createElement(View, { testID: 'sheet', onDismiss }, children);
    }),
    BottomSheetBackdrop: View, BottomSheetView: View, BottomSheetScrollView: View,
  };
});

it('puts the current area first, shows only its subtitle and opens each area information', () => {
  const tip: Tip = { id: 'example', title: 'example.title', descriptionKey: 'example.description', areas: [
    { id: 'energy', descriptionKey: 'example.areas.energy' },
    { id: 'sleepQuality', descriptionKey: 'example.areas.sleep' },
  ] };
  const screen = render(<AreaRelevanceSection tip={tip} areaId="sleepQuality" />);
  expect(screen.getAllByRole('button').map(row => row.props.testID)).toEqual(['sleepQuality', 'energy']);
  expect(screen.getByTestId('sleepQuality').props.subtitle).toBe('tips:example.areas.sleep');
  expect(screen.getByTestId('energy').props.subtitle).toBeUndefined();
  expect(screen.getByTestId('sleepQuality').props.icon.props.source).toBe('sleep');
  expect(screen.getByTestId('energy').props.icon.props.source).toBe('flash');
  fireEvent.press(screen.getByTestId('energy'));
  expect(mockPresent).toHaveBeenCalled();
  expect(mockClaimTipAreaXP).toHaveBeenCalledWith('example', 'energy');
  expect(within(screen.getByTestId('sheet')).getByText('areas:energy.title')).toBeTruthy();
  expect(within(screen.getByTestId('sheet')).getByText('tips:example.areas.energy')).toBeTruthy();
  fireEvent.press(within(screen.getByTestId('sheet')).getByRole('button'));
  expect(mockDismiss).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
  fireEvent(screen.getByTestId('sheet'), 'dismiss');
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/dashboard/area/[areaId]/details', params: { areaId: 'energy', prevAreaId: 'sleepQuality', tipId: 'example', fromPlan: '1' } });
  fireEvent.press(screen.getByTestId('sleepQuality'));
  expect(within(screen.getByTestId('sheet')).getByText('tips:example.areas.sleep')).toBeTruthy();
});
