import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { IconSymbol } from './IconSymbol';

interface RadioButtonProps {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
  color?: string;
}

export default function RadioButton({
  selected,
  onPress,
  children,
  disabled = false,
  accessibilityLabel,
  style,
  size = 18,
  color,
}: Readonly<RadioButtonProps>) {
  const { colors } = useTheme();
  const checkColor = color ?? colors.primary;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, style]}
    >
      {children}
      <View accessible={false} style={[styles.checkWrapper, { width: size + 6, height: size + 6 }]}>
        {selected && (
          <>
            <IconSymbol name="check" size={size} color={checkColor} style={styles.checkLayer1} />
            <IconSymbol name="check" size={size} color={checkColor} style={styles.checkLayer2} />
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, gap: 12 },
  checkWrapper: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  checkLayer1: { position: 'absolute', left: -0.6, top: -0.4 },
  checkLayer2: { position: 'absolute', left: 0.6, top: 0.4 },
});
