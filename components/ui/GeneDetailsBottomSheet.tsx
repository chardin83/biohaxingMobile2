import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { genes } from '@/locales/genes';

import { useBottomSheetDesign } from './BottomSheetDesign';

interface GeneDetailsBottomSheetProps {
  geneId: string | null;
  areaId: string;
  onDismiss: () => void;
}

export default function GeneDetailsBottomSheet({ geneId, areaId, onDismiss }: GeneDetailsBottomSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const sheetDesign = useBottomSheetDesign(colors);
  const gene = genes.find(item => item.id === geneId);
  const area = gene?.areas.find(item => item.id === areaId);
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  useEffect(() => {
    if (geneId) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [geneId]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      stackBehavior="push"
      snapPoints={['85%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
      onDismiss={onDismiss}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {gene && area && (
          <>
            <ThemedText type="title2" accessibilityRole="header">
              {gene.id}
            </ThemedText>
            <ThemedText type="title2" style={{ color: colors.textSecondary }}>
              {t(`genes:${gene.titleKey}`)}
            </ThemedText>
            <ThemedText>{t(`genes:${area.descriptionKey}`)}</ThemedText>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
});
