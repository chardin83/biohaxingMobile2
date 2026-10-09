import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import DashboardScreen from '@/app/(tabs)/dashboard';

const mockPush = jest.fn();
const mockStorage = {
  myAreas: ['energy'], myXP: 5, myLevel: 1, viewedTips: [] as any[], nutritionXpClaims: {} as Record<string, any>,
  plans: { training: [], nutrition: [], other: [], supplements: [] },
};
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => mockStorage }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light, dark: false }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/locales/tips', () => ({ tips: [{ id: 'example', areas: [{ id: 'energy' }, { id: 'sleepQuality' }] }] }));
jest.mock('../DashboardSyncSummary', () => ({ DashboardSyncSummary: () => null }));
jest.mock('../ui/Container', () => ({ __esModule: true, default: require('react-native').View }));
jest.mock('../ui/InfoButtonWithText', () => ({ InfoButtonWithText: require('react-native').View }));
jest.mock('../ui/ProgressbarWithLabel', () => ({ __esModule: true, default: () => null }));
jest.mock('../ui/AppCard', () => ({ __esModule: true, default: ({ title, xp, onPress }: any) => {
  const mockReact = require('react');
  const { Pressable, Text } = require('react-native');
  return mockReact.createElement(Pressable, { onPress }, mockReact.createElement(Text, null, title), mockReact.createElement(Text, null, `${xp} XP`));
} }));
jest.mock('../ui/XPBadge', () => ({ __esModule: true, default: ({ amount }: any) => {
  return require('react').createElement(require('react-native').Text, null, `${amount} XP`);
} }));
jest.mock('../ui/InformationCardLink', () => ({ InformationCardLink: ({ title, onPress }: any) => {
  const mockReact = require('react');
  const { Text, Pressable } = require('react-native');
  return mockReact.createElement(Pressable, { onPress }, mockReact.createElement(Text, null, title));
} }));

beforeEach(() => {
  mockPush.mockClear();
  mockStorage.myAreas = ['energy'];
  mockStorage.viewedTips = [];
  mockStorage.nutritionXpClaims = {};
});

it('shows hidden areas with earned XP and lets the user open them', () => {
  mockStorage.viewedTips = [{ tipId: 'example', xpEarned: 5 }];
  const screen = render(<DashboardScreen />);
  expect(screen.getByText('common:dashboard.hiddenAreasXP')).toBeTruthy();
  expect(screen.queryByText('areas:sleepQuality.title')).toBeNull();
  fireEvent.press(screen.getByText('common:dashboard.hiddenAreasXP'));
  expect(screen.queryByText('common:dashboard.hiddenAreasXP')).toBeNull();
  expect(screen.getByText('areas:energy.title')).toBeTruthy();
  expect(screen.getByText('areas:sleepQuality.title')).toBeTruthy();
  fireEvent.press(screen.getByText('areas:sleepQuality.title'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/dashboard/area/[areaId]', params: { areaId: 'sleepQuality' } });
});

it('also includes XP earned from goals', () => {
  mockStorage.nutritionXpClaims = { example: { tipId: 'example', xp: 10 } };
  const screen = render(<DashboardScreen />);
  expect(screen.getByText('common:dashboard.hiddenAreasXP')).toBeTruthy();
  fireEvent.press(screen.getByText('common:dashboard.hiddenAreasXP'));
  expect(screen.getByText('areas:sleepQuality.title')).toBeTruthy();
  expect(screen.getAllByText('10 XP')).toHaveLength(2);
});

it('hides the notice when hidden areas have no XP or all earned areas are selected', () => {
  const screen = render(<DashboardScreen />);
  expect(screen.queryByText('common:dashboard.hiddenAreasXP')).toBeNull();
  mockStorage.viewedTips = [{ tipId: 'example', xpEarned: 5 }];
  mockStorage.myAreas = ['energy', 'sleepQuality'];
  screen.rerender(<DashboardScreen />);
  expect(screen.queryByText('common:dashboard.hiddenAreasXP')).toBeNull();
});
