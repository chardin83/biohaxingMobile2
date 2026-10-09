import { useTheme } from '@react-navigation/native';
import React from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

import type { IconSymbolName } from './icon-symbol-map';
import { IconSymbol } from './IconSymbol';

type InformationCardProps = Readonly<{
  title: string;
  iconName: IconSymbolName;
  variant?: 'primary' | 'info' | 'warm';
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

export function InformationCard({ title, iconName, variant = 'primary', children, style }: InformationCardProps) {
  const { colors } = useTheme();
  const palettes = {
    primary: { background: colors.primaryVeryWeak, icon: colors.primary },
    info: { background: colors.infoWeak, icon: colors.infoColor },
    warm: { background: colors.warmWeak, icon: colors.warmColor },
  };
  const palette = palettes[variant];

  return (
    <View style={[styles.card, { backgroundColor: palette.background }, style]}>
      <View style={styles.heading}>
        <IconSymbol name={iconName} size={24} color={palette.icon} />
        <ThemedText type="label" accessibilityRole="header" style={styles.title}>
          {title}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, textTransform: 'uppercase' },
});
