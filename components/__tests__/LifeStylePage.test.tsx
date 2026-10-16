import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import LifeStylePage from '@/app/(stack)/lifestyle';
import { toDateKey } from '@/utils/dateUtils';

const mockSave = jest.fn().mockResolvedValue(undefined);
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'sv' } }) }));
jest.mock('@/components/ui/Container', () => {
  const { View } = require('react-native');
  return ({ children }: any) => <View>{children}</View>;
});
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({
  lifeStyleLog: {}, lifeStyleLoading: false, logLifeStyleEntry: mockSave,
}) }));

beforeEach(() => mockSave.mockReset().mockResolvedValue(undefined));

it('saves yes and no for the selected day and navigates back to today', async () => {
  const screen = render(<LifeStylePage />);
  fireEvent.press(screen.getByLabelText('common:lifeStyle.items.dimmedLights: common:filter.no'));
  await waitFor(() => expect(mockSave).toHaveBeenCalledWith(toDateKey(new Date()), 'dimmedLights', false));
  await waitFor(() => expect(screen.getByLabelText('common:lifeStyle.items.dimmedLights: common:filter.no').props.accessibilityState.disabled).toBe(false));
  fireEvent.press(screen.getByText('‹'));
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  fireEvent.press(screen.getByLabelText('common:lifeStyle.items.calmActivity: common:filter.yes'));
  await waitFor(() => expect(mockSave).toHaveBeenCalledWith(toDateKey(yesterday), 'calmActivity', true));
  fireEvent.press(screen.getByText('›'));
  await waitFor(() => expect(screen.getByLabelText('common:lifeStyle.items.calmActivity: common:filter.no').props.accessibilityState.disabled).toBe(false));
  fireEvent.press(screen.getByText('›'));
  fireEvent.press(screen.getByLabelText('common:lifeStyle.items.calmActivity: common:filter.no'));
  await waitFor(() => expect(mockSave).toHaveBeenLastCalledWith(toDateKey(new Date()), 'calmActivity', false));
});

it('shows a save error and lets the user retry', async () => {
  mockSave.mockRejectedValueOnce(new Error('Storage failed'));
  const screen = render(<LifeStylePage />);
  fireEvent.press(screen.getByLabelText('common:lifeStyle.items.reducedScreens: common:filter.yes'));
  await waitFor(() => expect(screen.getByText('common:lifeStyle.saveError')).toBeTruthy());
  fireEvent.press(screen.getByLabelText('common:lifeStyle.items.reducedScreens: common:filter.no'));
  await waitFor(() => expect(screen.queryByText('common:lifeStyle.saveError')).toBeNull());
  expect(mockSave).toHaveBeenLastCalledWith(toDateKey(new Date()), 'reducedScreens', false);
});
