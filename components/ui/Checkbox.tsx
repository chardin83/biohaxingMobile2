import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type CheckboxProps = {
  checked: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  label?: string;
  disabled?: boolean;
};

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onPress, style, testID, label, disabled }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      style={[styles.row, style]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      testID={testID}
      hitSlop={8}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View
        style={[
          styles.box,
          checked
            ? { backgroundColor: colors.checkboxCheckedBg, borderColor: colors.checkboxCheckedBorder }
            : [styles.boxUnchecked, { borderColor: colors.checkboxUncheckedBorder }],
        ]}
      >
        {checked && (
          <ThemedText style={[styles.checkboxIcon, { color: colors.checkboxCheck }]}>
            ✓
          </ThemedText>
        )}
      </View>
      {!!label && (
        <ThemedText
          type="default"
          style={[styles.checkboxLabel, !checked && styles.checkboxLabelUnchecked]}
        >
          {label}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  box: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxUnchecked: {
    backgroundColor: 'transparent',
  },
  checkboxIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    marginLeft: 4,
  },
  checkboxLabelUnchecked: {
    opacity: 0.65,
  },
});