import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { ThemedView } from '../ThemedView';

// Mock the useThemeColor hook
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn((colors, colorName) => {
    if (colorName === 'background') {
      return '#000000'; // Default dark theme background color
    }
    return colors.light || colors.dark || '#FFFFFF';
  }),
}));

describe('ThemedView', () => {
  it('renders view correctly', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view">
        <Text>Test Content</Text>
      </ThemedView>
    );
    expect(getByTestId('themed-view')).toBeTruthy();
  });

  it('applies theme background color', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view">
        <Text>Test Content</Text>
      </ThemedView>
    );
    const viewElement = getByTestId('themed-view');

    expect(viewElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#000000',
        }),
      ])
    );
  });

  it('accepts custom light and dark colors', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view" lightColor="#FFFFFF" darkColor="#111111">
        <Text>Custom Color Content</Text>
      </ThemedView>
    );
    const viewElement = getByTestId('themed-view');

    // The color should come from the mocked useThemeColor
    expect(viewElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: expect.any(String),
        }),
      ])
    );
  });

  it('merges custom styles with theme styles', () => {
    const customStyle = { padding: 20, margin: 10 };
    const { getByTestId } = render(
      <ThemedView testID="themed-view" style={customStyle}>
        <Text>Custom Style Content</Text>
      </ThemedView>
    );
    const viewElement = getByTestId('themed-view');

    expect(viewElement.props.style).toEqual(expect.arrayContaining([expect.objectContaining(customStyle)]));
  });

  it('passes through other View props', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view" accessible={true} accessibilityLabel="Test View">
        <Text>Accessible Content</Text>
      </ThemedView>
    );
    const viewElement = getByTestId('themed-view');

    expect(viewElement.props.accessible).toBe(true);
    expect(viewElement.props.accessibilityLabel).toBe('Test View');
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>Child Element</Text>
      </ThemedView>
    );
    expect(getByText('Child Element')).toBeTruthy();
  });

  it('handles no children gracefully', () => {
    const { getByTestId } = render(<ThemedView testID="empty-view" />);
    expect(getByTestId('empty-view')).toBeTruthy();
  });

  it('overrides background color with custom style', () => {
    const customStyle = { backgroundColor: '#FF0000' };
    const { getByTestId } = render(
      <ThemedView testID="themed-view" style={customStyle}>
        <Text>Override Background</Text>
      </ThemedView>
    );
    const viewElement = getByTestId('themed-view');

    // Custom style should override the theme background
    expect(viewElement.props.style).toEqual([
      { backgroundColor: '#000000' }, // Theme color first
      customStyle, // Custom style second (overrides)
    ]);
  });
});
