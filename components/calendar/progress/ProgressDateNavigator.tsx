import { useTheme } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

type ProgressDateNavigatorProps = {
  label: string;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
};

const ProgressDateNavigator = ({ label, canGoForward, onBack, onForward }: ProgressDateNavigatorProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onBack} style={styles.arrow}>
        <ThemedText type="title" style={{ color: colors.primary }}>
          {'‹'}
        </ThemedText>
      </TouchableOpacity>
      <ThemedText type="caption" style={[styles.label, { color: colors.textMuted }]}>
        {label}
      </ThemedText>
      <TouchableOpacity onPress={onForward} style={styles.arrow} disabled={!canGoForward}>
        <ThemedText type="title" style={{ color: canGoForward ? colors.primary : colors.border }}>
          {'›'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    textAlign: 'center',
  },
  arrow: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

export default ProgressDateNavigator;
