import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { SaveDeleteCancelButtons } from '../ui/SaveDeleteCancelButtons';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));

it('orders save, delete and cancel and blocks all actions while saving', () => {
  const onSave = jest.fn();
  const onDelete = jest.fn();
  const onCancel = jest.fn();
  const props = { onSave, onDelete, onCancel };
  const screen = render(<SaveDeleteCancelButtons {...props} busy />);
  expect(screen.getAllByRole('button').map(button => button.props.accessibilityLabel)).toEqual(['general.save', 'general.delete', 'general.cancel']);
  for (const button of screen.getAllByRole('button')) {
    expect(button.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(button);
  }
  expect(onSave).not.toHaveBeenCalled();
  expect(onDelete).not.toHaveBeenCalled();
  expect(onCancel).not.toHaveBeenCalled();
  screen.rerender(<SaveDeleteCancelButtons {...props} />);
  fireEvent.press(screen.getByRole('button', { name: 'general.delete' }));
  expect(onDelete).toHaveBeenCalledTimes(1);
});

it('supports custom save text and omits delete when no delete action is supplied', () => {
  const screen = render(<SaveDeleteCancelButtons onSave={jest.fn()} onCancel={jest.fn()} saveTitle="Skapa" />);
  expect(screen.getByRole('button', { name: 'Skapa' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'general.delete' })).toBeNull();
});
