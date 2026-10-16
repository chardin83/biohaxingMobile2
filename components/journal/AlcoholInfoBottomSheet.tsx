import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { useBottomSheetDesign } from '@/components/ui/BottomSheetDesign';
import { IconSymbol } from '@/components/ui/IconSymbol';

function AlcoholInfoBackdrop(props: React.ComponentProps<typeof BottomSheetBackdrop>) {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />;
}

export default function AlcoholInfoBottomSheet({ onClose }: Readonly<{ onClose: () => void }>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const design = useBottomSheetDesign(colors);
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backgroundStyle={design.backgroundStyle}
      handleComponent={design.handleComponent}
      backdropComponent={AlcoholInfoBackdrop}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + 24 }]}>
        <IconSymbol name="alcohol" size={32} color={colors.text} />
        <ThemedText type="title2">{t('journal:nutritionLogger.alcoholInfo.title')}</ThemedText>
        <ThemedText>{t('journal:nutritionLogger.alcoholInfo.description')}</ThemedText>
        <ThemedText>{t('journal:nutritionLogger.alcoholInfo.examples')}</ThemedText>
        <ThemedText type="caption">{t('journal:nutritionLogger.alcoholInfo.calculation')}</ThemedText>
        <AppButton title={t('common:general.understood')} onPress={() => sheetRef.current?.dismiss()} variant="primary" />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
});
