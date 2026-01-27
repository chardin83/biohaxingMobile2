import { render } from '@testing-library/react-native';
import React from 'react';

import Goals from '../goals';

// Mock react-i18next
jest.mock('i18next', () => ({
  t: (key: string) => {
    const translations: { [key: string]: string } = {
      'common:areas.selectAreas': 'Select Areas',
    };
    return translations[key] || key;
  },
}));

// Mock MyGoalsSelector component
jest.mock('@/components/MyGoalsSelector', () => {
  return function MockMyGoalsSelector() {
    const { Text, View } = require('react-native');
    return (
      <View testID="my-goals-selector">
        <Text>Mock Goals Selector</Text>
      </View>
    );
  };
});

describe('Goals Screen', () => {
  it('renders the screen title correctly', () => {
    const { getByText } = render(<Goals />);
    expect(getByText('Select Goal')).toBeTruthy();
  });

  it('renders MyGoalsSelector component', () => {
    const { getByTestId } = render(<Goals />);
    expect(getByTestId('my-goals-selector')).toBeTruthy();
  });

  it('has correct layout structure', () => {
    const { getByText, getByTestId } = render(<Goals />);

    // Check that both title and selector are present
    expect(getByText('Select Goal')).toBeTruthy();
    expect(getByTestId('my-goals-selector')).toBeTruthy();
  });

  it('applies correct styling to the container', () => {
    const { getByText } = render(<Goals />);
    const titleElement = getByText('Select Goal');

    // Verify the title has the expected style properties
    expect(titleElement.props.style).toEqual(
      expect.objectContaining({
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
      })
    );
  });
});
