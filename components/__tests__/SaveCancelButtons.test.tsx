import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import * as RN from 'react-native';

import { SaveCancelButtons } from '../ui/SaveCancelButtons';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { text: '#111', primaryText: '#111', primary: '#0f0' } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));

afterEach(() => jest.restoreAllMocks());

it('disables save and cancel while busy and enables them after saving', () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();
  const { getByRole, rerender } = render(<SaveCancelButtons onSave={onSave} onCancel={onCancel} busy />);
  const save = getByRole('button', { name: 'general.save' });
  expect(save.props.accessibilityState).toEqual({ disabled: true, busy: true });
  fireEvent.press(save);
  expect(onSave).not.toHaveBeenCalled();
  fireEvent.press(getByRole('button', { name: 'general.cancel' }));
  expect(onCancel).not.toHaveBeenCalled();
  expect(getByRole('button', { name: 'general.cancel' }).props.accessibilityState.disabled).toBe(true);

  rerender(<SaveCancelButtons onSave={onSave} onCancel={onCancel} />);
  fireEvent.press(getByRole('button', { name: 'general.cancel' }));
  fireEvent.press(getByRole('button', { name: 'general.save' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledTimes(1);
});

it('keeps both buttons equally wide and stacks them for large text', () => {
  const dimensions = jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width: 400, height: 800, scale: 1, fontScale: 1 });
  const { getByRole, rerender } = render(<SaveCancelButtons onSave={jest.fn()} onCancel={jest.fn()} />);
  const buttonStyle = (name: string) => RN.StyleSheet.flatten(getByRole('button', { name }).props.style);
  expect(buttonStyle('general.cancel').flex).toBe(1);
  expect(buttonStyle('general.save').flex).toBe(1);
  expect(buttonStyle('general.cancel').minHeight).toBeGreaterThanOrEqual(48);
  expect(buttonStyle('general.save').minHeight).toBeGreaterThanOrEqual(48);
  dimensions.mockReturnValue({ width: 400, height: 800, scale: 1, fontScale: 2 });
  rerender(<SaveCancelButtons onSave={jest.fn()} onCancel={jest.fn()} />);
  expect(buttonStyle('general.cancel').width).toBe('100%');
  expect(buttonStyle('general.save').width).toBe('100%');
});

it('uses custom save text for both the visible label and screen readers', () => {
  const { getByRole } = render(<SaveCancelButtons onSave={jest.fn()} onCancel={jest.fn()} saveTitle="Skapa träningspass" />);
  expect(getByRole('button', { name: 'Skapa träningspass' })).toBeTruthy();
});

it('supports save-only and cancel-only dialogs', () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();
  const screen = render(<SaveCancelButtons onSave={onSave} onCancel={onCancel} showCancelButton={false} saveTitle="OK" />);
  expect(screen.queryByRole('button', { name: 'general.cancel' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'OK' }));
  expect(onSave).toHaveBeenCalledTimes(1);
  screen.rerender(<SaveCancelButtons onCancel={onCancel} />);
  expect(screen.queryByRole('button', { name: 'general.save' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'general.cancel' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});
