import { useTheme } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

export default function Pill({ label, active = false }: Readonly<{ label: string; active?: boolean }>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: active ? colors.accentWeak : colors.overlayLight }]}>
      <ThemedText type="caption" style={{ color: active ? colors.primary : colors.textMuted }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
});
