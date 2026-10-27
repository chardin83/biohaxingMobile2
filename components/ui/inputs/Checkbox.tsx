import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, type ViewProps, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type CheckboxProps = {
  checked: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  label?: string;
  labelContent?: React.ReactNode;
  accessibilityLabel?: string;
  disabled?: boolean;
  accessibilityHint?: string;
  description?: string;
  onLayout?: ViewProps['onLayout'];
};

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  style,
  testID,
  label,
  labelContent,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  description,
  onLayout,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      style={[styles.row, description && styles.withDescription, style]}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityHint={accessibilityHint ?? description}
      onLayout={onLayout}
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
        {checked && <ThemedText style={[styles.checkboxIcon, { color: colors.checkboxCheck }]}>✓</ThemedText>}
      </View>
      {(labelContent != null || !!label) && (
        <View style={styles.labelColumn}>
          <ThemedText selectable={false} type="default" style={[styles.checkboxLabel, !checked && styles.checkboxLabelUnchecked]}>
            {labelContent ?? label}
          </ThemedText>
          {description && (
            <ThemedText selectable={false} type="explainer" style={styles.description}>
              {description}
            </ThemedText>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  withDescription: { alignItems: 'flex-start', marginTop: 0 },
  labelColumn: { flexShrink: 1, gap: 2 },
  description: { marginLeft: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 48,
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
    flexShrink: 1,
    marginLeft: 4,
  },
  checkboxLabelUnchecked: {
    opacity: 0.65,
  },
});
