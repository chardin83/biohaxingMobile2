import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import SettingIcon from '@/components/ui/SettingIcon';

import { IconSymbol } from './IconSymbol.ios';

type Props = {
  title: string;
  subtitle?: string;
  iconName?: string;
  onPress?: () => void;
  style?: any;
};

export const SettingsCard: React.FC<Props> = ({ title, subtitle, iconName = 'public', onPress, style }: Props) => {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground},
        style,
      ]}
    >
      <View style={styles.leftRow}>
        <SettingIcon size={40} iconName={iconName} />
        <View style={styles.textColumn}>
          <ThemedText type="title3" style={styles.title}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="caption" style={styles.subtitle}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <IconSymbol name="chevron.right" size={16} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    width: '100%',
    borderRadius: 8,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textColumn: {
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
  },
});
