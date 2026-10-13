import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import LabeledInput, { LabeledInputRow } from '../ui/LabeledInput';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { border: '#ddd', error: '#f00' } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => (key === 'labeledInput.requiredError' ? 'Obligatorisk' : key) }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));

function Field({ initialValue = '', isOptional = false }: { initialValue?: string; isOptional?: boolean }) {
  const [value, setValue] = React.useState(initialValue);
  return <LabeledInput label="Dose" accessibilityLabel="Dose" value={value} onChangeText={setValue} isOptional={isOptional} />;
}

it('does not show a required error for an initially empty field', () => {
  const { queryByText } = render(<Field />);
  expect(queryByText('Obligatorisk')).toBeNull();
});

it('shows an error immediately when a prefilled required field is cleared and clears it when filled again', () => {
  const { getByLabelText, getByText, queryByText } = render(<Field initialValue="15" />);
  fireEvent.changeText(getByLabelText('Dose'), '');
  expect(getByText('Obligatorisk')).toBeTruthy();
  fireEvent.changeText(getByLabelText('Dose'), '10');
  expect(queryByText('Obligatorisk')).toBeNull();
});

it('shows an error when a value entered in an initially empty field is removed', () => {
  const { getByLabelText, getByText } = render(<Field />);
  fireEvent.changeText(getByLabelText('Dose'), '10');
  fireEvent.changeText(getByLabelText('Dose'), '   ');
  expect(getByText('Obligatorisk')).toBeTruthy();
});

it('does not require optional fields', () => {
  const { getByLabelText, queryByText } = render(<Field initialValue="15" isOptional />);
  fireEvent.changeText(getByLabelText('Dose'), '');
  expect(queryByText('Obligatorisk')).toBeNull();
});

it('supports explicit validation errors', () => {
  const { getByText } = render(<LabeledInput label="Dose" value="-1" errorText="Must be positive" />);
  expect(getByText('Must be positive')).toBeTruthy();
});

it('hides standalone helper text while an error is visible', () => {
  const { queryByText, getByText, rerender } = render(<LabeledInput label="Dose" value="15" helperText="Example dose" errorText="Invalid" />);
  expect(getByText('Invalid')).toBeTruthy();
  expect(queryByText('Example dose')).toBeNull();
  rerender(<LabeledInput label="Dose" value="15" helperText="Example dose" />);
  expect(getByText('Example dose')).toBeTruthy();
});

it('hides the shared row helper until all input errors are cleared', () => {
  function Row() {
    return (
      <LabeledInputRow helperText="Example dose">
        <Field initialValue="15" />
      </LabeledInputRow>
    );
  }
  const { getByLabelText, getByText, queryByText } = render(<Row />);
  expect(getByText('Example dose')).toBeTruthy();
  fireEvent.changeText(getByLabelText('Dose'), '');
  expect(getByText('Obligatorisk')).toBeTruthy();
  expect(queryByText('Example dose')).toBeNull();
  fireEvent.changeText(getByLabelText('Dose'), '10');
  expect(getByText('Example dose')).toBeTruthy();
});
