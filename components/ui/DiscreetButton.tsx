import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '../ThemedText';
import type { IconSymbolName } from './icon-symbol-map';
import { IconSymbol } from './IconSymbol';

interface DiscreetButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  larger?: boolean;
  color?: string;
  icon?: IconSymbolName;
  rightIcon?: IconSymbolName;
  accessibilityRole?: 'button' | 'link';
}

const DiscreetButton: React.FC<DiscreetButtonProps> = ({ title, onPress, disabled, larger, color, icon, rightIcon, accessibilityRole = 'button' }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.6}
      accessibilityRole={accessibilityRole}
      disabled={disabled}
    >
      {icon && <IconSymbol name={icon} size={18} color={disabled ? colors.textMuted : (color ?? colors.primary)} />}
      <ThemedText type="buttonText" style={[larger && styles.addTargetButtonText, { color: disabled ? colors.textMuted : (color ?? colors.primary) }]}>
        {title}
      </ThemedText>
      {rightIcon && <IconSymbol name={rightIcon} size={18} color={disabled ? colors.textMuted : (color ?? colors.primary)} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addTargetButtonText: {
    fontSize: 16,
  },
  button: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

export default DiscreetButton;
