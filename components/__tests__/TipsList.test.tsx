import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { VerdictValue } from '@/types/verdict';

import TipsList from '../ui/TipsList';

const mockPush = jest.fn();
const mockStorage = { myLevel: 3, viewedTips: [] as any[], nutritionXpClaims: {} };
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => mockStorage }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: any) => `${key}${options ? ':' + (options.level ?? options.count) : ''}` }),
}));
jest.mock('@/locales/tips', () => ({
  tips: [
    { id: 'lower', level: 1 },
    { id: 'current', level: 3 },
    { id: 'next', level: 4 },
    { id: 'future-a', level: 5 },
    { id: 'future-b', level: 5 },
    { id: 'future-c', level: 6 },
  ].map(tip => ({ ...tip, areas: [{ id: 'energy' }] })),
}));
jest.mock('../ThemedText', () => ({
  ThemedText: ({ children }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(require('react-native').Text, null, children);
  },
}));
jest.mock('../ui/Card', () => ({
  Card: ({ title, children }: any) => {
    const mockReact = require('react');
    const { View, Text } = require('react-native');
    return mockReact.createElement(View, { testID: title }, mockReact.createElement(Text, null, title), children);
  },
}));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/TipCard', () => ({
  __esModule: true,
  default: ({ tip, locked, onPress }: any) => {
    const mockReact = require('react');
    const { Pressable, Text } = require('react-native');
    return mockReact.createElement(Pressable, { onPress }, mockReact.createElement(Text, null, `${locked ? '🔒 ' : ''}${tip.id}`));
  },
}));

beforeEach(() => {
  mockPush.mockClear();
  mockStorage.myLevel = 3;
  mockStorage.viewedTips = [];
});

it('shows unlocked tips and the next level, then counts higher levels without revealing their tips', () => {
  const { getByText, queryByText, rerender } = render(<TipsList areaId="energy" />);
  fireEvent.press(getByText('tipsList.levelTitle:1'));
  expect(getByText('lower')).toBeTruthy();
  expect(getByText('current')).toBeTruthy();
  fireEvent.press(getByText('tipsList.levelTitle:4 · tipsList.exploreNextLevel'));
  expect(getByText('🔒 next')).toBeTruthy();
  expect(queryByText('🔒 future-a')).toBeNull();
  expect(getByText('tipsList.levelTitle:5')).toBeTruthy();
  fireEvent.press(getByText('tipsList.levelTitle:5'));
  expect(getByText('🔒 tipsList.lockedTips:2')).toBeTruthy();
  expect(getByText('tipsList.levelTitle:6')).toBeTruthy();
  mockStorage.myLevel = 4;
  rerender(<TipsList areaId="energy" />);
  expect(getByText('next')).toBeTruthy();
  fireEvent.press(getByText('tipsList.levelTitle:5 · tipsList.exploreNextLevel'));
  expect(getByText('🔒 future-a')).toBeTruthy();
  expect(queryByText('tipsList.levelTitle:5 · tipsList.exploreNextLevel')).toBeTruthy();
});

it('opens the selected tip after verdict filtering and keeps higher levels hidden when showing all', () => {
  mockStorage.viewedTips = [{ tipId: 'lower', verdict: VerdictValue.NotInterested, askedQuestions: [], xpEarned: 0 }];
  const { getByText, queryByText } = render(<TipsList areaId="energy" />);
  expect(queryByText('lower')).toBeNull();
  fireEvent.press(getByText('current'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/dashboard/area/[areaId]/details', params: { areaId: 'energy', tipId: 'current' } });
  fireEvent.press(getByText('tipsList.showAll:1'));
  fireEvent.press(getByText('tipsList.levelTitle:1'));
  expect(getByText('lower')).toBeTruthy();
  expect(queryByText('🔒 future-a')).toBeNull();
  expect(getByText('tipsList.levelTitle:5')).toBeTruthy();
});

it('starts with only the current level expanded and lets each level toggle', () => {
  const { getByRole, getByText, queryByText } = render(<TipsList areaId="energy" />);
  expect(getByRole('button', { name: 'tipsList.levelTitle:3 · tipsList.yourLevel' }).props.accessibilityState.expanded).toBe(true);
  for (const title of ['tipsList.levelTitle:1', 'tipsList.levelTitle:4 · tipsList.exploreNextLevel', 'tipsList.levelTitle:5', 'tipsList.levelTitle:6']) {
    expect(getByRole('button', { name: title }).props.accessibilityState.expanded).toBe(false);
  }
  expect(getByText('current')).toBeTruthy();
  expect(queryByText('lower')).toBeNull();
  expect(queryByText('🔒 next')).toBeNull();
  fireEvent.press(getByText('tipsList.levelTitle:1'));
  expect(getByText('lower')).toBeTruthy();
  fireEvent.press(getByText('tipsList.levelTitle:1'));
  expect(queryByText('lower')).toBeNull();
  fireEvent.press(getByText('tipsList.levelTitle:3 · tipsList.yourLevel'));
  expect(queryByText('current')).toBeNull();
});
