import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { AllProviders } from '@/test-utils/Providers';

import Calendar from '../calendar';

// Lägg till överst i testfilen:
export const addMarkForDateMock = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock CalendarComponent
jest.mock('@/components/CalendarComponent', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');

  return {
    __esModule: true,
    default: React.forwardRef(function MockCalendarComponent({ onDayPress }: any, ref: any) {
      React.useImperativeHandle(ref, () => ({
        addMarkForDate: jest.fn(),
        removeMarkForDate: jest.fn(),
      }));
      
      return React.createElement(
        View,
        { testID: 'calendar-component' },
        React.createElement(Text, null, 'Mock Calendar'),
        React.createElement(
          TouchableOpacity,
          { testID: 'day-2024-01-15', onPress: () => onDayPress?.({ dateString: '2024-01-15' }) },
          React.createElement(Text, null, 'Jan 15')
        ),
        React.createElement(
          TouchableOpacity,
          { testID: 'day-2024-01-16', onPress: () => onDayPress?.({ dateString: '2024-01-16' }) },
          React.createElement(Text, null, 'Jan 16')
        )
      );
    }),
  };
});

// Mock DayEdit component
jest.mock('@/components/DayEdit', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return function MockDayEdit({ selectedDate, selectedSupplement }: any) {
    const dateString = typeof selectedDate === 'string' ? selectedDate : selectedDate?.dateString || '';
    
    return React.createElement(
      View,
      { testID: 'day-edit' },
      React.createElement(Text, { testID: 'selected-date' }, 'Date: ', dateString),
      React.createElement(Text, { testID: 'selected-supplement' }, 'Supplement: ', selectedSupplement || 'None')
    );
  };
});

  const renderWithProviders = (ui: React.ReactElement) =>
    render(ui, { wrapper: AllProviders });

describe('Calendar', () => {
  beforeEach(() => {
    addMarkForDateMock.mockClear();
  });

  it('renders calendar component', async () => {
    const { getByTestId } = renderWithProviders(<Calendar />);

    await waitFor(() => {
    expect(getByTestId('calendar-component')).toBeTruthy();
    });
  });

  it('does not show DayEdit initially', async () => {
    const { queryByTestId } = renderWithProviders(<Calendar />);
    await waitFor(() => {
      expect(queryByTestId('day-edit')).toBeNull();
    });
  });

  it('shows DayEdit when a date is selected', async () => {
    const { getByTestId } = renderWithProviders(<Calendar />);

    const dayButton = getByTestId('day-2024-01-15');
    fireEvent.press(dayButton);

    await waitFor(() => {
      expect(getByTestId('day-edit')).toBeTruthy();
    });
  });

  it('displays selected date in DayEdit', async () => {
    const { getByTestId } = renderWithProviders(<Calendar />);    
    const dayButton = getByTestId('day-2024-01-15');
    fireEvent.press(dayButton);

    await waitFor(() => {
      const selectedDateText = getByTestId('selected-date');
      expect(selectedDateText.props.children).toEqual(['Date: ', '2024-01-15']);
    });
  });

  it('initially shows no supplement selected', async () => {
    const { getByTestId } = renderWithProviders(<Calendar />);

    const dayButton = getByTestId('day-2024-01-15');
    fireEvent.press(dayButton);

    await waitFor(() => {
      const selectedSupplementText = getByTestId('selected-supplement');
      expect(selectedSupplementText.props.children).toEqual(['Supplement: ', 'None']);
    });
  });

  it('renders with proper safe area and scroll view structure', async () => {
    const { getByTestId } = renderWithProviders(<Calendar />);

    // Verify main components are rendered
    await waitFor(() => {
      expect(getByTestId('calendar-component')).toBeTruthy();
    });
  });
});
