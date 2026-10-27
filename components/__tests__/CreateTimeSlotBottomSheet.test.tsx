import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';

import { getTimeSlotNameKey } from '@/utils/timeSlotName';

import CreateTimeSlotBottomSheet from '../CreateTimeSlotBottomSheet';

const mockSnapToIndex = jest.fn();

jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: mockReact.forwardRef(({ children }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ present: jest.fn(), dismiss: jest.fn(), snapToIndex: mockSnapToIndex }));
      return <View>{children}</View>;
    }),
    BottomSheetScrollView: View,
    BottomSheetBackdrop: () => null,
  };
});
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0 }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ui/CancelButton', () => ({ CancelButton: () => null }));
jest.mock('../ui/inputs/DateTimeInput', () => ({
  DateTimeInput: ({ onChange, onPickerOpenChange }: any) => {
    const { Button } = require('react-native');
    return (
      <>
        <Button title="Open clock" onPress={() => onPickerOpenChange(true)} />
        <Button title="Change to evening" onPress={() => onChange(new Date(2026, 9, 13, 20, 0))} />
      </>
    );
  },
}));
jest.mock('../ui/inputs/TextInput', () => ({
  __esModule: true,
  default: ({ value, onChangeText }: any) => {
    const { TextInput } = require('react-native');
    return <TextInput accessibilityLabel="Name" value={value} onChangeText={onChangeText} />;
  },
}));
jest.mock('../ui/AppButton', () => ({
  __esModule: true,
  default: ({ title, onPress, disabled }: any) => {
    const { Button } = require('react-native');
    return <Button title={title} onPress={onPress} disabled={disabled} />;
  },
}));

const props = { visible: true, onClose: jest.fn(), onCreate: jest.fn(), initialTime: new Date(2026, 9, 13, 8, 0) };

it.each([
  [0, 'night'],
  [4, 'night'],
  [5, 'morning'],
  [10, 'morning'],
  [11, 'lunch'],
  [14, 'lunch'],
  [15, 'dinner'],
  [17, 'dinner'],
  [18, 'evening'],
  [21, 'evening'],
  [22, 'night'],
] as const)('maps hour %s to %s', (hour, key) => {
  expect(getTimeSlotNameKey(new Date(2026, 9, 13, hour))).toBe(key);
});

it('updates the automatic name when the time changes and saves the selected time', async () => {
  const onCreate = jest.fn();
  const { getByLabelText, getByText } = render(<CreateTimeSlotBottomSheet {...props} onCreate={onCreate} />);
  expect(getByLabelText('Name').props.value).toBe('plan.defaultPlan.morning');
  fireEvent.press(getByText('Change to evening'));
  expect(getByLabelText('Name').props.value).toBe('plan.defaultPlan.evening');
  fireEvent.press(getByText('general.save'));
  await waitFor(() => expect(onCreate).toHaveBeenCalledWith({ name: 'plan.defaultPlan.evening', prefferedTime: '20:00', notify: false }));
});

it('preserves manually entered names through time changes', () => {
  const { getByLabelText, getByText } = render(<CreateTimeSlotBottomSheet {...props} />);
  fireEvent.changeText(getByLabelText('Name'), 'After exercise');
  fireEvent.press(getByText('Change to evening'));
  expect(getByLabelText('Name').props.value).toBe('After exercise');
});

it('preserves existing names and resets automatic naming when reopened for a new slot', () => {
  const { getByLabelText, getByText, rerender } = render(<CreateTimeSlotBottomSheet {...props} initialName="My routine" />);
  fireEvent.press(getByText('Change to evening'));
  expect(getByLabelText('Name').props.value).toBe('My routine');
  rerender(<CreateTimeSlotBottomSheet {...props} visible={false} />);
  rerender(<CreateTimeSlotBottomSheet {...props} />);
  expect(getByLabelText('Name').props.value).toBe('plan.defaultPlan.morning');
});

it('expands to the larger snap point when the clock opens on iPhone', () => {
  const originalOS = Platform.OS;
  Platform.OS = 'ios';
  mockSnapToIndex.mockClear();
  try {
    const { getByText } = render(<CreateTimeSlotBottomSheet {...props} />);
    fireEvent.press(getByText('Open clock'));
    expect(mockSnapToIndex).toHaveBeenCalledWith(1);
  } finally {
    Platform.OS = originalOS;
  }
});
