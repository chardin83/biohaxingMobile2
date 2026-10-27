import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

interface CancelButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityHint?: string;
}

export const CancelButton: React.FC<CancelButtonProps> = ({ onPress, style, disabled = false, accessibilityHint }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const label = t('general.cancel');
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.cancelTextButton, disabled && styles.disabled, style]}
      disabled={disabled}
      accessible
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ThemedText type="defaultSemiBold" style={[styles.cancelText, { color: colors.text }]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cancelTextButton: {
    minHeight: 48,
    minWidth: 48,
    paddingVertical: 14,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  cancelText: {
    flexShrink: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
