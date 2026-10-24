import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import Journal from '@/app/(tabs)/journal';

const mockParams: Record<string, string> = {};
const mockScrollToElement = jest.fn();
const mockTarget = {};
let mockIsFocused = true;
let mockNextFrame: (() => void) | undefined;
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams }));
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockIsFocused, useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('../JournalComponent', () => ({ __esModule: true, default: () => null }));
jest.mock('../ui/Container', () => {
  const mockReact = require('react');
  return {
    __esModule: true,
    default: mockReact.forwardRef(({ children }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ scrollToElement: mockScrollToElement }));
      return mockReact.createElement(require('react-native').View, null, children);
    }),
  };
});
jest.mock('../journal/DayEdit', () => {
  const mockReact = require('react');
  const { Text, TouchableOpacity } = require('react-native');
  function MockDayEdit({ selectedDate, activeTab }: any) {
    const focus = mockReact.useContext(require('../journal/JournalGoalAnchor').JournalGoalFocusContext);
    return mockReact.createElement(TouchableOpacity, { onPress: () => focus.onFocus(mockTarget) },
      mockReact.createElement(Text, null, `${selectedDate}|${activeTab}|${focus.tipId}`));
  }
  return { __esModule: true, default: MockDayEdit };
});

beforeEach(() => {
  Object.keys(mockParams).forEach(key => delete mockParams[key]);
  mockScrollToElement.mockClear();
  mockIsFocused = true;
  mockNextFrame = undefined;
  jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(callback => {
    mockNextFrame = () => callback(0);
    return 1;
  });
  jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
});

it('opens the requested date and training tab and centers a goal once per navigation', () => {
  Object.assign(mockParams, { selectedDate: '2026-10-09', openTab: 'training', focusTipId: 'zone2_slow_running', focusRequestId: 'first' });
  const screen = render(<Journal />);
  act(() => mockNextFrame?.());
  const goal = screen.getByText('2026-10-09|training|zone2_slow_running');
  fireEvent.press(goal);
  fireEvent.press(goal);
  expect(mockScrollToElement).toHaveBeenCalledTimes(1);
  expect(mockScrollToElement).toHaveBeenCalledWith(mockTarget);

  Object.assign(mockParams, { selectedDate: '2026-10-10', openTab: 'other', focusTipId: 'box_breathing', focusRequestId: 'second' });
  screen.rerender(<Journal />);
  act(() => mockNextFrame?.());
  fireEvent.press(screen.getByText('2026-10-10|other|box_breathing'));
  expect(mockScrollToElement).toHaveBeenCalledTimes(2);
});

it('does not scroll to a goal on ordinary journal visits', () => {
  const screen = render(<Journal />);
  fireEvent.press(screen.getByText(/\|meal\|/));
  expect(mockScrollToElement).not.toHaveBeenCalled();
});

it('waits until the journal is focused and the next render frame before consuming a goal request', () => {
  mockIsFocused = false;
  Object.assign(mockParams, { selectedDate: '2026-10-09', openTab: 'meal', focusTipId: 'plant_diversity_30_week', focusRequestId: 'return-from-food' });
  const screen = render(<Journal />);
  fireEvent.press(screen.getByText(/2026-10-09/));
  expect(mockScrollToElement).not.toHaveBeenCalled();
  mockIsFocused = true;
  screen.rerender(<Journal />);
  fireEvent.press(screen.getByText(/2026-10-09/));
  expect(mockScrollToElement).not.toHaveBeenCalled();
  act(() => mockNextFrame?.());
  fireEvent.press(screen.getByText('2026-10-09|meal|plant_diversity_30_week'));
  expect(mockScrollToElement).toHaveBeenCalledTimes(1);
});
