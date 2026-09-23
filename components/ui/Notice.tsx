import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type NoticeVariant = 'info' | 'success';

type NoticeProps = Readonly<{
  title: string;
  message: string;
  variant?: NoticeVariant;
  onDismiss?: () => void;
  dismissAccessibilityLabel?: string;
}>;

export default function Notice({ title, message, variant = 'info', onDismiss, dismissAccessibilityLabel = 'Dismiss' }: NoticeProps) {
  const { colors } = useTheme();

  const isInfo = variant === 'info';

  const backgroundColor = isInfo ? colors.infoWeak : colors.surfaceGreen;

  const accentColor = isInfo ? colors.infoColor : colors.surfaceGreenBorder;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor: accentColor,
        },
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: colors.cardBackground,
            borderColor: accentColor,
          },
        ]}
      >
        <ThemedText type="defaultSemiBold" style={[styles.iconText, { color: accentColor }]}>
          {isInfo ? 'i' : '\u2713'}
        </ThemedText>
      </View>
      <View style={styles.textContainer}>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText type="caption">{message}</ThemedText>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton} accessibilityLabel={dismissAccessibilityLabel}>
          <ThemedText type="defaultSemiBold" style={styles.dismissText}>
            X
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 10,
  },
  iconText: {
    fontSize: 17,
    lineHeight: 20,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  dismissButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 16,
  },
});
