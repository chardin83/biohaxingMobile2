import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';

import { useBottomSheetDesign } from './BottomSheetDesign';
import { CardLinkList } from './CardLinkList';
import type { IconSymbolName } from './icon-symbol-map';

export type InformationItem = Readonly<{
  key: string;
  title: string;
  description: string;
  icon?: string;
}>;

type Props = Readonly<{
  title: string;
  subtitle?: string;
  iconName?: IconSymbolName;
  iconColor?: string;
  items?: readonly InformationItem[];
  children?: React.ReactNode | ((dismiss: () => void) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
}>;

/** Data-driven information card shared by overview screens. */
export function InformationCardLink({ title, subtitle, iconName = 'info', iconColor, items = [], children, style }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
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
      <CardLinkList style={style} rows={[{ key: 'information', title, subtitle, iconName, iconColor, onPress: () => sheetRef.current?.present() }]} />
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={['85%']}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={sheetDesign.backgroundStyle}
        handleComponent={sheetDesign.handleComponent}
      >
        <BottomSheetView style={styles.sheet}>
          <ThemedText type="title2" style={styles.heading} accessibilityRole="header">
            {title}
          </ThemedText>
          <BottomSheetScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}>
            {typeof children === 'function' ? children(() => sheetRef.current?.dismiss()) : children}
            {items.map(item => (
              <View key={item.key} style={[styles.item, { backgroundColor: colors.overlayLight, borderColor: colors.borderLight }]}>
                <ThemedText type="title3" accessibilityRole="header">
                  {item.icon ? `${item.icon} ` : ''}
                  {item.title}
                </ThemedText>
                <ThemedText>{item.description}</ThemedText>
              </View>
            ))}
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  heading: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  list: { paddingHorizontal: 20, gap: 12 },
  item: { padding: 16, gap: 8, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
});
