import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { InputLabel } from '../ui/inputs/InputLabel';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { error: '#f00' } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));

it('shows only the label when the requirement is unspecified', () => {
  const { getByText, queryByText } = render(<InputLabel label="Dose" hasError />);
  expect(getByText('Dose')).toBeTruthy();
  expect(queryByText('labeledInput.required')).toBeNull();
});

it('colors only the required word on validation failure', () => {
  const { getByText, rerender } = render(<InputLabel label="Dose" isOptional={false} />);
  expect(StyleSheet.flatten(getByText('labeledInput.required').props.style)?.color).toBeUndefined();
  rerender(<InputLabel label="Dose" isOptional={false} hasError />);
  expect(StyleSheet.flatten(getByText('labeledInput.required').props.style).color).toBe('#f00');
  expect(StyleSheet.flatten(getByText(/^Dose · /).props.style)?.color).toBeUndefined();
});

it('keeps the optional marker in its usual color even with an error', () => {
  const { getByText } = render(<InputLabel label="Dose" isOptional hasError />);
  expect(StyleSheet.flatten(getByText('labeledInput.optional').props.style)?.color).toBeUndefined();
  expect(getByText(/^Dose · /)).toBeTruthy();
});
