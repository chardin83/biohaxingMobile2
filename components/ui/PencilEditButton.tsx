import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native';

import { IconSymbol } from './IconSymbol';

type PencilEditButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  iconSize?: number;
};

const PencilEditButton: React.FC<PencilEditButtonProps> = ({
  onPress,
  accessibilityLabel,
  style,
  iconColor,
  iconSize = 16,
}) => {
  const { colors } = useTheme();
  const resolvedIconColor = iconColor ?? colors.icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <IconSymbol name="pencil" size={iconSize} color={resolvedIconColor} />
    </TouchableOpacity>
  );
};

export default PencilEditButton;