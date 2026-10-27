import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { ChoiceInput } from '../ui/inputs/ChoiceInput';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { error: '#f00' } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));

const options = [{ value: 'low', label: 'Låg' }, { value: 'high', label: 'Hög' }];

it('validates a missing required selection after submission and clears the error when selected', () => {
  const onChange = jest.fn();
  const screen = render(<ChoiceInput label="Intensitet" options={options} onChange={onChange} isOptional={false} />);
  expect(screen.getByRole('radio', { name: 'Låg' }).props.accessibilityHint).toBeUndefined();
  screen.rerender(<ChoiceInput label="Intensitet" options={options} onChange={onChange} isOptional={false} showValidation />);
  expect(screen.getByRole('radio', { name: 'Låg' }).props.accessibilityHint).toBe('labeledInput.requiredError');
  fireEvent.press(screen.getByRole('radio', { name: 'Hög' }));
  expect(onChange).toHaveBeenCalledWith('high');
  screen.rerender(<ChoiceInput label="Intensitet" options={options} onChange={onChange} value="high" isOptional={false} showValidation />);
  expect(screen.getByRole('radio', { name: 'Hög', checked: true }).props.accessibilityHint).toBeUndefined();
});

it('supports optional selections, external errors and disabled controls', () => {
  const onChange = jest.fn();
  const screen = render(<ChoiceInput label="Val" options={options} onChange={onChange} isOptional showValidation />);
  expect(screen.getByRole('radio', { name: 'Låg' }).props.accessibilityHint).toBeUndefined();
  screen.rerender(<ChoiceInput label="Val" options={options} onChange={onChange} errorText="Ogiltigt val" disabled />);
  const option = screen.getByRole('radio', { name: 'Låg', disabled: true });
  expect(option.props.accessibilityHint).toBe('Ogiltigt val');
  fireEvent.press(option);
  expect(onChange).not.toHaveBeenCalled();
});
