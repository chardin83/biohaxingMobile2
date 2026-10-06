import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { microbiome } from '@/locales/microbiome';
import { tips } from '@/locales/tips';

import { useBottomSheetDesign } from './BottomSheetDesign';
import { PressableCard } from './PressableCard';

interface MicrobiomeDetailsBottomSheetProps {
  bacteriaId: string | null;
  areaId: string;
  onDismiss: () => void;
}

export default function MicrobiomeDetailsBottomSheet({ bacteriaId, areaId, onDismiss }: MicrobiomeDetailsBottomSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { dismissAll } = useBottomSheetModal();
  const relatedTips = tips.filter(tip => bacteriaId && tip.microbiomeIds?.includes(bacteriaId));
  const handleTipPress = (tipId: string, tipAreaIds: string[]) => {
    const targetAreaId = tipAreaIds.includes(areaId) ? areaId : tipAreaIds[0];
    if (!targetAreaId) return;
    dismissAll();
    router.push({ pathname: '/dashboard/area/[areaId]/details', params: { areaId: targetAreaId, tipId } });
  };
  const sheetDesign = useBottomSheetDesign(colors);
  const bacteria = microbiome.find(item => item.id === bacteriaId);
  const area = bacteria?.areas.find(item => item.id === areaId);
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  useEffect(() => {
    if (bacteriaId) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [bacteriaId]);

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
        {bacteria && area && (
          <>
            <ThemedText type="title2" accessibilityRole="header">
              {bacteria.id}
            </ThemedText>
            <ThemedText type="title2" style={{ color: colors.textSecondary }}>
              {t(`microbiome:${bacteria.titleKey}`)}
            </ThemedText>
            <ThemedText>{t(`microbiome:${area.descriptionKey}`)}</ThemedText>
          </>
        )}
        {relatedTips.length > 0 && (
          <>
            <ThemedText type="title3" accessibilityRole="header">
              Kopplade tips
            </ThemedText>
            {relatedTips.map(tip => (
              <PressableCard
                key={tip.id}
                onPress={() =>
                  handleTipPress(
                    tip.id,
                    tip.areas.map(item => item.id)
                  )
                }
              >
                <ThemedText type="title3">{t(`tips:${tip.title}`)}</ThemedText>
                <ThemedText>{t(`tips:${tip.descriptionKey}`)}</ThemedText>
              </PressableCard>
            ))}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
});
