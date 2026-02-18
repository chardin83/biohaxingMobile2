import { render } from '@testing-library/react-native';
import React from 'react';
import { TextStyle } from 'react-native';

import { AllProviders } from '@/test-utils/Providers';

import { ThemedText } from '../ThemedText';

  const renderWithProviders = (ui: React.ReactElement) =>
    render(ui, { wrapper: AllProviders });

  jest.mock('@/app/context/StorageContext', () => ({
  StorageProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    DefaultTheme: {
      dark: false,
      colors: {
        primary: '#6200ee',
        background: '#ffffff',
        card: '#f5f5f5',
        text: '#000000',
        border: '#cccccc',
        notification: '#ff80ab',
      },
    },
    // DarkTheme: {
    //   dark: true,
    //   colors: {
    //     primary: '#bb86fc',
    //     background: '#121212',
    //     card: '#1f1f1f',
    //     text: '#ffffff',
    //     border: '#272727',
    //     notification: '#ff80ab',
    //   },
    // },
  };
});

describe('ThemedText', () => {
  it('renders text correctly with default type', () => {
    const { getByText } = renderWithProviders(<ThemedText>Hello World</ThemedText>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('applies default style for default type', () => {
    const { getByText } = renderWithProviders(<ThemedText>Default Text</ThemedText>);
    const textElement = getByText('Default Text');

    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 14,
          lineHeight: 20,
        }),
      ])
    );
  });

  it('applies title style when type is title', () => {
    const { getByText } = renderWithProviders(<ThemedText type="title">Title Text</ThemedText>);
    const textElement = getByText('Title Text');

    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 32,
          fontWeight: 'bold',
          lineHeight: 40,
          marginBottom: 8,
        }),
      ])
    );
  });

  it('applies subtitle style when type is subtitle', () => {
    const { getByText } = renderWithProviders(<ThemedText type="subtitle">Subtitle Text</ThemedText>);
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
    const { getByText } = renderWithProviders(<ThemedText type="defaultSemiBold">Semi Bold Text</ThemedText>);
    const textElement = getByText('Semi Bold Text');

    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 14,
          lineHeight: 22,
          fontWeight: '600',
        }),
      ])
    );
  });

it('applies link style when type is link', () => {
  const { getByText } = renderWithProviders(<ThemedText type="link">Link Text</ThemedText>);
  const textElement = getByText('Link Text');

  // Flatten the style array
  const flatten = (arr: any[]): any[] =>
    arr.flatMap(item => (Array.isArray(item) ? flatten(item) : item));

  const flatStyle = flatten(Array.isArray(textElement.props.style) ? textElement.props.style : [textElement.props.style]);

  expect(flatStyle).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        fontSize: 16,
        lineHeight: 30,
      }),
    ])
  );
});

  it('uses theme color from useThemeColor hook', () => {
    const { getByText } = renderWithProviders(<ThemedText>Themed Text</ThemedText>);
    const textElement = getByText('Themed Text');

    // Flatten the style array
    const flatten = (arr: any[]): any[] =>
    arr.flatMap(item => (Array.isArray(item) ? flatten(item) : item));

    const flatStyle = flatten(Array.isArray(textElement.props.style) ? textElement.props.style : [textElement.props.style]);

    expect(flatStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          color: '#000000',
        }),
      ])
    );
  });

  it('accepts custom light and dark colors', () => {
    const { getByText } =   renderWithProviders(
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
    const customStyle: TextStyle = { fontWeight: 'bold', marginTop: 10 };
    const { getByText } = renderWithProviders(<ThemedText style={customStyle}>Custom Style Text</ThemedText>);
    const textElement = getByText('Custom Style Text');

    expect(textElement.props.style).toEqual(expect.arrayContaining([expect.objectContaining(customStyle)]));
  });

  it('passes through other Text props', () => {
    const { getByText } = renderWithProviders(
      <ThemedText numberOfLines={2} ellipsizeMode="tail">
        Long text that should be truncated
      </ThemedText>
    );
    const textElement = getByText('Long text that should be truncated');

    expect(textElement.props.numberOfLines).toBe(2);
    expect(textElement.props.ellipsizeMode).toBe('tail');
  });

  it('handles undefined type gracefully', () => {
    const { getByText } = renderWithProviders(<ThemedText type={undefined}>Undefined Type</ThemedText>);
    const textElement = getByText('Undefined Type');

    // Should apply default style
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fontSize: 14,
          lineHeight: 20,
        }),
      ])
    );
  });
});
