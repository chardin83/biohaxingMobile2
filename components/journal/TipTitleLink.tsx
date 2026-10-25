import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText, type ThemedTextProps } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TipDetailsBottomSheet from '@/components/ui/TipDetailsBottomSheet';

export default function TipTitleLink({
  tipId,
  title,
  type = 'defaultSemiBold',
  style,
}: Readonly<{
  tipId: string;
  title: string;
  type?: ThemedTextProps['type'];
  style?: StyleProp<ViewStyle>;
}>) {
  const { colors } = useTheme();
  const { t } = useTranslation('journal');
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.container, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={t('tipDetails.openHint')}
        onPress={() => setOpen(true)}
        style={styles.link}
      >
        <ThemedText type={type} selectable={false} style={styles.title}>
          {title}
        </ThemedText>
        <IconSymbol name="chevron.right" size={18} color={colors.primary} />
      </Pressable>
      {open && <TipDetailsBottomSheet tipId={tipId} onDismiss={() => setOpen(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  title: { flexShrink: 1 },
});
