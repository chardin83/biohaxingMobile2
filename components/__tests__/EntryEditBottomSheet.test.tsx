import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import EntryEditBottomSheet from '../journal/EntryEditBottomSheet';

const mockPresent = jest.fn();
const mockDismiss = jest.fn();
afterEach(() => jest.restoreAllMocks());

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/inputs/DateTimeInput', () => ({ DateTimeInput: () => null }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View, TextInput } = require('react-native');
  return {
    BottomSheetModal: mockReact.forwardRef(({ children }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss }));
      return <View>{children}</View>;
    }),
    BottomSheetScrollView: View,
    BottomSheetTextInput: TextInput,
  };
});

it('blocks empty and whitespace names, then saves after correction', () => {
  const onSave = jest.fn();
  const props = { visible: true, title: 'Redigera måltid', nameLabel: 'Måltidsnamn', timeLabel: 'Tid', recordedAt: new Date(), onNameChange: jest.fn(), onRecordedAtChange: jest.fn(), onClose: jest.fn(), onSave };
  const screen = render(<EntryEditBottomSheet {...props} name="" />);
  expect(screen.queryByText('labeledInput.requiredError')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Måltidsnamn · labeledInput.required').props.accessibilityHint).toBe('labeledInput.requiredError');
  expect(screen.queryByText('labeledInput.requiredError')).toBeNull();
  screen.rerender(<EntryEditBottomSheet {...props} name="   " />);
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  expect(onSave).not.toHaveBeenCalled();
  screen.rerender(<EntryEditBottomSheet {...props} name="Lunch" />);
  expect(screen.queryByText('labeledInput.requiredError')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  expect(onSave).toHaveBeenCalledTimes(1);
});

it('requires a valid meal time, including midnight', () => {
  const onSave = jest.fn();
  const props = { visible: true, title: 'Redigera måltid', nameLabel: 'Måltidsnamn', timeLabel: 'Måltidstid', name: 'Lunch', onNameChange: jest.fn(), onRecordedAtChange: jest.fn(), onClose: jest.fn(), onSave };
  const screen = render(<EntryEditBottomSheet {...props} recordedAt={new Date(Number.NaN)} />);
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  expect(onSave).not.toHaveBeenCalled();
  const midnight = new Date(2026, 9, 27, 0, 0);
  screen.rerender(<EntryEditBottomSheet {...props} recordedAt={midnight} />);
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  expect(onSave).toHaveBeenCalledTimes(1);
});

it('presents and dismisses the bottom sheet from visibility and uses the shared cancel action', () => {
  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => { callback(0); return 1; });
  mockPresent.mockClear();
  mockDismiss.mockClear();
  const onClose = jest.fn();
  const props = { title: 'Redigera måltid', nameLabel: 'Måltidsnamn', timeLabel: 'Måltidstid', name: 'Lunch', recordedAt: new Date(), onNameChange: jest.fn(), onRecordedAtChange: jest.fn(), onClose, onSave: jest.fn() };
  const screen = render(<EntryEditBottomSheet {...props} visible />);
  expect(mockPresent).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByRole('button', { name: 'general.cancel' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  screen.rerender(<EntryEditBottomSheet {...props} visible={false} />);
  expect(mockDismiss).toHaveBeenCalledTimes(1);
});
