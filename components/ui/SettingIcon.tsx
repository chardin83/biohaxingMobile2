import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet,View } from 'react-native';

import { IconSymbolName } from './icon-symbol-map';
import { IconSymbol } from './IconSymbol';

type Props = Readonly<{
  size?: number;
  iconName?: IconSymbolName;
}>;

export default function SettingIcon({ size = 40, iconName = 'public' }: Props) {
  const { colors } = useTheme();
  const iconSize = Math.round(size * 0.5);
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: colors.overlayLight,
        },
      ]}
    >
      <IconSymbol name={iconName as any} size={iconSize} color={colors.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
