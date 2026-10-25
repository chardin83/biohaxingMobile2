import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { DEFAULT_PROFILE_SHARING } from '@/types/aiSharing';

import AISharingControls from '../AISharingControls';

const mockSetPlan = jest.fn().mockResolvedValue(undefined);
const mockSetPersonal = jest.fn().mockResolvedValue(undefined);
const mockStorage = {
  shareHealthPlan: true,
  shareInterests: true,
  setShareInterests: jest.fn().mockResolvedValue(undefined),
  shareArchivedPlans: false,
  setShareArchivedPlans: jest.fn().mockResolvedValue(undefined),
  setShareHealthPlan: mockSetPlan,
  profileSharing: { ...DEFAULT_PROFILE_SHARING },
  setProfileSharing: mockSetPersonal,
};
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => mockStorage }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { error: 'red', border: 'gray' } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('@/components/ThemedText', () => ({
  ThemedText: ({ children }: any) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockStorage.profileSharing = { ...DEFAULT_PROFILE_SHARING };
  mockStorage.shareArchivedPlans = false;
  mockStorage.shareHealthPlan = true;
  mockStorage.shareInterests = true;
});
it('keeps personal details separate and unchecked until explicitly selected', async () => {
  const screen = render(<AISharingControls requirePersonalDetails />);
  expect(screen.getByLabelText('aiSharing.healthPlan').props.accessibilityState.checked).toBe(true);
  expect(screen.getByLabelText('aiSharing.fields.age.label').props.accessibilityState.checked).toBe(false);
  fireEvent.press(screen.getByLabelText('aiSharing.fields.age.label'));
  await waitFor(() => expect(mockSetPersonal).toHaveBeenCalledWith({ ...DEFAULT_PROFILE_SHARING, age: true }));
  expect(mockSetPlan).not.toHaveBeenCalled();
  expect(screen.getByText('aiSharing.requiredForPlan')).toBeTruthy();
});
it('surfaces a failure to save consent', async () => {
  mockSetPersonal.mockRejectedValueOnce(new Error('storage unavailable'));
  const screen = render(<AISharingControls />);
  fireEvent.press(screen.getByLabelText('aiSharing.fields.age.label'));
  await waitFor(() => expect(screen.getByText('aiSharing.saveError')).toBeTruthy());
});

it.each(['activityPal'] as const)('saves %s independently of age and other fields', async field => {
  const screen = render(<AISharingControls requirePersonalDetails />);
  fireEvent.press(screen.getByLabelText(`aiSharing.fields.${field}.label`));
  await waitFor(() => expect(mockSetPersonal).toHaveBeenCalledWith({ ...DEFAULT_PROFILE_SHARING, [field]: true }));
  expect(mockSetPlan).not.toHaveBeenCalled();
});

it('does not offer sex, height or weight for AI sharing', () => {
  const screen = render(<AISharingControls />);
  for (const field of ['biologicalSex', 'heightCm', 'weightKg']) expect(screen.queryByLabelText(`aiSharing.fields.${field}.label`)).toBeNull();
});

it('offers archives as a separate optional permission', async () => {
  const screen = render(<AISharingControls requirePersonalDetails />);
  expect(screen.getByLabelText('aiSharing.interests').props.accessibilityState.checked).toBe(true);
  expect(screen.getByLabelText('aiSharing.archivedPlans').props.accessibilityState.checked).toBe(false);
  fireEvent.press(screen.getByLabelText('aiSharing.archivedPlans'));
  await waitFor(() => expect(mockStorage.setShareArchivedPlans).toHaveBeenCalledWith(true));
  expect(mockSetPersonal).not.toHaveBeenCalled();
});

it('marks only missing required choices red and clears them as they are selected', () => {
  const screen = render(<AISharingControls requirePersonalDetails showRequiredErrors />);
  expect(StyleSheet.flatten(screen.getByTestId('sharing-age').props.style).borderColor).toBe('red');
  expect(StyleSheet.flatten(screen.getByTestId('sharing-healthPlan').props.style).borderColor).toBe('gray');
  expect(StyleSheet.flatten(screen.getByTestId('sharing-activityPal').props.style).borderColor).toBe('gray');
  expect(screen.queryByText('aiSharing.requiredChoice')).toBeNull();
  mockStorage.profileSharing = { ...DEFAULT_PROFILE_SHARING, age: true };
  screen.rerender(<AISharingControls requirePersonalDetails showRequiredErrors />);
  expect(StyleSheet.flatten(screen.getByTestId('sharing-age').props.style).borderColor).toBe('gray');
  expect(screen.queryByText('aiSharing.requiredChoice')).toBeNull();
});

it.each(['healthPlan', 'interests', 'age'] as const)('marks %s red when unchecked without submitting', async field => {
  mockStorage.profileSharing = { ...DEFAULT_PROFILE_SHARING, age: true };
  const screen = render(<AISharingControls requirePersonalDetails />);
  expect(StyleSheet.flatten(screen.getByTestId(`sharing-${field}`).props.style).borderColor).toBe('gray');
  const label = field === 'age' ? 'aiSharing.fields.age.label' : `aiSharing.${field}`;
  fireEvent.press(screen.getByLabelText(label));
  if (field === 'healthPlan') {
    await waitFor(() => expect(mockSetPlan).toHaveBeenCalledWith(false));
    mockStorage.shareHealthPlan = false;
  } else if (field === 'interests') {
    await waitFor(() => expect(mockStorage.setShareInterests).toHaveBeenCalledWith(false));
    mockStorage.shareInterests = false;
  } else {
    await waitFor(() => expect(mockSetPersonal).toHaveBeenCalled());
    mockStorage.profileSharing.age = false;
  }
  screen.rerender(<AISharingControls requirePersonalDetails />);
  expect(StyleSheet.flatten(screen.getByTestId(`sharing-${field}`).props.style).borderColor).toBe('red');
});

it.each([
  ['sharing-healthPlan', 'aiSharing.healthPlanDescription', 'plan'],
  ['sharing-interests', 'aiSharing.interestsDescription', 'interests'],
  ['sharing-archivedPlans', 'aiSharing.archivedPlansDescription', 'archives'],
  ['sharing-age', 'aiSharing.fields.age.description', 'age'],
  ['sharing-activityPal', 'aiSharing.fields.activityPal.description', 'activity'],
] as const)('toggles the whole %s card, including the description, exactly once', async (testID, description, kind) => {
  const screen = render(<AISharingControls requirePersonalDetails />);
  const setters = {
    plan: mockSetPlan,
    interests: mockStorage.setShareInterests,
    archives: mockStorage.setShareArchivedPlans,
    age: mockSetPersonal,
    activity: mockSetPersonal,
  };
  expect(screen.getByTestId(testID).props.accessibilityRole).toBe('checkbox');
  fireEvent.press(screen.getByText(description));
  await waitFor(() => expect(setters[kind]).toHaveBeenCalledTimes(1));
});
