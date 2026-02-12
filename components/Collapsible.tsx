import { useTheme } from '@react-navigation/native';
import { PropsWithChildren, useState } from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

export function Collapsible({
  children,
  title,
  rightContent,
  contentStyle,
  accessibilityLabel,
  accessibilityHint,
  initialCollapsed = false, // ny prop
}: PropsWithChildren & {
  title: string;
  rightContent?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  initialCollapsed?: boolean; // ny prop
}) {
  const [isOpen, setIsOpen] = useState(!initialCollapsed);
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen(value => !value)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ expanded: isOpen }}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          color={colors.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />
        <ThemedText type="defaultSemiBold">
          {title}
        </ThemedText>
        {rightContent}
      </TouchableOpacity>
      {isOpen && <View style={[styles.content, contentStyle]}>{children}</View>}
      </>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});
