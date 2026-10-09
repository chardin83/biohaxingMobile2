import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import ReadConfirmation from '@/components/ui/ReadConfirmation';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: ({ name }: any) => {
  const mockReact = require('react');
  return mockReact.createElement(require('react-native').Text, null, name);
} }));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('waits for reading time and manual confirmation before displaying the check', () => {
  const onConfirm = jest.fn();
  const screen = render(<ReadConfirmation read={false} active onConfirm={onConfirm} />);
  expect(screen.getByText('+5 XP')).toBeTruthy();
  expect(screen.queryByText('common:tipDetails.iHaveRead')).toBeNull();
  act(() => jest.advanceTimersByTime(5000));
  expect(onConfirm).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('common:tipDetails.iHaveRead'));
  expect(onConfirm).toHaveBeenCalledTimes(1);
  screen.rerender(<ReadConfirmation read active onConfirm={onConfirm} />);
  expect(screen.getByText('checkCircle')).toBeTruthy();
  expect(screen.queryByText('+5 XP')).toBeNull();
  expect(screen.queryByText('common:tipDetails.iHaveRead')).toBeNull();
});

it('does not count down while its sheet is closed', () => {
  const onConfirm = jest.fn();
  const screen = render(<ReadConfirmation read={false} active={false} onConfirm={onConfirm} />);
  act(() => jest.advanceTimersByTime(10000));
  expect(screen.queryByText('common:tipDetails.iHaveRead')).toBeNull();
  expect(onConfirm).not.toHaveBeenCalled();
});
