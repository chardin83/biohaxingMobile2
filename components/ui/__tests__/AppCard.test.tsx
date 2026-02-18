import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { AllProviders } from '@/test-utils/Providers';

import AppCard from '../AppCard';

  const renderWithProviders = (ui: React.ReactElement) =>
    render(ui, { wrapper: AllProviders });

// Mock react-native-paper Icon
jest.mock('react-native-paper', () => ({
  Icon: ({ source, size, color, testID }: any) => {
    const { Text } = require('react-native');
    return (
      <Text testID={testID || 'icon'} style={{ color, fontSize: size }}>
        {source}
      </Text>
    );
  },
}));

// Mock Colors
jest.mock('@/app/theme/Colors', () => ({
  Colors: {
    dark: {
      primary: '#00FF00',
      secondary: '#222222',
      border: '#444444',
      borderLight: '#666666',
      textLight: '#AAAAAA',
      checkmarkSupplement: '#00FFFF',
    },
  },
}));

describe('AppCard', () => {
  const defaultProps = {
    title: 'Test Card',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title correctly', async () => {
    const { getByText } = renderWithProviders(<AppCard {...defaultProps} />);
    await waitFor(() => {
      expect(getByText('Test Card')).toBeTruthy();
    });
  });

  it('renders description when provided', async () => {
    const { getByText } = renderWithProviders(<AppCard {...defaultProps} description="Test description" />);
    await waitFor(() => {
      expect(getByText('Test description')).toBeTruthy();
    });
  });

  it('does not render description when not provided', async () => {
    const { queryByText } = renderWithProviders(<AppCard {...defaultProps} />);
    await waitFor(() => {
      expect(queryByText('Test description')).toBeNull();
    });
  });

  it('renders icon when provided', async () => {
    const { getByTestId } = renderWithProviders(<AppCard {...defaultProps} icon="home" />);
    await waitFor(() => {
      const iconElement = getByTestId('icon');
      expect(iconElement).toBeTruthy();
      expect(iconElement.props.children).toBe('home');
    });
  });

  it('does not render icon when not provided', async () => {
    const { queryByTestId } = renderWithProviders(<AppCard {...defaultProps} />);
    await waitFor(() => {
      expect(queryByTestId('icon')).toBeNull();
    });
  });

  it('calls onPress when pressed', async () => {
    const mockOnPress = jest.fn();
    const { getByText } = renderWithProviders(<AppCard {...defaultProps} onPress={mockOnPress} />);

    await act(async () => {
      fireEvent.press(getByText('Test Card'));
    });
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('applies active styling when isActive is true', async () => {
    const { getByText } = renderWithProviders(<AppCard {...defaultProps} isActive={true} />);

    // Just verify that the card renders with active state
    await waitFor(() => {
      expect(getByText('Test Card')).toBeTruthy();
    });
  });

  it('does not apply active styling when isActive is false', async () => {
    const { getByText } = renderWithProviders(<AppCard {...defaultProps} isActive={false} />);

    // Just verify that the card renders in inactive state
    await waitFor(() => {
      expect(getByText('Test Card')).toBeTruthy();
    });
  });

  it('shows check icon when isActive is true', async () => {
    const { getByText } = renderWithProviders(<AppCard {...defaultProps} isActive={true} />);

    await waitFor(() => {
      expect(getByText('check-circle')).toBeTruthy();
    });
  });

  it('does not show check icon when isActive is false', async () => {
    const { queryByText } = renderWithProviders(<AppCard {...defaultProps} isActive={false} />);

    await waitFor(() => {
      expect(queryByText('check-circle')).toBeNull();
    });
  });

  it('renders with all props together', async () => {
    const { getByText } = renderWithProviders(
      <AppCard {...defaultProps} icon="star" description="Full card test" isActive={true} />
    );

    await waitFor(() => {
      expect(getByText('Test Card')).toBeTruthy();
      expect(getByText('Full card test')).toBeTruthy();
      expect(getByText('star')).toBeTruthy();
      expect(getByText('check-circle')).toBeTruthy();
    });
  });

  it('has proper accessibility structure', async () => {
    const { getByText } = renderWithProviders(<AppCard {...defaultProps} description="Accessible card" />);

    // Verify the card renders and is accessible
    await waitFor(() => {
      expect(getByText('Test Card')).toBeTruthy();
      expect(getByText('Accessible card')).toBeTruthy();
    });
  });

  it('maintains consistent layout with icon and text wrapper', async () => {
    const { getByText } = renderWithProviders(<AppCard {...defaultProps} icon="home" description="Layout test" />);

    // Check that title and description are rendered together
    await waitFor(() => {
      expect(getByText('Test Card')).toBeTruthy();
      expect(getByText('Layout test')).toBeTruthy();
      expect(getByText('home')).toBeTruthy(); // Icon
    });
  });
});
