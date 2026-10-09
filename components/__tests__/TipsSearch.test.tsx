import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import TipsSearchScreen from '@/app/(tabs)/search';

const mockStorage = { myLevel: 2, plans: { training: [{ tipId: 'current' }], nutrition: [], other: [], supplements: [] } };
const mockTranslate = jest.fn((key: string, options?: any) => `${key}${options ? ':' + (options.level ?? options.count) : ''}`);
const mockPush = jest.fn();
const mockParams: { planCategories?: string; targetPeriods?: string; goalIntro?: string; fromPlan?: string; inPlan?: string; filterRequestId?: string } = {};
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => mockStorage }));
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) }, useLocalSearchParams: () => mockParams }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light, dark: false }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockTranslate }),
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
jest.mock('../ui/Container', () => ({
  __esModule: true,
  default: ({ children }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(require('react-native').View, null, children);
  },
}));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/LabeledInput', () => ({
  __esModule: true,
  default: ({ value, onChangeText }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(require('react-native').TextInput, { testID: 'search-input', value, onChangeText });
  },
}));

beforeEach(() => {
  mockStorage.myLevel = 2;
  mockTranslate.mockClear();
  mockPush.mockClear();
  delete mockParams.planCategories;
  delete mockParams.targetPeriods;
  delete mockParams.goalIntro;
  delete mockParams.fromPlan;
  delete mockParams.inPlan;
  delete mockParams.filterRequestId;
});

it('defaults add-goal searches to unplanned tips and reapplies it on a new add request', () => {
  Object.assign(mockParams, { inPlan: 'no', filterRequestId: 'first' });
  const screen = render(<TipsSearchScreen />);
  expect(screen.queryByText('tips:current')).toBeNull();
  expect(screen.getByText('tips:basic')).toBeTruthy();
  expect(screen.getByText('common:filter.inPlan: common:filter.no')).toBeTruthy();
  fireEvent.press(screen.getByText('common:filter.clearAll'));
  expect(screen.getByText('tips:current')).toBeTruthy();
  mockParams.filterRequestId = 'second';
  screen.rerender(<TipsSearchScreen />);
  expect(screen.queryByText('tips:current')).toBeNull();
});

it('preserves the plan origin when opening a tip from search', () => {
  mockParams.fromPlan = '1';
  const screen = render(<TipsSearchScreen />);
  fireEvent.press(screen.getByText('tips:current'));
  expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ params: { tipId: 'current', expandAreas: '1', fromPlan: '1' } }));
});

it('filters planned and unplanned tips and clears the plan filter', () => {
  const screen = render(<TipsSearchScreen />);
  fireEvent.press(screen.getByText('Filter'));
  fireEvent.press(screen.getByText('common:filter.yes'));
  expect(screen.getByText('tips:current')).toBeTruthy();
  expect(screen.queryByText('tips:basic')).toBeNull();
  fireEvent.press(screen.getByText('common:filter.no'));
  expect(screen.queryByText('tips:current')).toBeNull();
  expect(screen.getByText('tips:basic')).toBeTruthy();
  fireEvent.press(screen.getByText('common:filter.clearAll'));
  expect(screen.getByText('tips:current')).toBeTruthy();
  expect(screen.getByText('tips:basic')).toBeTruthy();
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
  expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ params: { tipId: 'advanced', expandAreas: '1' } }));
  expect(getByText('🔒 common:tipsList.lockedTips:2')).toBeTruthy();
  expect(getByText('🔒 common:tipsList.lockedTips:1')).toBeTruthy();
  expect(queryByRole('button', { name: 'common:tipsList.levelTitle:4' })).toBeNull();
  expect(queryByText('tips:hidden-a')).toBeNull();
  expect(queryByText('tips:hidden-b')).toBeNull();
});

it('shows the training introduction below filters when opened from a goal link', () => {
  Object.assign(mockParams, { planCategories: 'training', targetPeriods: 'daily,weekly', goalIntro: 'training' });
  const screen = render(<TipsSearchScreen />);
  expect(screen.getByText('common:search.goalIntro.training.title')).toBeTruthy();
  expect(screen.getByText('common:search.goalIntro.training.message')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'general.understood' }));
  expect(screen.queryByText('common:search.goalIntro.training.title')).toBeNull();
});

it('does not show a plan introduction for ordinary searches', () => {
  mockParams.planCategories = 'training';
  const screen = render(<TipsSearchScreen />);
  expect(screen.queryByText('common:search.goalIntro.training.title')).toBeNull();
});

it.each(['daily', 'weekly'])('shows the same introduction for a journal %s goal link', period => {
  Object.assign(mockParams, { planCategories: 'training', targetPeriods: period, goalIntro: 'training' });
  const screen = render(<TipsSearchScreen />);
  expect(screen.getByText('common:search.goalIntro.training.title')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'general.understood' })).toBeTruthy();
});

it('hides an outdated introduction when the category changes', () => {
  Object.assign(mockParams, { planCategories: 'training', goalIntro: 'training' });
  const screen = render(<TipsSearchScreen />);
  expect(screen.getByText('common:search.goalIntro.training.title')).toBeTruthy();
  mockParams.planCategories = 'nutrition';
  screen.rerender(<TipsSearchScreen />);
  expect(screen.queryByText('common:search.goalIntro.training.title')).toBeNull();
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
  expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/dashboard/area/energy/details', params: { tipId: 'current', expandAreas: '1' } }));
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


it('opens an unlocked result through the real card after entering a search query', () => {
  const screen = render(<TipsSearchScreen />);
  fireEvent.changeText(screen.getByTestId('search-input'), 'current');
  fireEvent.press(screen.getByText('tips:current'));
  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/dashboard/area/energy/details',
    params: { tipId: 'current', expandAreas: '1' },
  });
});
