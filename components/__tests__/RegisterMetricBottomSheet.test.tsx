import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { RegisterMetricBottomSheet } from '../RegisterMetricBottomSheet';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../ui/inputs/DateTimeInput', () => ({ DateTimeInput: () => null }));
jest.mock('../ui/inputs/BottomSheetTextInput', () => ({ label, errorText }: any) => {
  const { TextInput } = require('react-native');
  return <TextInput accessibilityLabel={label} accessibilityHint={errorText} />;
});
jest.mock('../ui/Notice', () => ({ __esModule: true, default: ({ message }: any) => <>{message}</> }));
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: mockReact.forwardRef(({ children, enablePanDownToClose }: any, _ref: any) => <View testID="sheet" enablePanDownToClose={enablePanDownToClose}>{children}</View>),
    BottomSheetScrollView: View,
  };
});

function props(onSave: () => Promise<void>) {
  return {
    bottomSheetRef: React.createRef<any>(), isVisible: true, metricValue: '10', setMetricValue: jest.fn(),
    metricUnit: 'kg', setMetricUnit: jest.fn(), metricNotes: '', setMetricNotes: jest.fn(), recordedAt: new Date(),
    setRecordedAt: jest.fn(), colors: {}, onSave, onClose: jest.fn(),
  };
}

it('blocks save, cancel and swipe dismissal until the actual save completes', async () => {
  let complete!: () => void;
  const onSave = jest.fn(() => new Promise<void>(resolve => { complete = resolve; }));
  const options = props(onSave);
  const screen = render(<RegisterMetricBottomSheet {...options} />);
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  expect(screen.getByRole('button', { name: 'general.save' }).props.accessibilityState.busy).toBe(true);
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  fireEvent.press(screen.getByRole('button', { name: 'general.cancel' }));
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(options.onClose).not.toHaveBeenCalled();
  expect(screen.getByTestId('sheet').props.enablePanDownToClose).toBe(false);
  await act(async () => complete());
  expect(screen.getByRole('button', { name: 'general.cancel' }).props.accessibilityState.disabled).toBe(false);
  expect(screen.getByTestId('sheet').props.enablePanDownToClose).toBe(true);
});

it('releases the controls after a failed save', async () => {
  const screen = render(<RegisterMetricBottomSheet {...props(jest.fn().mockRejectedValue(new Error('failed')))} />);
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'general.save' })));
  expect(screen.getByRole('button', { name: 'general.save' }).props.accessibilityState.busy).toBe(false);
  expect(screen.getByRole('button', { name: 'general.cancel' }).props.accessibilityState.disabled).toBe(false);
});

it.each(['', ' ', 'NaN', '12abc', 'Infinity'])('rejects invalid required value %s and marks the value field', async metricValue => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const screen = render(<RegisterMetricBottomSheet {...props(onSave)} metricValue={metricValue} />);
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'general.save' })));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByLabelText('registration.value').props.accessibilityHint).toBe('registration.valueError');
});

it('requires a unit and clears validation after correcting it', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const options = props(onSave);
  const screen = render(<RegisterMetricBottomSheet {...options} metricUnit="" />);
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'general.save' })));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByLabelText('registration.unit').props.accessibilityHint).toBe('registration.unitError');
  screen.rerender(<RegisterMetricBottomSheet {...options} metricValue="10,5" />);
  expect(screen.getByLabelText('registration.unit').props.accessibilityHint).toBeUndefined();
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'general.save' })));
  expect(onSave).toHaveBeenCalledTimes(1);
});

it.each([
  ['sleep_duration', '1440', true],
  ['sleep_duration', '1441', false],
  ['deep_sleep', '-1', false],
  ['rem_sleep', '1.5', false],
  ['sleep_bedtime', '0', true],
  ['sleep_bedtime', '1439', true],
  ['sleep_bedtime', '1440', false],
] as const)('preserves the validation limits for %s = %s', async (metricId, metricValue, valid) => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const screen = render(<RegisterMetricBottomSheet {...props(onSave)} metricId={metricId} metricValue={metricValue} metricUnit="" />);
  await act(async () => fireEvent.press(screen.getByRole('button', { name: 'general.save' })));
  expect(onSave).toHaveBeenCalledTimes(valid ? 1 : 0);
});

it('uses radio options for distinct units and forwards the selected unit', () => {
  const options = props(jest.fn().mockResolvedValue(undefined));
  const screen = render(<RegisterMetricBottomSheet {...options} units={[{ unit: 'kg', system: 'metric' }, { unit: 'lb', system: 'imperial' }, { unit: 'kg', system: 'duplicate' }]} />);
  expect(screen.getByRole('radio', { name: 'registration.unit: units.kg (metric)', checked: true })).toBeTruthy();
  expect(screen.getAllByRole('radio')).toHaveLength(2);
  fireEvent.press(screen.getByRole('radio', { name: 'registration.unit: units.lb (imperial)' }));
  expect(options.setMetricUnit).toHaveBeenCalledWith('lb');
});
