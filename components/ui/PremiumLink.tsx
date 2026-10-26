import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function PremiumLink({ onPress }: Readonly<{ onPress: () => void }>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t('common:premium.premium')} onPress={onPress} hitSlop={8} style={styles.link}>
      <IconSymbol name="crown" size={18} color={colors.premium} />
      <ThemedText type="caption" style={{ color: colors.premium }}>{t('common:premium.premium')}</ThemedText>
      <IconSymbol name="chevron.right" size={14} color={colors.premium} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 6 },
});
