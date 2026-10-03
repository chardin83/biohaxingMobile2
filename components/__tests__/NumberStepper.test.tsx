import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import NumberStepper from '../NumberStepper';

jest.mock('@react-navigation/native', () => ({
  useTheme: () => ({ colors: { text: '#fff' } }),
}));

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetTextInput: (props: import('react-native').TextInputProps) => {
    const { TextInput } = require('react-native');
    return <TextInput {...props} testID="sheet-input" />;
  },
}));

describe('NumberStepper', () => {
  it('increments and decrements by one by default', () => {
    const onChange = jest.fn();
    const { getByLabelText, rerender } = render(<NumberStepper value={100} onChange={onChange} />);
    fireEvent.press(getByLabelText('+1'));
    expect(onChange).toHaveBeenLastCalledWith(101);
    rerender(<NumberStepper value={101} onChange={onChange} />);
    rerender(<NumberStepper value={100} onChange={onChange} />);
    fireEvent.press(getByLabelText('-1'));
    expect(onChange).toHaveBeenLastCalledWith(99);
  });

  it('supports custom steps and decimal amounts', () => {
    const onChange = jest.fn();
    const { getByLabelText, rerender } = render(<NumberStepper value={12.5} onChange={onChange} step={10} />);
    fireEvent.press(getByLabelText('+10'));
    expect(onChange).toHaveBeenLastCalledWith(22.5);
    rerender(<NumberStepper value={22.5} onChange={onChange} step={10} />);
    rerender(<NumberStepper value={12.5} onChange={onChange} step={10} />);
    fireEvent.press(getByLabelText('-10'));
    expect(onChange).toHaveBeenLastCalledWith(2.5);
  });

  it('clamps to both limits when a step crosses them', () => {
    const onChange = jest.fn();
    const { getByLabelText, rerender } = render(<NumberStepper value={997} onChange={onChange} min={0} max={1000} step={5} />);
    fireEvent.press(getByLabelText('+5'));
    expect(onChange).toHaveBeenLastCalledWith(1000);
    rerender(<NumberStepper value={2} onChange={onChange} min={0} max={1000} step={5} />);
    fireEvent.press(getByLabelText('-5'));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('stays at the limits when pressed again', () => {
    const onChange = jest.fn();
    const { getByLabelText, rerender } = render(<NumberStepper value={0} onChange={onChange} min={0} max={1000} step={5} />);
    fireEvent.press(getByLabelText('-5'));
    expect(onChange).toHaveBeenLastCalledWith(0);
    rerender(<NumberStepper value={1000} onChange={onChange} min={0} max={1000} step={5} />);
    fireEvent.press(getByLabelText('+5'));
    expect(onChange).toHaveBeenLastCalledWith(1000);
  });

  it('shows the current controlled value after it changes', () => {
    const onChange = jest.fn();
    const { getByDisplayValue, rerender } = render(<NumberStepper value={100} onChange={onChange} />);
    expect(getByDisplayValue('100')).toBeTruthy();
    rerender(<NumberStepper value={105} onChange={onChange} />);
    expect(getByDisplayValue('105')).toBeTruthy();
  });

  it('blocks both buttons while disabled', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<NumberStepper value={100} onChange={onChange} disabled />);
    fireEvent.press(getByLabelText('+1'));
    fireEvent.press(getByLabelText('-1'));
    expect(onChange).not.toHaveBeenCalled();
  });
  it('updates decimal values immediately and preserves a decimal comma while typing', () => {
    const onChange = jest.fn();
    function ControlledStepper() {
      const [value, setValue] = React.useState(100);
      return (
        <NumberStepper
          value={value}
          onChange={next => {
            setValue(next);
            onChange(next);
          }}
          min={0}
          accessibilityLabel="Protein"
        />
      );
    }
    const { getByLabelText, getByDisplayValue } = render(<ControlledStepper />);
    fireEvent.changeText(getByLabelText('Protein'), '12,');
    expect(onChange).toHaveBeenLastCalledWith(12);
    expect(getByDisplayValue('12,')).toBeTruthy();
    fireEvent.changeText(getByLabelText('Protein'), '12,5');
    expect(onChange).toHaveBeenLastCalledWith(12.5);
    fireEvent.press(getByLabelText('+1'));
    expect(onChange).toHaveBeenLastCalledWith(13.5);
  });

  it('allows clearing the input and normalizes it on blur', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByDisplayValue } = render(<NumberStepper value={100} onChange={onChange} min={0} accessibilityLabel="Protein" />);
    fireEvent.changeText(getByLabelText('Protein'), '');
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(getByDisplayValue('')).toBeTruthy();
    fireEvent(getByLabelText('Protein'), 'blur');
    expect(getByDisplayValue('0')).toBeTruthy();
  });

  it('rejects invalid text and clamps typed values to the limits', () => {
    const onChange = jest.fn();
    const { getByLabelText, getByDisplayValue } = render(<NumberStepper value={100} onChange={onChange} min={0} max={1000} accessibilityLabel="Protein" />);
    fireEvent.changeText(getByLabelText('Protein'), 'abc');
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.changeText(getByLabelText('Protein'), '1005');
    expect(onChange).toHaveBeenLastCalledWith(1000);
    expect(getByDisplayValue('1000')).toBeTruthy();
    fireEvent.changeText(getByLabelText('Protein'), '-5');
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('uses a bottom sheet input when requested and disables typing', () => {
    const onChange = jest.fn();
    const { queryByTestId, getByLabelText, rerender } = render(<NumberStepper value={100} onChange={onChange} />);
    expect(queryByTestId('sheet-input')).toBeNull();
    rerender(<NumberStepper value={100} onChange={onChange} inBottomSheet disabled accessibilityLabel="Amount" />);
    expect(queryByTestId('sheet-input')?.props.editable).toBe(false);
    fireEvent.changeText(getByLabelText('Amount'), '200');
    expect(onChange).not.toHaveBeenCalled();
  });
});
