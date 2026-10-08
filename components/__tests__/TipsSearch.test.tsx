import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import TipsSearchScreen from '@/app/(tabs)/search';

const mockStorage = { myLevel: 2 };
const mockPush = jest.fn();
const mockParams = {};
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => mockStorage }));
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) }, useLocalSearchParams: () => mockParams }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { gradients: { sunrise: { locations1: [] } } } }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: any) => `${key}${options ? ':' + (options.level ?? options.count) : ''}` }),
}));
jest.mock('@/locales/tips', () => ({
  tips: [
    { id: 'basic', level: 1 },
    { id: 'current', level: 2 },
    { id: 'advanced', level: 3 },
    { id: 'hidden-a', level: 4 },
    { id: 'hidden-b', level: 4 },
    { id: 'hidden-c', level: 5 },
  ].map(tip => ({ ...tip, title: tip.id, descriptionKey: `${tip.id}.description`, areas: [{ id: 'energy' }] })),
}));
jest.mock('@/locales/bodyParts', () => ({ bodyParts: [] }));
jest.mock('../ThemedText', () => ({
  ThemedText: ({ children }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(require('react-native').Text, null, children);
  },
}));
jest.mock('../ui/Container', () => ({
  __esModule: true,
  default: ({ children }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(require('react-native').View, null, children);
  },
}));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/Card', () => ({
  Card: ({ children, title }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(
      require('react-native').View,
      null,
      title ? mockReact.createElement(require('react-native').Text, null, title) : null,
      children
    );
  },
}));
jest.mock('../ui/Badge', () => ({
  __esModule: true,
  default: ({ children, onPress }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(require('react-native').Pressable, { onPress }, children);
  },
}));
jest.mock('../ui/PressableCard', () => ({
  PressableCard: ({ children, onPress }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(require('react-native').Pressable, { onPress }, children);
  },
}));
jest.mock('../ui/LabeledInput', () => ({
  __esModule: true,
  default: ({ value, onChangeText }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(require('react-native').TextInput, { testID: 'search-input', value, onChangeText });
  },
}));

beforeEach(() => {
  mockStorage.myLevel = 2;
  mockPush.mockClear();
});

it('groups results by level, previews the next level with a lock, and counts hidden tips per level', () => {
  const { getByText, queryByText, getByRole, queryByRole } = render(<TipsSearchScreen />);
  expect(getByText('tips:current')).toBeTruthy();
  expect(getByText('tips:basic')).toBeTruthy();
  expect(getByRole('button', { name: 'common:tipsList.levelTitle:2 · common:tipsList.yourLevel' }).props.accessibilityState.expanded).toBe(true);
  expect(getByText('tips:basic')).toBeTruthy();
  expect(getByRole('button', { name: 'common:tipsList.levelTitle:1' }).props.accessibilityState.expanded).toBe(true);
  expect(getByRole('button', { name: 'common:tipsList.levelTitle:3 · common:tipsList.exploreNextLevel' }).props.accessibilityState.expanded).toBe(true);
  expect(getByText('🔒 tips:advanced')).toBeTruthy();
  fireEvent.press(getByText('🔒 tips:advanced'));
  expect(mockPush).not.toHaveBeenCalled();
  expect(getByText('🔒 common:tipsList.lockedTips:2')).toBeTruthy();
  expect(getByText('🔒 common:tipsList.lockedTips:1')).toBeTruthy();
  expect(queryByRole('button', { name: 'common:tipsList.levelTitle:4' })).toBeNull();
  expect(queryByText('tips:hidden-a')).toBeNull();
  expect(queryByText('tips:hidden-b')).toBeNull();
});

it('counts hidden search matches without revealing their title or description', () => {
  const { getByTestId, getByText, queryByText } = render(<TipsSearchScreen />);
  fireEvent.changeText(getByTestId('search-input'), 'hidden-a');
  expect(getByText('common:tipsList.levelTitle:4')).toBeTruthy();
  expect(getByText('🔒 common:tipsList.lockedTips:1')).toBeTruthy();
  expect(getByText('0 tips')).toBeTruthy();
  expect(queryByText('tips:hidden-a')).toBeNull();
  expect(queryByText('tips:hidden-a.description')).toBeNull();
  expect(queryByText('common:tipsList.levelTitle:5')).toBeNull();
});

it('updates level groups when the level changes and opens an unlocked tip', () => {
  const { getByText, queryByText, rerender } = render(<TipsSearchScreen />);
  fireEvent.press(getByText('tips:current'));
  expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ params: { tipId: 'current', expandAreas: '1' } }));
  mockStorage.myLevel = 3;
  rerender(<TipsSearchScreen />);
  expect(getByText('tips:advanced')).toBeTruthy();
  expect(getByText('tips:current')).toBeTruthy();
  expect(getByText('common:tipsList.levelTitle:4 · common:tipsList.exploreNextLevel')).toBeTruthy();
  mockStorage.myLevel = 1;
  rerender(<TipsSearchScreen />);
  expect(getByText('tips:basic')).toBeTruthy();
  expect(queryByText('tips:advanced')).toBeNull();
  expect(getByText('🔒 tips:current')).toBeTruthy();
});

it('puts the current level first and all remaining levels in ascending order', () => {
  const { getAllByText, rerender } = render(<TipsSearchScreen />);
  const levelOrder = () => getAllByText(/^common:tipsList.levelTitle:/).map(node => node.props.children);
  expect(levelOrder()).toEqual([
    'common:tipsList.levelTitle:2 · common:tipsList.yourLevel',
    'common:tipsList.levelTitle:1',
    'common:tipsList.levelTitle:3 · common:tipsList.exploreNextLevel',
    'common:tipsList.levelTitle:4',
    'common:tipsList.levelTitle:5',
  ]);
  mockStorage.myLevel = 3;
  rerender(<TipsSearchScreen />);
  expect(levelOrder()).toEqual([
    'common:tipsList.levelTitle:3 · common:tipsList.yourLevel',
    'common:tipsList.levelTitle:1',
    'common:tipsList.levelTitle:2',
    'common:tipsList.levelTitle:4 · common:tipsList.exploreNextLevel',
    'common:tipsList.levelTitle:5',
  ]);
});
