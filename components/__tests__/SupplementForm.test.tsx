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
jest.mock('../ui/DateTimeInput', () => ({ DateTimeInput: () => null }));
jest.mock('../ui/CancelButton', () => ({ CancelButton: () => null }));
jest.mock('../SupplementWarnings', () => ({ SupplementWarnings: () => null }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../SupplementsDropdown', () => ({
  __esModule: true,
  default: ({ disabled }: any) => {
    const { Text } = require('react-native');
    return <Text>{disabled ? 'locked' : 'unlocked'}</Text>;
  },
}));
jest.mock('../ui/LabeledInput', () => ({
  __esModule: true,
  LabeledInputRow: ({ children }: any) => children,
  default: ({ label, value, onChangeText }: any) => {
    const { TextInput } = require('react-native');
    return <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} />;
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
