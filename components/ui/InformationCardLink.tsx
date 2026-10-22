import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';

import { useBottomSheetDesign } from './BottomSheetDesign';
import { CardLinkList } from './CardLinkList';
import type { IconSymbolName } from './icon-symbol-map';
import SettingIcon from './SettingIcon';

export type InformationItem = Readonly<{
  key: string;
  title: string;
  description: string;
  icon?: string;
  iconName?: IconSymbolName;
}>;

export type InformationCardLinkRow = Readonly<{
  key: string;
  title: string;
  subtitle?: string;
  subtitleNumberOfLines?: number;
  iconName?: IconSymbolName;
  icon?: React.ReactNode;
  items?: readonly InformationItem[];
  sheetTitle?: string;
  content?: React.ReactNode;
  accessory?: React.ReactNode;
  onPress?: () => void;
  renderContent?: (dismiss: () => void) => React.ReactNode;
  footer?: React.ReactNode;
}>;

type Props = Readonly<{
  title?: string;
  sheetTitle?: string;
  accessory?: React.ReactNode;
  footer?: React.ReactNode;
  onSheetChange?: (index: number) => void;
  rows?: readonly InformationCardLinkRow[];
  subtitle?: string;
  iconName?: IconSymbolName;
  iconColor?: string;
  items?: readonly InformationItem[];
  children?: React.ReactNode | ((dismiss: () => void) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onDismiss?: () => void;
  snapPoints?: string[];
}>;

/** Data-driven information card shared by overview screens. */
export function InformationCardLink({
  title,
  sheetTitle,
  accessory,
  footer,
  onSheetChange,
  rows,
  subtitle,
  iconName = 'info',
  iconColor,
  items = [],
  children,
  style,
  onPress,
  onDismiss,
  snapPoints = ['85%'],
}: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selectedRowKey, setSelectedRowKey] = useState<string>();
  const selectedRow = rows?.find(row => row.key === selectedRowKey);
  const content = selectedRow ? (selectedRow.renderContent ?? selectedRow.content) : children;
  const sheetContent = typeof content === 'function' ? content(() => sheetRef.current?.dismiss()) : content;
  const sheetFooter = selectedRow?.footer ?? footer;
  const sheetItems = selectedRow?.items ?? items;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetDesign = useBottomSheetDesign(colors);
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  return (
    <>
      <CardLinkList
        style={style}
        rows={
          rows
            ? rows.map(row => ({
                key: row.key,
                title: row.title,
                subtitle: row.subtitle,
                subtitleNumberOfLines: row.subtitleNumberOfLines,
                iconName: row.iconName ?? iconName,
                icon: row.icon,
                accessory: row.accessory,
                iconColor,
                onPress: () => {
                  row.onPress?.();
                  setSelectedRowKey(row.key);
                  sheetRef.current?.present();
                },
              }))
            : [{ key: 'information', title: title ?? '', subtitle, iconName, iconColor, accessory, onPress: onPress ?? (() => sheetRef.current?.present()) }]
        }
      />
      {!onPress && (
        <BottomSheetModal
          ref={sheetRef}
          snapPoints={snapPoints}
          enableDynamicSizing={false}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={sheetDesign.backgroundStyle}
          handleComponent={sheetDesign.handleComponent}
          onChange={onSheetChange}
          onDismiss={onDismiss}
        >
          <BottomSheetScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.heading}>
              {selectedRow?.icon}
              <ThemedText type="title2" style={styles.headingText} accessibilityRole="header">
                {selectedRow?.sheetTitle ?? selectedRow?.title ?? sheetTitle ?? title}
              </ThemedText>
            </View>

            {sheetContent}
            {sheetItems.map(item => (
              <View
                key={item.key}
                style={[styles.item, item.iconName && styles.itemWithIcon, { backgroundColor: colors.overlayLight, borderColor: colors.borderLight }]}
              >
                {item.iconName && <SettingIcon iconName={item.iconName} iconColor={iconColor} />}
                <View style={[styles.itemContent, item.iconName && styles.itemContentWithIcon]}>
                  <ThemedText type="title3" accessibilityRole="header">
                    {item.icon ? `${item.icon} ` : ''}
                    {item.title}
                  </ThemedText>
                  <ThemedText>{item.description}</ThemedText>
                </View>
              </View>
            ))}
            {sheetFooter && <View style={styles.footer}>{sheetFooter}</View>}
          </BottomSheetScrollView>
        </BottomSheetModal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headingText: { flex: 1 },
  list: { flexGrow: 1, paddingHorizontal: 20, gap: 12 },
  footer: { marginTop: 'auto', paddingTop: 16 },
  item: { padding: 16, gap: 8, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  itemWithIcon: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  itemContent: { gap: 8 },
  itemContentWithIcon: { flex: 1 },
});
