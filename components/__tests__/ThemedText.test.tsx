import { render } from '@testing-library/react-native';
import React from 'react';

import { ThemedText } from '../ThemedText';

// Mock the useThemeColor hook
jest.mock('@/hooks/useThemeColor', () => ({
  useThemeColor: jest.fn((colors, colorName) => {
    if (colorName === 'text') {
      return '#FFFFFF'; // Default dark theme text color
    }
    return colors.light || colors.dark || '#000000';
  }),
}));

describe('ThemedText', () => {
  it('renders text correctly with default type', () => {
    const { getByText } = render(<ThemedText>Hello World</ThemedText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('applies default style for default type', () => {
    const { getByText } = render(<ThemedText>Default Text</ThemedText>);
    const textElement = getByText('Default Text');
    
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 16,
          lineHeight: 24,
        }),
      ])
    );
  });

  it('applies title style when type is title', () => {
    const { getByText } = render(<ThemedText type="title">Title Text</ThemedText>);
    const textElement = getByText('Title Text');
    
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 32,
          fontWeight: 'bold',
          lineHeight: 32,
        }),
      ])
    );
  });

  it('applies subtitle style when type is subtitle', () => {
    const { getByText } = render(<ThemedText type="subtitle">Subtitle Text</ThemedText>);
    const textElement = getByText('Subtitle Text');
    
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 20,
          fontWeight: 'bold',
        }),
      ])
    );
  });

  it('applies defaultSemiBold style when type is defaultSemiBold', () => {
    const { getByText } = render(<ThemedText type="defaultSemiBold">Semi Bold Text</ThemedText>);
    const textElement = getByText('Semi Bold Text');
    
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 16,
          lineHeight: 24,
          fontWeight: '600',
        }),
      ])
    );
  });

  it('applies link style when type is link', () => {
    const { getByText } = render(<ThemedText type="link">Link Text</ThemedText>);
    const textElement = getByText('Link Text');
    
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lineHeight: 30,
          fontSize: 16,
          color: '#0a7ea4',
        }),
      ])
    );
  });

  it('uses theme color from useThemeColor hook', () => {
    const { getByText } = render(<ThemedText>Themed Text</ThemedText>);
    const textElement = getByText('Themed Text');
    
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: '#FFFFFF',
        }),
      ])
    );
  });

  it('accepts custom light and dark colors', () => {
    const { getByText } = render(
      <ThemedText lightColor="#FF0000" darkColor="#00FF00">
        Custom Color Text
      </ThemedText>
    );
    const textElement = getByText('Custom Color Text');
    
    // The color should come from the mocked useThemeColor
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: expect.any(String),
        }),
      ])
    );
  });

  it('merges custom styles with theme styles', () => {
    const customStyle = { fontWeight: 'bold', marginTop: 10 };
    const { getByText } = render(
      <ThemedText style={customStyle}>Custom Style Text</ThemedText>
    );
    const textElement = getByText('Custom Style Text');
    
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle),
      ])
    );
  });

  it('passes through other Text props', () => {
    const { getByText } = render(
      <ThemedText numberOfLines={2} ellipsizeMode="tail">
        Long text that should be truncated
      </ThemedText>
    );
    const textElement = getByText('Long text that should be truncated');
    
    expect(textElement.props.numberOfLines).toBe(2);
    expect(textElement.props.ellipsizeMode).toBe('tail');
  });

  it('handles undefined type gracefully', () => {
    const { getByText } = render(<ThemedText type={undefined}>Undefined Type</ThemedText>);
    const textElement = getByText('Undefined Type');
    
    // Should apply default style
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 16,
          lineHeight: 24,
        }),
      ])
    );
  });
});