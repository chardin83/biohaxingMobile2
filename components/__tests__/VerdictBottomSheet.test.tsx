import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import VerdictBottomSheet from '../VerdictBottomSheet';

const mockPresent = jest.fn();
const mockDismiss = jest.fn();
let mockModalProps: any;
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: mockReact.forwardRef((props: any, ref: any) => {
      mockModalProps = props;
      mockReact.useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss }));
      return mockReact.createElement(View, null, props.children);
    }),
    BottomSheetView: View,
    BottomSheetBackdrop: () => null,
  };
});
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../VerdictSelector', () => ({
  __esModule: true,
  default: ({ onVerdictPress }: any) => {
    const mockReact = require('react');
    const { Pressable, Text } = require('react-native');
    return mockReact.createElement(Pressable, { onPress: () => onVerdictPress('interested') }, mockReact.createElement(Text, null, 'Choose verdict'));
  },
}));

it('starts without presenting and dismisses after choosing a verdict', () => {
  const ref = React.createRef<any>();
  const onVerdictPress = jest.fn();
  const onDismiss = jest.fn();
  const { getByText } = render(<VerdictBottomSheet verdictSheetRef={ref} colors={{}} onVerdictPress={onVerdictPress} onDismiss={onDismiss} />);
  expect(mockPresent).not.toHaveBeenCalled();
  expect(mockModalProps.enableDynamicSizing).toBe(false);
  expect(mockModalProps.onDismiss).toBe(onDismiss);
  fireEvent.press(getByText('Choose verdict'));
  expect(onVerdictPress).toHaveBeenCalledWith('interested');
  expect(mockDismiss).toHaveBeenCalledTimes(1);
});
