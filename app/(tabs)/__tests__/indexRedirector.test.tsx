import { render } from '@testing-library/react-native';
import React from 'react';

import IndexRedirector from '../index';

const mockReplace = jest.fn();
let mockFocused = false;
let mockStep = 5;
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockFocused, useTheme: () => ({ colors: {} }) }));
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ hasCompletedOnboarding: true, isInitialized: true, onboardingStep: mockStep }) }));

beforeEach(() => {
  jest.clearAllMocks();
  mockFocused = false;
  mockStep = 5;
});
it('does not override health configuration navigation when onboarding status changes offscreen', () => {
  const screen = render(<IndexRedirector />);
  mockStep = 7;
  screen.rerender(<IndexRedirector />);
  expect(mockReplace).not.toHaveBeenCalled();
});
it('redirects to the dashboard only when the entry screen is focused', () => {
  mockFocused = true;
  const screen = render(<IndexRedirector />);
  expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  mockReplace.mockClear();
  mockFocused = false;
  mockStep = 7;
  screen.rerender(<IndexRedirector />);
  expect(mockReplace).not.toHaveBeenCalled();
});
