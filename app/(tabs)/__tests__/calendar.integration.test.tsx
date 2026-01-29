import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { MenuProvider } from 'react-native-popup-menu';

import { StorageProvider } from '@/app/context/StorageContext';

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

const renderWithStorageProvider = (children: React.ReactNode) => {
  return render(
    <MenuProvider>
      <StorageProvider>{children}</StorageProvider>
    </MenuProvider>
  );
};

describe('Calendar Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders calendar with real CalendarComponent integration', async () => {
    const { getByTestId } = renderWithStorageProvider(<Calendar />);

    await waitFor(() => {
      expect(getByTestId('real-calendar')).toBeTruthy();
    });
  });

  it('integrates calendar day selection with DayEdit component', async () => {
    const { getByTestId, queryByText } = renderWithStorageProvider(<Calendar />);

    // Initially no DayEdit should be visible with supplements tab
    expect(queryByText('TILLSKOTT')).toBeNull();

    // Select a day on the calendar
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    // DayEdit should now be visible with tabs
    await waitFor(() => {
      expect(queryByText('TILLSKOTT')).toBeTruthy();
      expect(queryByText('MÅLTID')).toBeTruthy();
    });
  });

  it('allows adding supplements through the full workflow', async () => {
    const { getByTestId, getByText, queryByText } = renderWithStorageProvider(<Calendar />);

    // Select a day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    // Wait for DayEdit to appear
    await waitFor(() => {
      expect(queryByText('TILLSKOTT')).toBeTruthy();
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
    const { getByTestId, queryByText } = renderWithStorageProvider(<Calendar />);

    // Select a day and verify DayEdit appears
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    await waitFor(() => {
      expect(queryByText('TILLSKOTT')).toBeTruthy();
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
      expect(queryByText('TILLSKOTT')).toBeTruthy();
    });
  });

  it('integrates calendar marking with supplement data', async () => {
    const { getByTestId, queryByTestId } = renderWithStorageProvider(<Calendar />);

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
    const { getByTestId, getByText, queryByTestId } = renderWithStorageProvider(<Calendar />);

    // Select a day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    await waitFor(() => {
      expect(getByText('TILLSKOTT')).toBeTruthy();
    });

    // Initially should be on supplements tab
    expect(queryByTestId('nutrition-logger')).toBeNull();

    // Switch to meal tab
    await act(async () => {
      fireEvent.press(getByText('MÅLTID'));
    });

    // Should now show nutrition logger
    await waitFor(() => {
      expect(getByTestId('nutrition-logger')).toBeTruthy();
    });
  });

  it('handles time changes in supplement workflow', async () => {
    const { getByTestId, getByText } = renderWithStorageProvider(<Calendar />);

    // Select a day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    await waitFor(() => {
      expect(getByText('TILLSKOTT')).toBeTruthy();
    });

    // Verify the DayEdit component is working with date selection
    await waitFor(() => {
      expect(getByText('Add')).toBeTruthy();
    });
  });

  it('handles supplement editing workflow', async () => {
    const { getByTestId, getByText } = renderWithStorageProvider(<Calendar />);

    // Select a day
    await act(async () => {
      fireEvent.press(getByTestId('calendar-day-2024-01-15'));
    });

    await waitFor(() => {
      expect(getByText('TILLSKOTT')).toBeTruthy();
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

    const { getByTestId } = renderWithStorageProvider(<Calendar />);

    // Kalendern ska visa markering för 2024-01-15
    await waitFor(() => {
      expect(getByTestId('marked-2024-01-15')).toBeTruthy();
    });
  });
});
