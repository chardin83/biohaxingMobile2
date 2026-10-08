import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Image, type ImageSourcePropType, Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import SettingIcon from '@/components/ui/SettingIcon';
import { SettingsCard as CardContainer } from '@/components/ui/SettingsCard';

import type { IconSymbolName } from './icon-symbol-map';
import { IconSymbol } from './IconSymbol';

export type CardLinkListRow = {
  readonly key: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly value?: string;
  readonly iconName?: IconSymbolName;
  readonly iconColor?: string;
  readonly image?: ImageSourcePropType;
  readonly accessory?: React.ReactNode;
  readonly onPress?: () => void;
  readonly expanded?: boolean;
  readonly disabled?: boolean;
  readonly content?: React.ReactNode;
};

type Props = {
  readonly rows: readonly CardLinkListRow[];
  readonly showIcon?: boolean;
  readonly style?: StyleProp<ViewStyle>;
};

export function CardLinkList({ rows, showIcon = true, style }: Props) {
  const { colors } = useTheme();
  const singleRow = rows.length === 1;

  return (
    <CardContainer style={style}>
      {rows.map((row, index) => (
        <View key={row.key} style={index === rows.length - 1 ? styles.rowNoBorder : [styles.rowBorder, { borderBottomColor: colors.borderLight }]}>
          <Pressable
            onPress={row.onPress}
            disabled={row.disabled}
            accessibilityRole="button"
            accessibilityState={{ expanded: row.expanded, disabled: row.disabled }}
            style={singleRow ? styles.container : styles.row}
          >
            <View style={styles.leftRow}>
              {showIcon &&
                (row.image ? (
                  <Image source={row.image} style={styles.image} resizeMode="contain" />
                ) : (
                  <SettingIcon size={40} iconName={row.iconName ?? 'public'} iconColor={row.iconColor} />
                ))}
              <View style={styles.textColumn}>
                <ThemedText type="title3" style={styles.title}>
                  {row.title}
                </ThemedText>
                {row.subtitle && (
                  <ThemedText type="caption" style={styles.subtitle}>
                    {row.subtitle}
                  </ThemedText>
                )}
              </View>
            </View>
            <View style={styles.rightColumn}>
              {row.accessory ??
                (row.value ? (
                  <ThemedText type={singleRow ? 'caption' : 'default'} style={[styles.value, !singleRow && { color: colors.textMuted }]} numberOfLines={1}>
                    {row.value}
                  </ThemedText>
                ) : null)}
            </View>
            <IconSymbol name={row.expanded ? 'expandMore' : 'chevron.right'} size={16} color={colors.text} />
          </Pressable>
          {row.expanded && row.content}
        </View>
      ))}
    </CardContainer>
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
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 40,
    height: 40,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  title: {},
  subtitle: {
    marginTop: 2,
  },
  rightColumn: {
    marginRight: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: '60%',
  },
  value: {},
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

export default CardLinkList;
