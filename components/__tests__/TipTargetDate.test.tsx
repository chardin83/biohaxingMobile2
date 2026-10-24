import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import TipTarget from '../TipTarget';

const mockPush = jest.fn();
jest.mock('@/app/i18n', () => ({ __esModule: true, default: { language: 'sv', t: (key: string) => key } }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'sv' } }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
const colors = { primary: 'green', textMuted: 'grey', overlayLight: 'white' };

beforeEach(() => mockPush.mockClear());

it.each(['daily', 'weekly'] as const)('opens %s target details for the journal date, including after changing day', period => {
  const target = { tag: 'fiber_total', unit: 'g' as const, period, amount: 30, actual: 10, isMet: false, label: 'Fiber' };
  const { getByRole, rerender } = render(<TipTarget tip={{ tipId: 'fiber', dateKey: '2026-10-23' }} target={target} colors={colors} />);
  fireEvent.press(getByRole('button'));
  expect(mockPush).toHaveBeenLastCalledWith(expect.objectContaining({ params: expect.objectContaining({ dateKey: '2026-10-23', targetPeriod: period }) }));
  rerender(<TipTarget tip={{ tipId: 'fiber', dateKey: '2026-10-22' }} target={target} colors={colors} />);
  fireEvent.press(getByRole('button'));
  expect(mockPush).toHaveBeenLastCalledWith(expect.objectContaining({ params: expect.objectContaining({ dateKey: '2026-10-22' }) }));
});
