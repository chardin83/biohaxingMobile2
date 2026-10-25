import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import TipTitleLink from '@/components/journal/TipTitleLink';
import { IconSymbol } from '@/components/ui/IconSymbol';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { primary: '#00abcd', text: '#111111' } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: jest.fn(() => null) }));
jest.mock('@/components/ui/TipDetailsBottomSheet', () => ({ tipId, onDismiss }: any) => {
  const { Text, Pressable, View } = require('react-native');
  return (
    <View>
      <Text>{`Information: ${tipId}`}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Stäng" onPress={onDismiss}>
        <Text>Stäng</Text>
      </Pressable>
    </View>
  );
});

beforeEach(() => jest.clearAllMocks());

it('opens the existing info sheet for the selected tip and can reopen it after dismissal', () => {
  const screen = render(<TipTitleLink tipId="protein_rotation" title="Variera ditt protein" />);
  expect(screen.queryByText('Information: protein_rotation')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Variera ditt protein' }));
  expect(screen.getByText('Information: protein_rotation')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Stäng' }));
  expect(screen.queryByText('Information: protein_rotation')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Variera ditt protein' }));
  expect(screen.getByText('Information: protein_rotation')).toBeTruthy();
});

it('keeps the title in the normal text color and only colors the chevron primary', () => {
  const screen = render(<TipTitleLink tipId="protein_rotation" title="Variera ditt protein" />);
  expect(StyleSheet.flatten(screen.getByText('Variera ditt protein').props.style).color).toBe('#111111');
  expect(jest.mocked(IconSymbol).mock.calls[0][0]).toMatchObject({ name: 'chevron.right', color: '#00abcd' });
});

it('opens the information for the correct title when several tips are displayed', () => {
  const screen = render(
    <>
      <TipTitleLink tipId="protein_rotation" title="Protein" />
      <TipTitleLink tipId="zone2_slow_running" title="Träning" />
    </>
  );
  fireEvent.press(screen.getByRole('button', { name: 'Träning' }));
  expect(screen.getByText('Information: zone2_slow_running')).toBeTruthy();
  expect(screen.queryByText('Information: protein_rotation')).toBeNull();
});
