import { useTheme } from '@react-navigation/native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import AppButton from './AppButton';
import { IconSymbol } from './IconSymbol';

interface AddButtonProps {
  added: boolean;
  allowToggle?: boolean;
  onClick: () => void;
  accessibilityLabel: string;
  styles?: any;
}

const AddButton = ({ added, onClick, styles, accessibilityLabel, allowToggle }: AddButtonProps) => {
  const mergedStyles = { ...styles, ...stylesInternal };
  const { colors } = useTheme();

  if (!added) {
    return <AppButton title="+" accessibilityLabel={accessibilityLabel} onPress={onClick} variant="secondary" />;
  }

  const check = (
    <View style={mergedStyles.check}>
      <IconSymbol name="check" size={22} color={colors.primary} />
    </View>
  );

  return allowToggle ? (
    <Pressable onPress={onClick} accessibilityLabel={accessibilityLabel}>
      {check}
    </Pressable>
  ) : (
    check
  );
};

const stylesInternal = StyleSheet.create({
  check: {
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
});

export default AddButton;
