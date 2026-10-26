import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Linking } from 'react-native';

import ChatMessageContent, { openChatLink } from '@/components/ChatMessageContent';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));

it('renders study links as accessible links and opens the source', () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  const screen = render(<ChatMessageContent content={'Evidence overview\n\n[Read study](https://pubmed.ncbi.nlm.nih.gov/123/)'} />);
  fireEvent.press(screen.getByRole('link'));
  expect(open).toHaveBeenCalledWith('https://pubmed.ncbi.nlm.nih.gov/123/');
  open.mockRestore();
});

it('does not open HTTP or non-web schemes', () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  openChatLink('http://pubmed.ncbi.nlm.nih.gov/123/');
  openChatLink('ftp://example.com/data');
  openChatLink('file:///private/data');
  expect(open).not.toHaveBeenCalled();
  open.mockRestore();
});

it('allows HTTPS links to expert and organization websites', () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  openChatLink('https://www.example.org/researchers');
  expect(open).toHaveBeenCalledWith('https://www.example.org/researchers');
  open.mockRestore();
});

it('shows HTTP links as plain text instead of a non-working link', () => {
  const screen = render(<ChatMessageContent content={'[Expert website](http://example.org)'} />);
  expect(screen.getByText('Expert website')).toBeTruthy();
  expect(screen.queryByRole('link')).toBeNull();
});
