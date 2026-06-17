import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import SettingIcon from '@/components/ui/SettingIcon';
import { SettingsCard as CardContainer } from '@/components/ui/SettingsCard';
import { IconSymbol } from './IconSymbol.ios';

type Row = {
  key: string;
  title: string;
  value?: string;
  iconName?: string;
  onPress?: () => void;
};

type Props = {
  title?: string;
  subtitle?: string;
  iconName?: string;
  onPress?: () => void;
  style?: any;
  value?: string;
  accessory?: React.ReactNode;
  rows?: Row[];
};

export const SettingsCardLink: React.FC<Props> = ({ title, subtitle, iconName = 'public', onPress, style, value, accessory, rows }: Props) => {
  const { colors } = useTheme();

  let rightAccessory: React.ReactNode = null;
  if (accessory) {
    rightAccessory = accessory;
  } else if (value) {
    rightAccessory = (
      <ThemedText type="caption" style={styles.value} numberOfLines={1}>
        {value}
      </ThemedText>
    );
  }

  if (rows && rows.length > 0) {
    return (
      <CardContainer style={style}>
        {rows.map((r, idx) => (
          <Pressable
            key={r.key}
            onPress={r.onPress}
            style={[styles.row, idx === rows.length - 1 ? styles.rowNoBorder : styles.rowBorder]}
          >
            <View style={styles.leftRow}>
              <SettingIcon size={40} iconName={r.iconName ?? 'public'} />
              <View style={styles.textColumn}>
                <ThemedText type="title3" style={styles.title}>
                  {r.title}
                </ThemedText>
              </View>
            </View>
            <View style={styles.rightColumn}>
              {r.value ? (
                <ThemedText type="caption" style={styles.value} numberOfLines={1}>
                  {r.value}
                </ThemedText>
              ) : null}
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.text} />
          </Pressable>
        ))}
      </CardContainer>
    );
  }

  return (
    <CardContainer style={style}>
      <Pressable onPress={onPress} style={styles.container}>
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

        <View style={styles.rightColumn}>
          {rightAccessory}
        </View>
        <IconSymbol name="chevron.right" size={16} color={colors.text} />
      </Pressable>
    </CardContainer>
  );
};

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
  rightColumn: {
    marginRight: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: '60%'
  },
  value: {
    fontSize: 14,
    color: '#6b6b6b'
  }
  ,
  cardContainer: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
});

export default SettingsCardLink;
