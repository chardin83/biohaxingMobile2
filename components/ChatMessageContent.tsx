import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import Markdown, { MarkdownIt, type RenderRules } from 'react-native-markdown-display';

const parser = MarkdownIt({ html: false, linkify: true }).disable('image');

function isHttpsLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /^https:\/\//i.test(url) && parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function openChatLink(url: string): boolean {
  if (isHttpsLink(url)) {
    Linking.openURL(url).catch(error => console.warn('Could not open chat source', error));
  }
  return false;
}

function ChatSourceLink({ url, children }: Readonly<{ url: string; children: React.ReactNode }>) {
  const { colors } = useTheme();
  if (!isHttpsLink(url)) return <Text style={{ color: colors.text }}>{children}</Text>;
  return <Text accessibilityRole="link" style={[styles.link, { color: colors.primaryText }]} onPress={() => openChatLink(url)}>{children}</Text>;
}

const rules: RenderRules = {
  link: (node, children) => <ChatSourceLink key={node.key} url={node.attributes.href}>{children}</ChatSourceLink>,
};

export default function ChatMessageContent({ content }: Readonly<{ content: string }>) {
  const { colors } = useTheme();
  return (
    <Markdown
      markdownit={parser}
      rules={rules}
      onLinkPress={openChatLink}
      style={{ body: { color: colors.text, fontSize: 16, lineHeight: 24 }, paragraph: { marginTop: 0, marginBottom: 8 } }}
    >
      {content}
    </Markdown>
  );
}

const styles = StyleSheet.create({ link: { textDecorationLine: 'underline' } });
