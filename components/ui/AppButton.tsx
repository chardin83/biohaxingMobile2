import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import { Colors } from '@/app/theme/Colors';

type Variant = 'primary' | 'secondary' | 'danger';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  glow?: boolean;
  accessibilityLabel?: string;
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
  glow = false,
  accessibilityLabel,
}) => {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  let buttonVariantStyle;
  if (isPrimary) {
    buttonVariantStyle = styles.primary;
  } else if (isDanger) {
    buttonVariantStyle = styles.danger;
  } else {
    buttonVariantStyle = styles.secondary;
  }

  // Determine the text color style based on variant
  let textColorStyle;
  if (isPrimary) {
    textColorStyle = styles.primaryText;
  } else if (isDanger) {
    textColorStyle = styles.dangerText;
  } else {
    textColorStyle = styles.secondaryText;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        buttonVariantStyle,
        isPrimary && glow && styles.primaryGlow,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel || title}
    >
      {/* Determine the text color style based on variant */}
      <Text
        style={[
          styles.text,
          textColorStyle,
          isPrimary && glow && styles.primaryTextGlow,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const baseStyle: ViewStyle = {
  paddingVertical: 14,
  paddingHorizontal: 18,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
};

const styles = StyleSheet.create({
  button: {
    ...baseStyle,
    borderWidth: 1.5,
  },
  primary: {
    borderColor: Colors.dark.primary,
  },
  primaryGlow: {
    backgroundColor: Colors.dark.background,
    shadowColor: Colors.dark.buttonGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: Colors.dark.borderLight,
  },
  danger: {
    backgroundColor: 'transparent',
    borderColor: Colors.dark.error,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryText: {
    color: Colors.dark.primary,
  },
  primaryTextGlow: {
    textShadowColor: Colors.dark.buttonTextGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  secondaryText: {
    color: Colors.dark.textLight,
  },
  dangerText: {
    color: Colors.dark.error,
  },
});

export default AppButton;
