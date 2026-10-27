import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { SleepBatchBottomSheet } from '../sections/metrics/SleepBatchBottomSheet';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../ui/inputs/DateTimeInput', () => ({ DateTimeInput: () => null }));
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View, TextInput } = require('react-native');
  return {
    __esModule: true,
    default: mockReact.forwardRef(({ children }: any, _ref: any) => <View>{children}</View>),
    BottomSheetScrollView: View,
    BottomSheetTextInput: TextInput,
  };
});

it('saves durations and notes through the shared inputs and save button', () => {
  const setMetricEntries = jest.fn();
  const onClose = jest.fn();
  const screen = render(
    <SleepBatchBottomSheet
      sheetIndex={0}
      bottomSheetRef={React.createRef()}
      colors={{}}
      setMetricEntries={setMetricEntries}
      metrics={Object.fromEntries(['sleep_bedtime', 'sleep_duration', 'deep_sleep', 'rem_sleep'].map(key => [key, { canonicalUnit: 'min' }]))}
      handleCloseSleepBatchSheet={onClose}
    />
  );
  fireEvent.changeText(screen.getAllByLabelText('sleepBatchBottomSheet.hours')[1], '1');
  fireEvent.changeText(screen.getAllByLabelText('sleepBatchBottomSheet.minutes')[2], '45');
  fireEvent.changeText(screen.getByLabelText('sleepBatchBottomSheet.notesLabel'), 'Sov bra');
  fireEvent.press(screen.getByRole('button', { name: 'general.save' }));
  const entries = setMetricEntries.mock.calls[0][0]([]);
  expect(entries.map((entry: any) => [entry.metricId, entry.value]).slice(1)).toEqual([
    ['sleep_duration', 480],
    ['deep_sleep', 60],
    ['rem_sleep', 45],
  ]);
  expect(entries.every((entry: any) => entry.notes === 'Sov bra')).toBe(true);
  expect(onClose).toHaveBeenCalledTimes(1);
});
