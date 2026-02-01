import { useTheme } from '@react-navigation/native';
import React, { ReactNode } from 'react';
import { StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';

export type BadgeVariant = 'default' | 'overlay';

type BadgeProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: BadgeVariant;
  onPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
};

const Badge: React.FC<BadgeProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
  disabled,
  activeOpacity = 0.8,
}) => {
  const { colors } = useTheme();

  const variantStyle =
    variant === 'overlay'
      ? {
          backgroundColor: colors.overlayLight,
          borderColor: colors.borderLight,
        }
      : {
          backgroundColor: colors.secondary,
          borderColor: colors.borderLight,
        };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={activeOpacity}
        style={[globalStyles.badge, variantStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[globalStyles.badge, variantStyle, style]}>{children}</View>;
};

export default Badge;
