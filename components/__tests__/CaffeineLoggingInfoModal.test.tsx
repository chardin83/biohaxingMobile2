import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import CaffeineLoggingInfoModal from '@/components/journal/CaffeineLoggingInfoModal';
import DrinkLoggingInfoModal from '@/components/journal/DrinkLoggingInfoModal';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ userProfile: { bedtime: '23:00' } }) }));
jest.mock('@/components/ThemedModal', () => {
  const { View, Text, Pressable } = require('react-native');
  return { ThemedModal: ({ visible, title, children, onSave, okLabel, iconName }: any) => visible ? (
    <View testID="coffee-info" iconName={iconName}>
      <Text>{title}</Text>{children}<Pressable onPress={onSave}><Text>{okLabel}</Text></Pressable>
    </View>
  ) : null };
});
jest.mock('@/components/ui/DiscreetButton', () => {
  const { Pressable, Text } = require('react-native');
  return ({ title, onPress }: any) => <Pressable onPress={onPress}><Text>{title}</Text></Pressable>;
});

beforeEach(async () => {
  await AsyncStorage.clear();
  mockPush.mockClear();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());
const finishOpening = async () => { await act(async () => { await jest.advanceTimersByTimeAsync(400); }); };

it('shows both coffee tags on the first coffee log and remembers acknowledgement across mounts', async () => {
  const screen = render(<CaffeineLoggingInfoModal requestKey={0} />);
  expect(screen.queryByTestId('coffee-info')).toBeNull();
  screen.rerender(<CaffeineLoggingInfoModal requestKey={1} />);
  await finishOpening();
  expect(screen.getByTestId('coffee-info').props.iconName).toBe('book');
  expect(screen.getByText('common:lifeStyle.items.caffeine')).toBeTruthy();
  expect(screen.getByText('common:lifeStyle.items.caffeineBeforeSleep')).toBeTruthy();
  await act(async () => fireEvent.press(screen.getByText('caffeineLoggingInfo.understood')));
  expect(screen.queryByTestId('coffee-info')).toBeNull();
  screen.unmount();
  const nextVisit = render(<CaffeineLoggingInfoModal requestKey={1} />);
  await finishOpening();
  expect(nextVisit.queryByTestId('coffee-info')).toBeNull();
});

it('opens person settings at bedtime from the discreet link', async () => {
  const screen = render(<CaffeineLoggingInfoModal requestKey={1} />);
  await finishOpening();
  fireEvent.press(screen.getByText('caffeineLoggingInfo.changeBedtime'));
  expect(screen.queryByTestId('coffee-info')).toBeNull();
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(stack)/settings/person', params: { focus: 'bedtime' } });
});

it('shows both alcohol tags and remembers alcohol acknowledgement independently of caffeine', async () => {
  await AsyncStorage.setItem('caffeineLoggingInfoSeen', 'true');
  const screen = render(<DrinkLoggingInfoModal requestKey={1} kind="alcohol" />);
  await finishOpening();
  expect(screen.getByText('common:lifeStyle.items.alcohol')).toBeTruthy();
  expect(screen.getByText('common:lifeStyle.items.alcoholBeforeSleep')).toBeTruthy();
  expect(screen.getByText('alcoholLoggingInfo.beforeSleep')).toBeTruthy();
  await act(async () => fireEvent.press(screen.getByText('alcoholLoggingInfo.understood')));
  expect(await AsyncStorage.getItem('alcoholLoggingInfoSeen')).toBe('true');
  screen.unmount();
  const next = render(<DrinkLoggingInfoModal requestKey={1} kind="alcohol" />);
  await finishOpening();
  expect(next.queryByTestId('coffee-info')).toBeNull();
});
