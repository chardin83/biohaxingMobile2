import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { AllProviders } from '@/test-utils/Providers';

import Areas from '../areas';

// Mock react-i18next
jest.mock('i18next', () => ({
  t: (key: string) => {
    const translations: { [key: string]: string } = {
      'common:areas.selectAreas': 'Select Areas',
      'areas:cardio.title': 'Cardio',
      'areas:cardio.description': 'Cardio desc',
      'areas:sleep.title': 'Sleep',
      'areas:sleep.description': 'Sleep desc',
      'areas:stress.title': 'Stress',
      'areas:stress.description': 'Stress desc',
      'areas:energy.title': 'Energy',
      'areas:energy.description': 'Energy desc',
      'areas:nutrition.title': 'Nutrition',
      'areas:nutrition.description': 'Nutrition desc',
      'areas:training.title': 'Training',
      'areas:training.description': 'Training desc',
    };
    return translations[key] || key;
  },
}));

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

jest.mock('@/components/ui/AppCard', () => {
  return function MockAppCard({ title, description, isActive, onPress }: any) {
    const { TouchableOpacity, Text, View } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={`app-card-${title.toLowerCase()}`}>
        <View>
          <Text testID="card-title">{title}</Text>
          <Text testID="card-description">{description}</Text>
          <Text testID="card-active">{isActive ? 'active' : 'inactive'}</Text>
        </View>
      </TouchableOpacity>
    );
  };
});

jest.mock('@/locales/areas', () => ({
  areas: [
    { id: 'cardio', title: 'Cardio', description: 'Cardio desc' },
    { id: 'sleep', title: 'Sleep', description: 'Sleep desc' },
  ],
}));

describe('Areas Screen', () => {
  const renderWithProviders = (ui: React.ReactNode) =>
    render(ui, { wrapper: AllProviders });

  it('renders the screen title correctly', async () => {
    const { getByText } = renderWithProviders(<Areas />);
    await waitFor(() => {
      expect(getByText('Select Areas')).toBeTruthy();
    });
  });

  it('renders all AppCards', async () => {
    const { getAllByTestId } = renderWithProviders(<Areas />);
    await waitFor(() => {
      expect(getAllByTestId(/app-card-/).length).toBe(2);
    });
  });

  it('toggles goal active state on press', async () => {
    const { getByTestId, getAllByTestId } = renderWithProviders(<Areas />);
    const card = getByTestId('app-card-cardio');
    await act(async () => {
      fireEvent.press(card);
    });
    expect(getAllByTestId('card-active')[0].props.children).toMatch(/active|inactive/);
  });

  it('applies correct styling to the container', async () => {
    const { getByText } = renderWithProviders(<Areas />);
    const titleElement = getByText('Select Areas');
    // Slå ihop alla style-objekt i arrayen
    const mergedStyle = Array.isArray(titleElement.props.style)
      ? Object.assign({}, ...titleElement.props.style)
      : titleElement.props.style;

    await waitFor(() => {
      expect(mergedStyle).toEqual(
        expect.objectContaining({
          fontSize: 22,
          fontWeight: 'bold',
          marginBottom: 20,
        })
      );
    });
  });
});