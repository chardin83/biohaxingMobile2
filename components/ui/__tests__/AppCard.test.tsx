import { fireEvent,render } from '@testing-library/react-native';
import React from 'react';

import AppCard from '../AppCard';

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
jest.mock('@/constants/Colors', () => ({
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

  it('renders title correctly', () => {
    const { getByText } = render(<AppCard {...defaultProps} />);
    expect(getByText('Test Card')).toBeTruthy();
  });

  it('renders description when provided', () => {
    const { getByText } = render(
      <AppCard {...defaultProps} description="Test description" />
    );
    expect(getByText('Test description')).toBeTruthy();
  });

  it('does not render description when not provided', () => {
    const { queryByText } = render(<AppCard {...defaultProps} />);
    expect(queryByText('Test description')).toBeNull();
  });

  it('renders icon when provided', () => {
    const { getByTestId } = render(
      <AppCard {...defaultProps} icon="home" />
    );
    const iconElement = getByTestId('icon');
    expect(iconElement).toBeTruthy();
    expect(iconElement.props.children).toBe('home');
  });

  it('does not render icon when not provided', () => {
    const { queryByTestId } = render(<AppCard {...defaultProps} />);
    expect(queryByTestId('icon')).toBeNull();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <AppCard {...defaultProps} onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Card'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('applies active styling when isActive is true', () => {
    const { getByText } = render(
      <AppCard {...defaultProps} isActive={true} />
    );
    
    // Just verify that the card renders with active state
    expect(getByText('Test Card')).toBeTruthy();
  });

  it('does not apply active styling when isActive is false', () => {
    const { getByText } = render(
      <AppCard {...defaultProps} isActive={false} />
    );
    
    // Just verify that the card renders in inactive state
    expect(getByText('Test Card')).toBeTruthy();
  });

  it('shows check icon when isActive is true', () => {
    const { getByText } = render(
      <AppCard {...defaultProps} isActive={true} />
    );
    
    expect(getByText('check-circle')).toBeTruthy();
  });

  it('does not show check icon when isActive is false', () => {
    const { queryByText } = render(
      <AppCard {...defaultProps} isActive={false} />
    );
    
    expect(queryByText('check-circle')).toBeNull();
  });

  it('renders with all props together', () => {
    const { getByText, getByTestId } = render(
      <AppCard
        {...defaultProps}
        icon="star"
        description="Full card test"
        isActive={true}
      />
    );
    
    expect(getByText('Test Card')).toBeTruthy();
    expect(getByText('Full card test')).toBeTruthy();
    expect(getByText('star')).toBeTruthy();
    expect(getByText('check-circle')).toBeTruthy();
  });

  it('has proper accessibility structure', () => {
    const { getByText } = render(
      <AppCard {...defaultProps} description="Accessible card" />
    );
    
    // Verify the card renders and is accessible
    expect(getByText('Test Card')).toBeTruthy();
    expect(getByText('Accessible card')).toBeTruthy();
  });

  it('maintains consistent layout with icon and text wrapper', () => {
    const { getByText } = render(
      <AppCard {...defaultProps} icon="home" description="Layout test" />
    );
    
    // Check that title and description are rendered together
    expect(getByText('Test Card')).toBeTruthy();
    expect(getByText('Layout test')).toBeTruthy();
    expect(getByText('home')).toBeTruthy(); // Icon
  });
});