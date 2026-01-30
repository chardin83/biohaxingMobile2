import { PropsWithChildren, useState } from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { Colors } from '@/app/theme/Colors';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';

export function Collapsible({
  children,
  title,
  rightContent,
  contentStyle,
}: PropsWithChildren & {
  title: string;
  rightContent?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const theme = useColorScheme() ?? 'light';

  return (
    <>
      <TouchableOpacity style={styles.heading} onPress={() => setIsOpen(value => !value)} activeOpacity={0.8}>
        <IconSymbol
          name="chevron.right"
          size={18}
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
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
