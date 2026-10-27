import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { RegisterHabitValueBottomSheet } from '../journal/RegisterHabitValueBottomSheet';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View, TextInput } = require('react-native');
  return { BottomSheetModal: mockReact.forwardRef(({ children }: any, _ref: any) => <View>{children}</View>), BottomSheetScrollView: View, BottomSheetTextInput: TextInput };
});

function setup(initialValue?: number) {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const screen = render(<RegisterHabitValueBottomSheet bottomSheetRef={React.createRef()} isVisible title="Vana" unit="min" initialValue={initialValue} onSave={onSave} onClose={onClose} />);
  const input = () => screen.getByLabelText('journal:otherLoggerTab.registerToday · labeledInput.required');
  return { screen, onSave, onClose, input };
}

it('allows saving an empty field to trigger validation and clears the error after correction', () => {
  const { screen, input, onSave, onClose } = setup();
  expect(input().props.accessibilityHint).toBeUndefined();
  fireEvent.press(screen.getByRole('button', { name: 'general.save', disabled: false }));
  expect(onSave).not.toHaveBeenCalled();
  expect(input().props.accessibilityHint).toBe('labeledInput.requiredError');
  fireEvent.changeText(input(), '2,5');
  expect(input().props.accessibilityHint).toBeUndefined();
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  expect(onSave).toHaveBeenCalledWith(2.5);
  fireEvent.press(screen.getByRole('button', { name: 'general.cancel' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it.each(['-1', '12abc', 'Infinity'])('rejects invalid value %s', value => {
  const { screen, input, onSave } = setup();
  fireEvent.changeText(input(), value);
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  expect(onSave).not.toHaveBeenCalled();
  expect(input().props.accessibilityHint).toBe('journal:otherLoggerTab.invalidValue');
});

it('preserves and accepts a previously registered zero', () => {
  const { screen, input, onSave } = setup(0);
  expect(input().props.value).toBe('0');
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  expect(onSave).toHaveBeenCalledWith(0);
});
