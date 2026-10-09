import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Notice from '@/components/ui/Notice';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: () => 'Förstått' }) }));
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: jest.fn(() => null) }));
beforeEach(() => jest.clearAllMocks());

it('shows a success message with a working journal action', () => {
  const openJournal = jest.fn();
  const dismiss = jest.fn();
  const screen = render(
    <Notice variant="success" showIcon={false} onDismiss={dismiss} dismissAccessibilityLabel="Stäng" title="Tillagd i planen!" message={'"Ät färgglada grönsaker" kan nu följas i din dagbok.'}>
      <Pressable accessibilityRole="button" onPress={openJournal}><Text>Visa dagbok</Text></Pressable>
    </Notice>
  );
  expect(screen.getByText('Tillagd i planen!')).toBeTruthy();
  expect(screen.getByText('"Ät färgglada grönsaker" kan nu följas i din dagbok.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Visa dagbok' }));
  expect(openJournal).toHaveBeenCalledTimes(1);
  expect(jest.mocked(IconSymbol).mock.calls.map(([props]) => props.name)).toEqual(['close']);
  fireEvent.press(screen.getByRole('button', { name: 'Stäng' }));
  expect(dismiss).toHaveBeenCalledTimes(1);
});

it('supports a custom calendar icon and the primary theme palette', () => {
  const screen = render(<Notice title="Bygg din träningsplan." message="Välj ett träningstips." variant="tutorial" iconName="calendarCheck" />);
  expect(screen.getByText('Bygg din träningsplan.')).toBeTruthy();
  expect(jest.mocked(IconSymbol).mock.calls[0][0]).toMatchObject({ name: 'calendarCheck', color: Colors.light.primary });
});

it('uses an acknowledgement with a check icon instead of the X button', () => {
  const onDismiss = jest.fn();
  const screen = render(<Notice message="Välj ett träningstips." variant="tutorial" onDismiss={onDismiss} />);
  expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
  expect(jest.mocked(IconSymbol).mock.calls.some(([props]) => props.name === 'check')).toBe(true);
  fireEvent.press(screen.getByRole('button', { name: 'Förstått' }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});


it('always provides a working understood button for tutorials without a dismiss handler', () => {
  const screen = render(<Notice message="Välj ett tips." variant="tutorial" />);
  fireEvent.press(screen.getByRole('button', { name: 'Förstått' }));
  expect(screen.queryByText('Välj ett tips.')).toBeNull();
});
