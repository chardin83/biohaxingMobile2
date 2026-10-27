import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Linking, Platform } from 'react-native';

import HealthSyncSettings from '../HealthSyncSettings';

const mockSave = jest.fn().mockResolvedValue(undefined);
let mockHidden = false;
let mockConnected = false;
const mockMarkConnected = jest.fn().mockResolvedValue(undefined);
const mockSetSync = jest.fn();
const mockSetAdapter = jest.fn().mockResolvedValue(undefined);
const mockGetStatus = jest.fn().mockResolvedValue({ state: 'connected', source: 'healthkit' });
jest.mock('@/app/context/StorageContext', () => ({
  useStorage: () => ({ healthSyncEnabled: false, setHealthSyncEnabled: mockSetSync,
    hasConnectedAppleHealth: mockConnected, markAppleHealthConnected: mockMarkConnected, hideHealthSyncPrompt: mockHidden, setHideHealthSyncPrompt: mockSave }),
}));
jest.mock('@/wearables/wearableProvider', () => ({ useWearable: () => ({ setAdapter: mockSetAdapter }) }));
jest.mock('@/wearables/healthkitAdapter', () => jest.fn().mockImplementation(() => ({ getStatus: mockGetStatus })));
jest.mock('@/components/ui/AppButton', () => ({ __esModule: true, default: ({ title, disabled, onPress }: any) => {
  const { Pressable, Text } = require('react-native');
  return <Pressable disabled={disabled} onPress={onPress}><Text>{title}</Text></Pressable>;
} }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/services/healtConnectServices', () => ({ requestHealthConnectPermissions: jest.fn() }));
jest.mock('@/components/ui/SettingIcon', () => () => null);
jest.mock('@/components/ui/inputs/ThemedSwitch', () => () => null);
jest.mock(
  '@/components/ui/SettingsCard',
  () =>
    ({ children }: any) =>
      children
);
jest.mock('@/components/ThemedText', () => ({
  ThemedText: ({ children }: any) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));
jest.mock('@/components/ui/inputs/Checkbox', () => ({
  Checkbox: ({ checked, label, onPress, disabled }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable accessibilityLabel={label} accessibilityState={{ checked }} disabled={disabled} onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    );
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockHidden = false;
  mockConnected = false;
  mockGetStatus.mockResolvedValue({ state: 'connected', source: 'healthkit' });
});
it.each(['ios', 'android'] as const)('can disable and re-enable the health prompt on %s', async platform => {
  const replacement = jest.replaceProperty(Platform, 'OS', platform);
  try {
    const screen = render(<HealthSyncSettings />);
    const key = platform === 'ios' ? 'settings:healthSync.hideApplePrompt' : 'settings:healthSync.hideAndroidPrompt';
    fireEvent.press(screen.getByLabelText(key));
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(true));
    mockHidden = true;
    screen.rerender(<HealthSyncSettings />);
    await waitFor(() => expect(screen.getByLabelText(key).props.accessibilityState.checked).toBe(true));
    fireEvent.press(screen.getByLabelText(key));
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(false));
  } finally {
    replacement.restore();
  }
});
it('shows an error if saving the preference fails', async () => {
  mockSave.mockRejectedValueOnce(new Error('storage'));
  const screen = render(<HealthSyncSettings />);
  const key = Platform.OS === 'ios' ? 'settings:healthSync.hideApplePrompt' : 'settings:healthSync.hideAndroidPrompt';
  fireEvent.press(screen.getByLabelText(key));
  await waitFor(() => expect(screen.getByText('settings:healthSync.preferenceSaveError')).toBeTruthy());
});

it('runs HealthKit authorization before recording the first connection', async () => {
  const replacement = jest.replaceProperty(Platform, 'OS', 'ios');
  try {
    const screen = render(<HealthSyncSettings />);
    fireEvent.press(screen.getByText('settings:healthSync.connectApple'));
    await waitFor(() => expect(mockMarkConnected).toHaveBeenCalledTimes(1));
    expect(mockGetStatus).toHaveBeenCalled();
    expect(mockSetAdapter).toHaveBeenCalled();
    expect(mockSetSync).toHaveBeenCalledWith(true);
    mockConnected = true;
    screen.rerender(<HealthSyncSettings />);
    expect(screen.getByText('settings:healthSync.openApple')).toBeTruthy();
    expect(screen.getByText('settings:healthSync.manageAppleData')).toBeTruthy();
  } finally { replacement.restore(); }
});
it('does not record connection history when authorization fails', async () => {
  const replacement = jest.replaceProperty(Platform, 'OS', 'ios');
  try {
    mockGetStatus.mockResolvedValueOnce({ state: 'error' });
    const screen = render(<HealthSyncSettings />);
    fireEvent.press(screen.getByText('settings:healthSync.connectApple'));
    await waitFor(() => expect(screen.getByText('settings:healthSync.connectionError')).toBeTruthy());
    expect(mockMarkConnected).not.toHaveBeenCalled();
    expect(mockSetSync).not.toHaveBeenCalled();
  } finally { replacement.restore(); }
});
it('opens Apple Health instead of requesting authorization again after a prior connection', async () => {
  const replacement = jest.replaceProperty(Platform, 'OS', 'ios');
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  try {
    mockConnected = true;
    const screen = render(<HealthSyncSettings />);
    fireEvent.press(screen.getByText('settings:healthSync.openApple'));
    await waitFor(() => expect(open).toHaveBeenCalledWith('x-apple-health://'));
    expect(mockGetStatus).not.toHaveBeenCalled();
    expect(mockMarkConnected).not.toHaveBeenCalled();
  } finally { replacement.restore(); open.mockRestore(); }
});
