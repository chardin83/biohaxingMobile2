import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { IconSymbol } from './IconSymbol';

type Props = Readonly<{
  onPress: () => void;
  color?: string;
  accessibilityLabel?: string;
}>;

export function CloseButton({ onPress, color, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? t('general.close')} style={styles.button}>
      <IconSymbol name="close" size={14} color={color ?? colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
});
