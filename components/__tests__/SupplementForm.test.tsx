import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import SupplementForm from '../SupplementForm';

const mockDismiss = jest.fn();
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: mockReact.forwardRef(({ children }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ present: jest.fn(), dismiss: mockDismiss }));
      return <View>{children}</View>;
    }),
    BottomSheetScrollView: View,
  };
});
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../ui/inputs/DateTimeInput', () => ({ DateTimeInput: () => null }));
jest.mock('../ui/CancelButton', () => ({ CancelButton: () => null }));
jest.mock('../SupplementWarnings', () => ({ SupplementWarnings: () => null }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../SupplementsDropdown', () => ({
  __esModule: true,
  default: ({ disabled, errorText, onSupplementSelect }: any) => {
    const { Text, Pressable } = require('react-native');
    return <Pressable accessibilityLabel="supplement" accessibilityHint={errorText} onPress={() => onSupplementSelect({ id: 'zinc', name: 'Zinc', quantity: '15', unit: 'mg' })}><Text>{disabled ? 'locked' : 'unlocked'}</Text></Pressable>;
  },
}));
jest.mock('../ui/inputs/TextInput', () => ({
  __esModule: true,
  TextInputRow: ({ children }: any) => children,
  default: ({ label, value, onChangeText, errorText }: any) => {
    const { TextInput } = require('react-native');
    return <TextInput accessibilityLabel={label} accessibilityHint={errorText} value={value} onChangeText={onChangeText} />;
  },
}));
jest.mock('../ui/AppButton', () => ({
  __esModule: true,
  default: ({ title, onPress, disabled }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onPress} disabled={disabled}>
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

const supplement = { id: 'zinc', name: 'Zinc', quantity: '15', unit: 'mg' };
const props = { selectedTime: new Date(), isEditing: false, preselectedSupplement: supplement, onCancel: jest.fn() };
beforeEach(() => jest.clearAllMocks());

it('locks the supplement while allowing a new quantity to be saved', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const { getByText, getByLabelText } = render(<SupplementForm {...props} lockSupplement onSave={onSave} />);
  expect(getByText('locked')).toBeTruthy();
  fireEvent.changeText(getByLabelText('supplementForm.dosage'), '10');
  fireEvent.press(getByText('general.add'));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith({ ...supplement, quantity: '10' }));
  await waitFor(() => expect(mockDismiss).toHaveBeenCalledTimes(1));
});

it('keeps the form open when saving fails', async () => {
  const onSave = jest.fn().mockResolvedValue(false);
  const { getByText } = render(<SupplementForm {...props} lockSupplement onSave={onSave} />);
  fireEvent.press(getByText('general.add'));
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  expect(mockDismiss).not.toHaveBeenCalled();
});

it('keeps supplement selection available for ordinary new plan entries', () => {
  const { getByText } = render(<SupplementForm {...props} onSave={jest.fn()} />);
  expect(getByText('unlocked')).toBeTruthy();
});

it('validates missing supplement, dosage and unit on save, then accepts a selected supplement', async () => {
  const onSave = jest.fn();
  const screen = render(<SupplementForm {...props} preselectedSupplement={null} onSave={onSave} />);
  fireEvent.press(screen.getByText('general.add'));
  expect(onSave).not.toHaveBeenCalled();
  for (const label of ['supplement', 'supplementForm.dosage', 'supplementForm.unit']) {
    expect(screen.getByLabelText(label).props.accessibilityHint).toBe('labeledInput.requiredError');
  }
  fireEvent.press(screen.getByLabelText('supplement'));
  expect(screen.getByLabelText('supplement').props.accessibilityHint).toBeUndefined();
  fireEvent.press(screen.getByText('general.add'));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(supplement));
});

it.each(['', '0', '-1', '12abc', 'Infinity'])('rejects invalid dosage %s', value => {
  const onSave = jest.fn();
  const screen = render(<SupplementForm {...props} onSave={onSave} />);
  fireEvent.changeText(screen.getByLabelText('supplementForm.dosage'), value);
  fireEvent.press(screen.getByText('general.add'));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByLabelText('supplementForm.dosage').props.accessibilityHint).toBeTruthy();
});

it('requires a unit and allows the full missing unit to be entered', async () => {
  const onSave = jest.fn();
  const screen = render(<SupplementForm {...props} preselectedSupplement={{ ...supplement, unit: '' }} onSave={onSave} />);
  fireEvent.press(screen.getByText('general.add'));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByLabelText('supplementForm.unit').props.accessibilityHint).toBe('labeledInput.requiredError');
  fireEvent.changeText(screen.getByLabelText('supplementForm.unit'), 'm');
  fireEvent.changeText(screen.getByLabelText('supplementForm.unit'), 'mg');
  fireEvent.press(screen.getByText('general.add'));
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(supplement));
});
