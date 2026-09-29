import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Platform, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbolName } from '@/components/ui/icon-symbol-map';
import { IconSymbol } from '@/components/ui/IconSymbol';

type Variant = 'primary' | 'secondary' | 'danger';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  glow?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  icon?: IconSymbolName;
  rightIcon?: IconSymbolName;
  disabledText?: string;
  content?: React.ReactNode;
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
  glow = false,
  accessibilityLabel,
  accessibilityHint,
  icon,
  rightIcon,
  disabledText,
  content,
}) => {
  const { colors } = useTheme();
  const leftIcon = icon;

  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  let buttonVariantStyle;

  if (isPrimary) {
    buttonVariantStyle = {
      borderColor: colors.primary,
    };
  } else if (isDanger) {
    buttonVariantStyle = {
      backgroundColor: 'transparent',
      borderColor: colors.error,
    };
  } else {
    buttonVariantStyle = {
      backgroundColor: 'transparent',
      borderColor: colors.secondary,
    };
  }

  let textColorStyle;

  if (isPrimary) {
    textColorStyle = {
      color: colors.primary,
    };
  } else if (isDanger) {
    textColorStyle = {
      color: colors.error,
    };
  } else {
    textColorStyle = {
      color: colors.textLight,
    };
  }

  const iconColor = disabled ? colors.textMuted : textColorStyle.color;

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.button,
          buttonVariantStyle,
          isPrimary &&
            glow && {
              ...(Platform.OS === 'ios'
                ? {
                    backgroundColor: colors.buttonGlowBackground,
                    shadowColor: colors.buttonGlow,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.7,
                    shadowRadius: 8,
                  }
                : {
                    elevation: 20,
                    shadowColor: colors.buttonGlow,
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
        accessible
      >
        <View style={styles.buttonContent}>
          <View style={styles.content}>
            {leftIcon && <IconSymbol name={leftIcon} size={26} color={iconColor} />}

            <ThemedText type="defaultSemiBold" style={[styles.text, textColorStyle]}>
              {title}
            </ThemedText>

            {rightIcon && <IconSymbol name={rightIcon} size={18} color={iconColor} />}
          </View>

          {content}
        </View>
      </TouchableOpacity>

      {disabled && disabledText && (
        <ThemedText type="explainer" style={styles.disabledText}>
          {disabledText}
        </ThemedText>
      )}
    </>
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
  buttonContent: {
    width: '100%',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  text: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  disabledText: {
    textAlign: 'center',
    marginBottom: 18,
    marginTop: 2,
  },
});

export default AppButton;
