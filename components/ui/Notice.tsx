import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

import { IconSymbol } from './IconSymbol';

type NoticeVariant = 'info' | 'success' | 'warning';

type NoticeProps = Readonly<{
  title?: string;
  message: string;
  variant?: NoticeVariant;
  onDismiss?: () => void;
  dismissAccessibilityLabel?: string;
}>;

export default function Notice({ title, message, variant = 'info', onDismiss, dismissAccessibilityLabel = 'Dismiss' }: NoticeProps) {
  const { colors } = useTheme();

  const isWarning = variant === 'warning';

  const variantStyles = {
    info: { backgroundColor: colors.infoWeak, accentColor: colors.infoColor, iconName: 'info' },
    success: { backgroundColor: colors.surfaceGreen, accentColor: colors.surfaceGreenBorder, iconName: 'check' },
    warning: { backgroundColor: colors.surfaceWarning, accentColor: colors.warning, iconName: 'warning' },
  } as const;

  const { backgroundColor, accentColor, iconName } = variantStyles[variant];

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
        <IconSymbol name={iconName} size={16} color={accentColor} />
      </View>
      <View style={styles.textContainer}>
        {title ? (
          <ThemedText type="defaultSemiBold" style={isWarning ? { color: colors.warning } : undefined}>
            {title}
          </ThemedText>
        ) : null}
        <ThemedText type="caption" style={isWarning ? { color: colors.warning } : undefined}>
          {message}
        </ThemedText>
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
