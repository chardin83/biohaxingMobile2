import { act, render } from '@testing-library/react-native';
import React from 'react';

import { CountdownCircle } from '@/components/ui/CountdownCircle';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('awards only when the full reading time has passed', () => {
  const onComplete = jest.fn();
  const screen = render(<CountdownCircle seconds={5} color="#abcdef" onComplete={onComplete} />);
  act(() => jest.advanceTimersByTime(4000));
  expect(onComplete).not.toHaveBeenCalled();
  expect(screen.getByTestId('countdown-circle').props.accessibilityValue.now).toBe(1);
  act(() => jest.advanceTimersByTime(2000));
  expect(onComplete).toHaveBeenCalledTimes(1);
});

it('cancels the reward when the reading countdown is removed', () => {
  const onComplete = jest.fn();
  const screen = render(<CountdownCircle onComplete={onComplete} />);
  act(() => jest.advanceTimersByTime(2000));
  screen.unmount();
  act(() => jest.advanceTimersByTime(5000));
  expect(onComplete).not.toHaveBeenCalled();
});
