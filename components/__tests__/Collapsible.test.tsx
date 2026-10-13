import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { Collapsible } from '../Collapsible';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('../ThemedText', () => ({ ThemedText: require('react-native').Text }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));

it('supports opening a section through navigation and subsequent user toggles', () => {
  const onOpenChange = jest.fn();
  const { queryByText, getByText, rerender } = render(
    <Collapsible title="Supplements" isOpen={false} onOpenChange={onOpenChange}>
      <Text>Plans</Text>
    </Collapsible>
  );
  expect(queryByText('Plans')).toBeNull();
  rerender(
    <Collapsible title="Supplements" isOpen onOpenChange={onOpenChange}>
      <Text>Plans</Text>
    </Collapsible>
  );
  expect(getByText('Plans')).toBeTruthy();
  fireEvent.press(getByText('Supplements'));
  expect(onOpenChange).toHaveBeenCalledWith(false);
  rerender(
    <Collapsible title="Supplements" isOpen={false} onOpenChange={onOpenChange}>
      <Text>Plans</Text>
    </Collapsible>
  );
  expect(queryByText('Plans')).toBeNull();
});

it('preserves ordinary uncontrolled sections', () => {
  const { queryByText, getByText } = render(
    <Collapsible title="Other" initialCollapsed>
      <Text>Content</Text>
    </Collapsible>
  );
  expect(queryByText('Content')).toBeNull();
  fireEvent.press(getByText('Other'));
  expect(getByText('Content')).toBeTruthy();
});
