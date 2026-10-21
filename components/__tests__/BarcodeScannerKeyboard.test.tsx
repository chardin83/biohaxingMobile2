import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Keyboard } from 'react-native';

import { getProductByBarcode } from '@/services/openFoodFacts';

import BarcodeScannerBottomSheet from '../journal/BarcodeScannerBottomSheet';

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View, ScrollView, TextInput } = require('react-native');
  return {
    BottomSheetModal: React.forwardRef(({ children, ...props }: any, ref: any) => <View {...props}>{children}</View>),
    BottomSheetBackdrop: View,
    BottomSheetScrollView: ScrollView,
    BottomSheetTextInput: TextInput,
  };
});
jest.mock('expo-camera', () => ({ CameraView: () => null, useCameraPermissions: () => [{ granted: true }, jest.fn()] }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('@/services/openFoodFacts', () => ({ getProductByBarcode: jest.fn() }));

it('lets the user close the numeric keyboard and search the entered barcode', async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  const product = { barcode: '90162602', name: 'Red Bull' };
  jest.mocked(getProductByBarcode).mockResolvedValue(product as any);
  const found = jest.fn();
  const screen = render(<BarcodeScannerBottomSheet onProductFound={found} />);
  fireEvent.changeText(screen.getByLabelText('journal:nutritionLogger.barcodeScanner.barcode'), '90162602');
  expect(screen.getByDisplayValue('90162602')).toBeTruthy();
  expect(screen.queryByText('journal:nutritionLogger.barcodeScanner.hideKeyboard')).toBeNull();
  fireEvent.press(screen.getByText('journal:nutritionLogger.barcodeScanner.search'));
  await waitFor(() => expect(found).toHaveBeenCalledWith(product));
  expect(getProductByBarcode).toHaveBeenCalledWith('90162602');
  expect(dismiss).toHaveBeenCalledTimes(1);
  dismiss.mockRestore();
});
