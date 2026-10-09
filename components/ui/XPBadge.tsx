import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

import Badge from './Badge';
import { IconSymbol } from './IconSymbol';

export default function XPBadge({ amount = 0, showPlus = false, checked = false, size = 24 }: Readonly<{ amount?: number; showPlus?: boolean; checked?: boolean; size?: number }>) {
  const { colors } = useTheme();
  if (checked) return <IconSymbol name="checkCircle" size={size} color={colors.xp} />;
  return (
    <Badge style={[{ backgroundColor: colors.xp }, amount === 0 && styles.zeroAmount]}>
      <ThemedText type="caption" style={[styles.label, { color: colors.progressSuccessIcon }]}>
        {showPlus ? '+' : ''}{amount} XP
      </ThemedText>
    </Badge>
  );
}

const styles = StyleSheet.create({ label: { fontWeight: '600' }, zeroAmount: { opacity: 0.5 } });
