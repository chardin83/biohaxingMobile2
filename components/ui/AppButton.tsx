import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Platform, StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';

type Variant = 'primary' | 'secondary' | 'danger';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  glow?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string; // Lägg till denna rad
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
  glow = false,
  accessibilityLabel,
  accessibilityHint, // Lägg till denna rad
}) => {
  const { colors } = useTheme();

  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  let buttonVariantStyle;
  if (isPrimary) {
    buttonVariantStyle = { borderColor: colors.primary };
  } else if (isDanger) {
    buttonVariantStyle = { backgroundColor: 'transparent', borderColor: colors.error };
  } else {
    buttonVariantStyle = { backgroundColor: 'transparent', borderColor: colors.secondary };
  }

  // Determine the text color style based on variant
  let textColorStyle;
  if (isPrimary) {
    textColorStyle = { color: colors.primary };
  } else if (isDanger) {
    textColorStyle = { color: colors.error };
  } else {
    textColorStyle = { color: colors.textLight };
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        buttonVariantStyle,
        isPrimary && glow && {
          backgroundColor: colors.background,
          ...(Platform.OS === 'ios'
            ? {
                shadowColor: colors.buttonGlow,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 8,
              }
            : {
                elevation: 6,
              }),
        },
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      accessible={true}
    >
      <ThemedText
        type="defaultSemiBold"
        style={[
          styles.text,
          textColorStyle,
          isPrimary &&
            glow &&
            (Platform.OS === 'ios' || Platform.OS === 'android') &&
            [
              styles.textShadow,
              { textShadowColor: colors.buttonTextGlow },
            ],
        ]}
      >
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
};

const baseStyle: ViewStyle = {
  paddingVertical: 14,
  paddingHorizontal: 18,
  borderRadius: globalStyles.borders.borderRadius,
  alignItems: 'center',
  justifyContent: 'center',
};

const styles = StyleSheet.create({
  button: {
    ...baseStyle,
    borderWidth: 1.5,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textShadow: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
});

export default AppButton;
