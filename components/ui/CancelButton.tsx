import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

interface CancelButtonProps {
  onPress: () => void;
}

export const CancelButton: React.FC<CancelButtonProps> = ({ onPress }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const label = t('general.cancel');
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.cancelTextButton}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <ThemedText type="defaultSemiBold" style={[styles.cancelText, { color: colors.textLight }]}> 
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cancelTextButton: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.78,
  },
  cancelText: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});