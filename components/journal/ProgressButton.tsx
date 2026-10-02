import { useTheme } from '@react-navigation/native';
import { Href, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { ThemedText } from '../ThemedText';

interface ProgressButtonProps {
  href: Href;
  label: string;
}

const ProgressButton = ({ href, label }: ProgressButtonProps) => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push(href)}
        activeOpacity={0.85}
        style={[
          styles.button,
          {
            backgroundColor: colors.secondaryBackground,
            borderColor: colors.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.content}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: colors.accentVeryWeak,
              },
            ]}
          >
            <Icon source="chart-line" size={20} color={colors.primary} />
          </View>
          <ThemedText type="title3" style={styles.text}>
            {label}
          </ThemedText>
        </View>
        <Icon source="chevron-right" size={22} color={colors.accentColor} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 8,
  },
  button: {
    width: '100%',
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flexShrink: 1,
  },
});

export default ProgressButton;
