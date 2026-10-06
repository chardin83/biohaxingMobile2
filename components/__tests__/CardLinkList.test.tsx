import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Image, Text } from 'react-native';

import { CardLinkList } from '../ui/CardLinkList';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { text: '#111', textMuted: '#777', borderLight: '#ddd' } }) }));
jest.mock('../ThemedText', () => ({
  ThemedText: ({ children }: any) => {
    const mockReact = require('react');
    return mockReact.createElement(require('react-native').Text, null, children);
  },
}));
jest.mock('../ui/SettingIcon', () => ({ __esModule: true, default: () => null }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));

it('retains the image, subtitle, accessory and action for a single row', () => {
  const onPress = jest.fn();
  const { getByText, UNSAFE_getByType } = render(
    <CardLinkList rows={[{ key: 'food', title: 'Food', subtitle: 'Choose food', image: { uri: 'food.png' }, accessory: <Text>Info</Text>, onPress }]} />
  );
  expect(getByText('Choose food')).toBeTruthy();
  expect(getByText('Info')).toBeTruthy();
  expect(UNSAFE_getByType(Image).props.source).toEqual({ uri: 'food.png' });
  fireEvent.press(getByText('Food'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('supports multiple rows, disabled actions, and expanded content through the same API', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <CardLinkList
      showIcon={false}
      rows={[
        { key: 'open', title: 'Open', expanded: true, content: <Text>Details</Text>, onPress },
        { key: 'disabled', title: 'Disabled', disabled: true, onPress },
      ]}
    />
  );
  expect(getByText('Details')).toBeTruthy();
  fireEvent.press(getByText('Disabled'));
  expect(onPress).not.toHaveBeenCalled();
  fireEvent.press(getByText('Open'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
