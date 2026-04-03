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

  const iconColor = disabled ? colors.textMuted : textColorStyle.color;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        buttonVariantStyle,
        isPrimary && glow && {
          backgroundColor: colors.buttonGlowBackground,
          ...(Platform.OS === 'ios'
            ? {
                shadowColor: colors.buttonGlow,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 8,
              }
            : {
                elevation: 14,
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
      <View style={styles.content}>
        {icon && (
          <IconSymbol name={icon} size={26} color={iconColor} />
        )}
        <ThemedText
          type="defaultSemiBold"
          style={[
            styles.text,
            textColorStyle,
            icon && styles.textWithIcon,
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
      </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textWithIcon: {
    marginLeft: 4,
  },
  textShadow: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
});

export default AppButton;
