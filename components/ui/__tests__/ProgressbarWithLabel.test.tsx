import { render } from '@testing-library/react-native';
import React from 'react';

import { AllProviders } from '@/test-utils/Providers';

import ProgressBarWithLabel from '../ProgressbarWithLabel';


  const renderWithProviders = (ui: React.ReactElement) =>
    render(ui, { wrapper: AllProviders });

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useTheme: () => ({
      colors: {
        progressBar: '#00FF00',
        textLight: '#AAAAAA',
        secondaryBackground: '#122033',
        text: '#000000',
      },
    }),
  };
});

// Mock react-native-progress
jest.mock('react-native-progress', () => ({
  Bar: ({ progress, width, unfilledColor, borderRadius, borderWidth, testID }: any) => {
    const { View } = require('react-native');
    // Om width är undefined eller '100%', använd 200
    const resolvedWidth = (width === undefined || width === '100%') ? 200 : width;
    return (
      <View
        testID={testID || 'progress-bar'}
        style={{
          width: resolvedWidth,
          height: 8,
          backgroundColor: unfilledColor,
          borderRadius,
          borderWidth,
        }}
        accessibilityValue={{ now: Math.round(progress * 100) }}
      />
    );
  },
}));

describe('ProgressBarWithLabel', () => {
  it('renders progress bar correctly', () => {
    const { getByTestId } = renderWithProviders(<ProgressBarWithLabel progress={0.5} width={200} />);
    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  it('displays label when provided', () => {
    const { getByText } = renderWithProviders(<ProgressBarWithLabel progress={0.7} label="70% Complete" width={200} />);
    expect(getByText('70% Complete')).toBeTruthy();
  });

  it('does not display label when not provided', () => {
    const { queryByText } = renderWithProviders(<ProgressBarWithLabel progress={0.5} width={200} />);
    expect(queryByText('50% Complete')).toBeNull();
  });

  it('uses default width when not specified', () => {
  const { getByTestId } = renderWithProviders(<ProgressBarWithLabel progress={0.5} />);

  const progressBar = getByTestId('progress-bar');
  expect(progressBar.props.style.width).toBe(200);
});

  it('uses custom width when provided', () => {
    const { getByTestId } = renderWithProviders(<ProgressBarWithLabel progress={0.5} width={300} />);
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.style.width).toBe(300);
  });

  it('applies correct progress value', () => {
    const { getByTestId } = renderWithProviders(<ProgressBarWithLabel progress={0.75} />);
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.accessibilityValue.now).toBe(75);
  });

  it('handles progress value of 0', () => {
    const { getByTestId } = renderWithProviders(<ProgressBarWithLabel progress={0} />);
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.accessibilityValue.now).toBe(0);
  });

  it('handles progress value of 1', () => {
    const { getByTestId } = renderWithProviders(<ProgressBarWithLabel progress={1} />);
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.accessibilityValue.now).toBe(100);
  });

it('applies correct styling to label', () => {
  const { getByText } = renderWithProviders(<ProgressBarWithLabel progress={0.5} label="Test Label" />);
  const labelElement = getByText('Test Label');

  // Platta ut style-arrayen till ett objekt
  const style = Array.isArray(labelElement.props.style)
    ? Object.assign({}, ...labelElement.props.style)
    : labelElement.props.style;

  expect(style).toEqual(
    expect.objectContaining({
      marginTop: 4,
      textAlign: 'center',
      color: '#AAAAAA',
      fontSize: 12,
    })
  );
});

  it('renders with all props together', () => {
    const { getByTestId, getByText } = renderWithProviders(<ProgressBarWithLabel progress={0.8} label="80% Progress" width={250} />);

    const progressBar = getByTestId('progress-bar');
    expect(progressBar).toBeTruthy();
    expect(progressBar.props.style.width).toBe(250);
    expect(progressBar.props.accessibilityValue.now).toBe(80);
    expect(getByText('80% Progress')).toBeTruthy();
  });

  it('maintains proper container structure', () => {
    const { getByTestId, getByText } = renderWithProviders(<ProgressBarWithLabel progress={0.6} label="Container Test" />);

    const progressBar = getByTestId('progress-bar');
    const label = getByText('Container Test');

    // Both should be rendered in the component
    expect(progressBar).toBeTruthy();
    expect(label).toBeTruthy();
  });

  it('handles edge case values gracefully', () => {
    const { getByTestId } = renderWithProviders(<ProgressBarWithLabel progress={-0.1} />);
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.accessibilityValue.now).toBe(-10);
  });

  it('handles values above 1 gracefully', () => {
    const { getByTestId } = renderWithProviders(<ProgressBarWithLabel progress={1.5} />);
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.accessibilityValue.now).toBe(150);
  });

  it('applies correct unfilled color', () => {
    const { getByTestId } = renderWithProviders(<ProgressBarWithLabel progress={0.3} />);
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.style.backgroundColor).toBe('#122033');
  });

  it('applies correct border properties', () => {
    const { getByTestId } = renderWithProviders(<ProgressBarWithLabel progress={0.3} />);
    const progressBar = getByTestId('progress-bar');
    expect(progressBar.props.style.borderRadius).toBe(5);
    expect(progressBar.props.style.borderWidth).toBe(0);
  });
});
