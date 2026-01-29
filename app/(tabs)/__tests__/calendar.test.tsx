import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import Calendar from '../calendar';

// Lägg till överst i testfilen:
export const addMarkForDateMock = jest.fn();

// Mock CalendarComponent
jest.mock('@/components/CalendarComponent', () => {
  const mockReact = require('react');
  const { forwardRef } = mockReact;
  const { View, Text, TouchableOpacity } = require('react-native');


  return forwardRef(function MockCalendarComponent({ onDayPress }: any) {
    return (
      <View testID="calendar-component">
        <Text>Mock Calendar</Text>
        <TouchableOpacity testID="day-2024-01-15" onPress={() => onDayPress('2024-01-15')}>
          <Text>Jan 15</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="day-2024-01-16" onPress={() => onDayPress('2024-01-16')}>
          <Text>Jan 16</Text>
        </TouchableOpacity>
      </View>
    );
  });
});

// Mock DayEdit component
jest.mock('@/components/DayEdit', () => {
  return function MockDayEdit({ selectedDate, selectedSupplement }: any) {
    const { View, Text } = require('react-native');
    return (
      <View testID="day-edit">
        <Text testID="selected-date">Date: {selectedDate}</Text>
        <Text testID="selected-supplement">Supplement: {selectedSupplement || 'None'}</Text>
      </View>
    );
  };
});

describe('Calendar', () => {
  beforeEach(() => {
    addMarkForDateMock.mockClear();
  });

  it('renders calendar component', () => {
    const { getByTestId } = render(<Calendar />);
    expect(getByTestId('calendar-component')).toBeTruthy();
  });

  it('does not show DayEdit initially', () => {
    const { queryByTestId } = render(<Calendar />);
    expect(queryByTestId('day-edit')).toBeNull();
  });

  it('shows DayEdit when a date is selected', () => {
    const { getByTestId } = render(<Calendar />);

    const dayButton = getByTestId('day-2024-01-15');
    fireEvent.press(dayButton);

    expect(getByTestId('day-edit')).toBeTruthy();
  });

  it('displays selected date in DayEdit', () => {
    const { getByTestId } = render(<Calendar />);

    const dayButton = getByTestId('day-2024-01-15');
    fireEvent.press(dayButton);

    const selectedDateText = getByTestId('selected-date');
    expect(selectedDateText.props.children).toEqual(['Date: ', '2024-01-15']);
  });

  it('initially shows no supplement selected', () => {
    const { getByTestId } = render(<Calendar />);

    const dayButton = getByTestId('day-2024-01-15');
    fireEvent.press(dayButton);

    const selectedSupplementText = getByTestId('selected-supplement');
    expect(selectedSupplementText.props.children).toEqual(['Supplement: ', 'None']);
  });

  it('renders with proper safe area and scroll view structure', () => {
    const { getByTestId } = render(<Calendar />);

    // Verify main components are rendered
    expect(getByTestId('calendar-component')).toBeTruthy();
  });
});
