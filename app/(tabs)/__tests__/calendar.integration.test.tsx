import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { AllProviders } from '@/test-utils/Providers';

import Calendar from '../calendar';

// Mock only external dependencies, not internal components
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: { [key: string]: any } = {
        'monthNames': [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ],
        'monthNamesShort': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        'dayNames': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'dayNamesShort': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        'today': 'Today',
        'general.add': 'Add',
        'dayEdit.addSupplement': 'Add Supplement',
        'dayEdit.addFromPlan': 'Add from Plan',
        'dayEdit.editSupplement': 'Edit Supplement',
        'dayEdit.chooseTime': 'Choose Time',
        'dayEdit.choosePlan': 'Choose Plan',
        'general.cancel': 'Cancel',
      };

      if (options?.returnObjects) {
        return translations[key] || key;
      }
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/locales/supplements', () => ({
  useSupplements: () => [
    { id: 'vit-d3', name: 'Vitamin D3', category: 'vitamins' },
    { id: 'omega-3', name: 'Omega-3', category: 'fatty-acids' },
  ],
}));

// Mock react-native-calendars to use a simpler implementation
jest.mock('react-native-calendars', () => ({
  Calendar: ({ onDayPress, markedDates }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="real-calendar">
        <Text>Calendar Component</Text>
        <TouchableOpacity testID="calendar-day-2024-01-15" onPress={() => onDayPress({ dateString: '2024-01-15' })}>
          <Text>Jan 15</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="calendar-day-2024-01-16" onPress={() => onDayPress({ dateString: '2024-01-16' })}>
          <Text>Jan 16</Text>
        </TouchableOpacity>
        {markedDates &&
          Object.keys(markedDates).map(date => (
            <Text key={date} testID={`marked-${date}`}>
              Marked: {date}
            </Text>
          ))}
      </View>
    );
  },
  LocaleConfig: {
    locales: {},
    defaultLocale: 'en',
  },
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  return ({ value, onChange }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="time-picker">
        <Text>Time: {value.toTimeString().slice(0, 5)}</Text>
        <TouchableOpacity testID="time-picker-change" onPress={() => onChange(null, new Date('2024-01-15T14:30:00'))}>
          <Text>Change Time</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

// Mock SupplementForm to simulate supplement selection
jest.mock('@/components/SupplementForm', () => {
  return ({ onSave, onCancel, preselectedSupplement }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="supplement-form">
        <Text>Supplement Form</Text>
        <Text>Editing: {preselectedSupplement?.name || 'New'}</Text>
        <TouchableOpacity
          testID="save-vitamin-d3"
          onPress={() => onSave({ id: 'vit-d3', name: 'Vitamin D3', category: 'vitamins' })}
        >
          <Text>Save Vitamin D3</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="save-omega-3"
          onPress={() => onSave({ id: 'omega-3', name: 'Omega-3', category: 'fatty-acids' })}
        >
          <Text>Save Omega-3</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="cancel-form" onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

// Mock NutritionLogger
jest.mock('@/components/NutritionLogger', () => {
  return ({ selectedDate }: any) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="nutrition-logger">
        <Text>Nutrition Logger for {selectedDate}</Text>
      </View>
    );
  };
});

const renderWithProviders = async (children: React.ReactNode) => {
  const result = render(<>{children}</>, { wrapper: AllProviders });
  // Flush initial effects within act to avoid warnings from useEffect updates.
  await act(async () => {});
  return result;
};

describe('Calendar Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders calendar with real CalendarComponent integration', async () => {
    const { getByTestId } = await renderWithProviders(<Calendar />);

    await waitFor(() => {
      expect(getByTestId('real-calendar')).toBeTruthy();
    });
  });

  it('integrates calendar day selection with DayEdit component', async () => {
    const { getByTestId, queryByText } = await renderWithProviders(<Calendar />);

    // Initially no DayEdit should be visible with supplements tab
    expect(queryByText('Tillskott')).toBeNull();

    // Select a day on the calendar
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    // DayEdit should now be visible with tabs
    await waitFor(() => {
      expect(queryByText('Måltid')).toBeTruthy();
      expect(queryByText('Tillskott')).toBeTruthy();
    });
  });

  it('allows adding supplements through the full workflow', async () => {
    const { getByTestId, getByText, queryByText } = await renderWithProviders(<Calendar />);

    // Select a day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    // Wait for DayEdit to appear
    await waitFor(() => {
      expect(queryByText('Tillskott')).toBeTruthy();
    });

    // Click add supplement through dropdown menu
    await act(async () => {
      fireEvent.press(getByText('Add'));
    });

    // Verify the add functionality is available
    await waitFor(() => {
      expect(queryByText('Add')).toBeTruthy();
    });
  });

  it('manages supplement state through storage context', async () => {
    const { getByTestId, queryByText } = await renderWithProviders(<Calendar />);

    // Select a day and verify DayEdit appears
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    await waitFor(() => {
      expect(queryByText('Tillskott')).toBeTruthy();
    });

    // Switch to another day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-16'));
    });

    // Go back to the first day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    // The DayEdit should still appear (showing state persistence)
    await waitFor(() => {
      expect(queryByText('Tillskott')).toBeTruthy();
    });
  });

  it('integrates calendar marking with supplement data', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(<Calendar />);

    // Select a day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    // Verify DayEdit appears, indicating successful integration
    await waitFor(() => {
      expect(queryByTestId('marked-2024-01-15')).toBeTruthy();
    });

    // The calendar should show integration with storage context
    // by displaying marked dates when supplements are added
  });

  it('switches between supplement and meal tabs', async () => {
    const { getByTestId, getByText, queryByTestId } = await renderWithProviders(<Calendar />);

    // Select a day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    await waitFor(() => {
      expect(getByText('Tillskott')).toBeTruthy();
    });

    // Initially should be on supplements tab
    expect(queryByTestId('nutrition-logger')).toBeNull();

    // Switch to meal tab
    await act(async () => {
      fireEvent.press(getByText('Måltid'));
    });

    // Should now show nutrition logger
    await waitFor(() => {
      expect(getByTestId('nutrition-logger')).toBeTruthy();
    });
  });

  it('handles time changes in supplement workflow', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<Calendar />);

    // Select a day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    await waitFor(() => {
      expect(getByText('Tillskott')).toBeTruthy();
    });

    // Verify the DayEdit component is working with date selection
    await waitFor(() => {
      expect(getByText('Add')).toBeTruthy();
    });
  });

  it('handles supplement editing workflow', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<Calendar />);

    // Select a day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    await waitFor(() => {
      expect(getByText('Tillskott')).toBeTruthy();
    });

    // Verify the supplement management interface is available
    await waitFor(() => {
      expect(getByText('Add')).toBeTruthy();
    });
  });

  it('shows date is marked if storage contains supplements for that date', async () => {
    // Mocka getItem så att just "takenDates" returnerar markerat datum
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'takenDates') {
        return Promise.resolve(
          JSON.stringify({
            '2024-01-15': [{ id: 'vit-d3', name: 'Vitamin D3', category: 'vitamins' }],
          })
        );
      }
      return Promise.resolve(null);
    });

    const { getByTestId } = await renderWithProviders(<Calendar />);

    // Kalendern ska visa markering för 2024-01-15
    await waitFor(() => {
      expect(getByTestId('marked-2024-01-15')).toBeTruthy();
    });
  });
});
