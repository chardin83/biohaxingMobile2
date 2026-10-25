import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { tips } from '@/locales/tips';

import AppButton from './AppButton';
import { useBottomSheetDesign } from './BottomSheetDesign';

export default function TipDetailsBottomSheet({ tipId, onDismiss }: { tipId: string | null; onDismiss: () => void }) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const { colors } = useTheme();
  const { t } = useTranslation(['common', 'tips']);
  const insets = useSafeAreaInsets();
  const design = useBottomSheetDesign(colors);
  const tip = tips.find(item => item.id === tipId);
  const backdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );
  useEffect(() => {
    if (tipId) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [tipId]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      snapPoints={['85%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      backdropComponent={backdrop}
      backgroundStyle={design.backgroundStyle}
      handleComponent={design.handleComponent}
      onDismiss={onDismiss}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {tip && (
          <>
            <ThemedText type="title2" accessibilityRole="header">
              {t(`tips:${tip.title}`)}
            </ThemedText>
            <ThemedText>{t(`tips:${tip.descriptionKey}`)}</ThemedText>
          </>
        )}
        <AppButton title={t('common:general.close')} variant="secondary" onPress={() => sheetRef.current?.dismiss()} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 8, gap: 16 } });
