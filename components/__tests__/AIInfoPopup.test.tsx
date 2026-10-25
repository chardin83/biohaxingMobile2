import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ScrollView } from 'react-native';

import AIInfoPopup from '../AllInfoPopup';

let mockVisitedChat = true;
let mockForceOpenPopup = false;
const mockMarkVisited = jest.fn();
let mockInterestsConsent = true;
let mockPersonalConsent = false;
const mockClose = jest.fn();
const mockConfirm = jest.fn();
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { primary: 'turquoise' } }) }));
jest.mock('@/app/context/StorageContext', () => ({
  useStorage: () => ({
    hasVisitedChat: mockVisitedChat,
    setHasVisitedChat: mockMarkVisited,
    shareHealthPlan: true,
    shareInterests: mockInterestsConsent,
    profileSharing: { age: mockPersonalConsent },
  }),
}));
jest.mock('@/app/context/SessionStorage', () => ({ useSession: () => ({ forceOpenPopup: mockForceOpenPopup, setForceOpenPopup: jest.fn() }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/components/AISharingControls', () => ({ showRequiredErrors, onRequiredFieldLayout }: any) => {
  const React = require('react');
  const { Text } = require('react-native');
  React.useEffect(() => {
    onRequiredFieldLayout?.('healthPlan', 100);
    onRequiredFieldLayout?.('interests', 400);
    onRequiredFieldLayout?.('age', 900);
  }, [onRequiredFieldLayout]);
  return showRequiredErrors ? <Text>Required choices highlighted</Text> : null;
});
jest.mock('@/components/ThemedModal', () => ({
  ThemedModal: ({ onSave, onSaveDisabled, onClose, okLabel, children }: any) => {
    const { View, Pressable, Text } = require('react-native');
    return (
      <View>
        {children}
        <Pressable disabled={onSaveDisabled} onPress={onSave}>
          <Text>{okLabel}</Text>
        </Pressable>
        <Pressable onPress={onClose}>
          <Text>Close</Text>
        </Pressable>
      </View>
    );
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockPersonalConsent = false;
  mockInterestsConsent = true;
  mockVisitedChat = true;
  mockForceOpenPopup = false;
});
it('requires separate profile consent to generate, while allowing dismissal', () => {
  const screen = render(<AIInfoPopup visible setVisible={mockClose} requirePersonalDetails onConfirm={mockConfirm} />);
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  expect(mockConfirm).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Close'));
  expect(mockClose).toHaveBeenCalledWith(false);
});
it('generates directly after both permissions have been given', () => {
  mockPersonalConsent = true;
  const screen = render(<AIInfoPopup visible setVisible={mockClose} requirePersonalDetails onConfirm={mockConfirm} />);
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  expect(mockClose).toHaveBeenCalledWith(false);
  expect(mockConfirm).toHaveBeenCalledTimes(1);
});

it('requires interest sharing even if age and health plan are approved', () => {
  mockPersonalConsent = true;
  mockInterestsConsent = false;
  const screen = render(<AIInfoPopup visible setVisible={mockClose} requirePersonalDetails onConfirm={mockConfirm} />);
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  expect(mockConfirm).not.toHaveBeenCalled();
});

it('keeps the button active and scrolls to the first missing choice on press', async () => {
  const scroll = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => {});
  const screen = render(<AIInfoPopup visible setVisible={mockClose} requirePersonalDetails onConfirm={mockConfirm} />);
  expect(screen.queryByText('Required choices highlighted')).toBeNull();
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  expect(screen.getByText('Required choices highlighted')).toBeTruthy();
  await waitFor(() => expect(scroll).toHaveBeenCalledWith({ y: 888, animated: true }));
  expect(mockClose).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
  scroll.mockRestore();
});

it('prevents repeated confirmation while a request is running', () => {
  mockPersonalConsent = true;
  const screen = render(<AIInfoPopup visible busy setVisible={mockClose} requirePersonalDetails onConfirm={mockConfirm} />);
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  expect(mockConfirm).not.toHaveBeenCalled();
});

it('does not open plan sharing automatically for a first-time user or a chat popup request', () => {
  mockVisitedChat = false;
  mockForceOpenPopup = true;
  render(<AIInfoPopup visible={false} autoOpen={false} setVisible={mockClose} requirePersonalDetails onConfirm={mockConfirm} />);
  expect(mockClose).not.toHaveBeenCalledWith(true);
  expect(mockMarkVisited).not.toHaveBeenCalled();
});

it('preserves the first-visit popup for chat', () => {
  mockVisitedChat = false;
  render(<AIInfoPopup visible={false} setVisible={mockClose} />);
  expect(mockClose).toHaveBeenCalledWith(true);
  expect(mockMarkVisited).toHaveBeenCalledWith(true);
});
