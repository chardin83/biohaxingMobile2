import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Switch } from 'react-native';

type Props = Readonly<{
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  style?: any;
}>;

export default function ThemedSwitch({ value, onValueChange, disabled = false, style }: Props) {
  const { colors } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
     trackColor={{
              false: colors.secondary,
              true: colors.progressBar,
            }}
      thumbColor={colors.text}
      ios_backgroundColor={colors.cardBackground}
      style={style}
    />
  );
}
