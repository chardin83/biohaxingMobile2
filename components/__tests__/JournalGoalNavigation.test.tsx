import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import Journal from '@/app/(tabs)/journal';

const mockParams: Record<string, string> = {};
const mockScrollToElement = jest.fn();
const mockTarget = {};
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
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
});

it('opens the requested date and training tab and centers a goal once per navigation', () => {
  Object.assign(mockParams, { selectedDate: '2026-10-09', openTab: 'training', focusTipId: 'zone2_slow_running', focusRequestId: 'first' });
  const screen = render(<Journal />);
  const goal = screen.getByText('2026-10-09|training|zone2_slow_running');
  fireEvent.press(goal);
  fireEvent.press(goal);
  expect(mockScrollToElement).toHaveBeenCalledTimes(1);
  expect(mockScrollToElement).toHaveBeenCalledWith(mockTarget);

  Object.assign(mockParams, { selectedDate: '2026-10-10', openTab: 'other', focusTipId: 'box_breathing', focusRequestId: 'second' });
  screen.rerender(<Journal />);
  fireEvent.press(screen.getByText('2026-10-10|other|box_breathing'));
  expect(mockScrollToElement).toHaveBeenCalledTimes(2);
});

it('does not scroll to a goal on ordinary journal visits', () => {
  const screen = render(<Journal />);
  fireEvent.press(screen.getByText(/\|meal\|/));
  expect(mockScrollToElement).not.toHaveBeenCalled();
});
