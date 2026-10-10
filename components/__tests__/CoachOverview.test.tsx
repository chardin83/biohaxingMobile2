import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import CoachOverview from '../CoachOverview';

const mockPresent = jest.fn();
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, values?: any) => values ? `${values.remaining} / ${values.total}` : key }) }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/ProgressbarWithLabel', () => ({ __esModule: true, default: ({ progress }: any) => require('react').createElement(require('react-native').View, { testID: 'quota-progress', progress }) }));
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: mockReact.forwardRef(({ children }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: jest.fn() }));
      return mockReact.createElement(View, null, children);
    }),
    BottomSheetScrollView: View,
  };
});

it('shows the remaining questions and opens premium information', () => {
  const screen = render(<CoachOverview remaining={1} total={3} onDiscoverPremium={mockPresent} />);
  expect(screen.getByText('1 / 3')).toBeTruthy();
  expect(screen.getByTestId('quota-progress').props.progress).toBeCloseTo(1 / 3);
  expect(screen.getByText('chat.questionsReset')).toBeTruthy();
  expect(screen.queryByText('chat.premiumTitle')).toBeNull();
  expect(screen.queryByRole('button', { name: 'chat.discoverPremium' })).toBeNull();
  screen.rerender(<CoachOverview remaining={0} total={3} onDiscoverPremium={mockPresent} />);
  expect(screen.queryByText('chat.weeklyQuestions')).toBeNull();
  expect(screen.queryByTestId('quota-progress')).toBeNull();
  expect(screen.getByText('chat.premiumTitle')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'chat.discoverPremium' }));
  expect(mockPresent).toHaveBeenCalledTimes(1);
});

it('allows closing the weekly and premium cards independently', () => {
  const screen = render(<CoachOverview remaining={1} total={3} onDiscoverPremium={mockPresent} />);
  fireEvent.press(screen.getByRole('button', { name: 'general.close' }));
  expect(screen.queryByText('chat.weeklyQuestions')).toBeNull();
  screen.rerender(<CoachOverview remaining={0} total={3} onDiscoverPremium={mockPresent} />);
  expect(screen.getByText('chat.premiumTitle')).toBeTruthy();
  fireEvent.press(screen.getAllByRole('button', { name: 'general.close' })[0]);
  expect(screen.queryByText('chat.premiumTitle')).toBeNull();
});
