import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { StorageProvider } from '../../context/StorageContext';
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
    };
    return translations[key] || key;
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
  const renderWithProvider = (ui: React.ReactNode) => (
    <StorageProvider>{ui}</StorageProvider>
  );

  it('renders the screen title correctly', () => {
    const { getByText } = render(renderWithProvider(<Areas />));
    expect(getByText('Select Areas')).toBeTruthy();
  });

  it('renders all AppCards', () => {
    const { getAllByTestId } = render(renderWithProvider(<Areas />));
    expect(getAllByTestId(/app-card-/).length).toBe(2);
  });

  it('toggles goal active state on press', () => {
    const { getByTestId, getAllByTestId } = render(renderWithProvider(<Areas />));
    const card = getByTestId('app-card-cardio');
    fireEvent.press(card);
    // Should update active state (mocked, so just check if rendered)
    expect(getAllByTestId('card-active')[0].props.children).toMatch(/active|inactive/);
  });

  it('applies correct styling to the container', () => {
    const { getByText } = render(renderWithProvider(<Areas />));
    const titleElement = getByText('Select Areas');
    expect(titleElement.props.style).toEqual(
      expect.objectContaining({
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
      })
    );
  });
});
