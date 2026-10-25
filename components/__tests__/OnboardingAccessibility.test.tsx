import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import AppButton from '@/components/ui/AppButton';
import AppCard from '@/components/ui/AppCard';
import { Checkbox } from '@/components/ui/Checkbox';
import Container from '@/components/ui/Container';
import Notice from '@/components/ui/Notice';
import StepHeading from '@/components/ui/StepHeading';

const ReactNative = require('react-native') as typeof import('react-native');
let mockDark = false;
jest.mock('@react-navigation/native', () => ({
  useTheme: () => ({ dark: mockDark, colors: jest.requireActual('@/app/theme/Colors').Colors[mockDark ? 'dark' : 'light'] }),
}));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/hooks/useWearableStorageSync', () => ({ useWearableStorageSync: () => ({ sync: jest.fn(), isSyncing: false }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }) }));
jest.mock('@/components/BackButton', () => () => {
  const { Text } = require('react-native');
  return <Text>Back</Text>;
});
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('@/components/ui/XPBadge', () => () => null);
jest.mock('react-native-paper', () => ({ Icon: () => null }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

beforeEach(() => {
  mockDark = false;
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
});
afterEach(() => jest.restoreAllMocks());

it('exposes selectable cards with a name and checked state', () => {
  const select = jest.fn();
  const screen = render(<AppCard title="Sömn" description="Sov bättre" showCheckbox onPress={select} />);
  const card = screen.getByRole('checkbox', { name: 'Sömn. Sov bättre', checked: false });
  fireEvent.press(card);
  expect(select).toHaveBeenCalledTimes(1);
  screen.rerender(<AppCard title="Sömn" description="Sov bättre" showCheckbox isActive onPress={select} />);
  expect(screen.getByRole('checkbox', { name: 'Sömn. Sov bättre', checked: true })).toBeTruthy();
});

it('exposes disabled checkboxes and busy buttons to assistive technology', () => {
  const screen = render(
    <>
      <Checkbox checked label="Dela ålder" onPress={jest.fn()} disabled />
      <AppButton title="Sparar" onPress={jest.fn()} disabled busy />
    </>
  );
  expect(screen.getByRole('checkbox', { name: 'Dela ålder', checked: true, disabled: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Sparar', disabled: true, busy: true })).toBeTruthy();
});

it('announces error notices on iOS and exposes an alert for screen readers', () => {
  const original = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  try {
    const screen = render(<Notice variant="error" message="Välj minst 1 område för att fortsätta" />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(announce).toHaveBeenCalledWith('Välj minst 1 område för att fortsätta');
  } finally {
    announce.mockRestore();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: original });
  }
});

it.each([false, true])('themes the step header and single footer for dark=%s', async dark => {
  mockDark = dark;
  const screen = render(
    <Container showBackButton currentStep={1} totalSteps={7} footer={<Text>Continue</Text>}>
      <Text>Content</Text>
    </Container>
  );
  const footer = screen.getByTestId('container-footer');
  const header = screen.getByTestId('container-step-header');
  const expected = dark ? 'rgba(11,16,33,0.98)' : Colors.light.background;
  expect(StyleSheet.flatten(footer.props.style).backgroundColor).toBe(expected);
  expect(StyleSheet.flatten(header.props.style).backgroundColor).toBe(expected);
  expect(screen.getAllByText('Continue')).toHaveLength(1);
  await act(async () => {
    footer.props.onLayout({ nativeEvent: { layout: { height: 260 } } });
    header.props.onLayout({ nativeEvent: { layout: { height: 170 } } });
  });
  const contentStyle = StyleSheet.flatten(screen.UNSAFE_getByType(ScrollView).props.contentContainerStyle);
  expect(contentStyle.paddingBottom).toBe(284);
  expect(contentStyle.paddingTop).toBe(190);
});

it('keeps the footer in the scrollable content when system text is enlarged', () => {
  jest.mocked(ReactNative.useWindowDimensions).mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 2 });
  const screen = render(
    <Container showBackButton currentStep={1} totalSteps={7} footer={<Text>Continue</Text>}>
      <Text>Content</Text>
    </Container>
  );
  const footer = screen.getByTestId('container-footer');
  expect(StyleSheet.flatten(footer.props.style).position).toBe('relative');
  expect(screen.getAllByText('Continue')).toHaveLength(1);
  const scroll = screen.UNSAFE_getByType(ScrollView);
  expect(scroll.findAllByProps({ testID: 'container-footer' }).length).toBeGreaterThan(0);
});

it('moves screen reader focus to the heading when a step changes', async () => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);
  jest.spyOn(ReactNative, 'findNodeHandle').mockReturnValue(123);
  const focus = jest.spyOn(AccessibilityInfo, 'setAccessibilityFocus').mockImplementation(() => {});
  try {
    const screen = render(<StepHeading>Personliga uppgifter</StepHeading>);
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
    expect(focus).toHaveBeenCalledWith(123);
    focus.mockClear();
    screen.rerender(<StepHeading>Aktivitetsnivå</StepHeading>);
    expect(screen.getByRole('header', { name: 'Aktivitetsnivå' })).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
    expect(focus).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});

it('keeps primary button text readable on the light onboarding gradient and footer', () => {
  const luminance = (hex: string) =>
    [1, 3, 5]
      .map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
      .map(value => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  for (const background of [...Colors.light.gradients.sunrise.colors, '#F8F5F0', Colors.light.secondaryBackground]) {
    const contrast = (luminance(background) + 0.05) / (luminance(Colors.light.primaryText) + 0.05);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  }
});
