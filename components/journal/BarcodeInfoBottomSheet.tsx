import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { ThemedText } from '@/components/ThemedText';

import AppButton from '../ui/AppButton';
import { useBottomSheetDesign } from '../ui/BottomSheetDesign';
import { Checkbox } from '../ui/Checkbox';
import DiscreetButton from '../ui/DiscreetButton';
import { IconSymbol } from '../ui/IconSymbol';
import Notice from '../ui/Notice';

interface BarcodeInfoBottomSheetProps {
  onContinue: () => void;
  onUsePhotoAnalysis: () => void;
  onDontShowAgainChange: (value: boolean) => void;
}

const BarcodeInfoBottomSheet = forwardRef<BottomSheetModal, BarcodeInfoBottomSheetProps>(({ onContinue, onUsePhotoAnalysis, onDontShowAgainChange }, ref) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sheetDesign = useBottomSheetDesign(colors);

  const snapPoints = useMemo(() => ['70%'], []);

  const { hideBarcodeInfo } = useStorage();
  const [dontShowAgain, setDontShowAgain] = useState(hideBarcodeInfo);

  useEffect(() => {
    setDontShowAgain(hideBarcodeInfo);
  }, [hideBarcodeInfo]);

  const dismiss = () => {
    if (ref && typeof ref !== 'function') {
      ref.current?.dismiss();
    }
  };

  const handleAction = (action: () => void) => {
    if (dontShowAgain !== hideBarcodeInfo) onDontShowAgainChange(dontShowAgain);
    dismiss();
    // Låt sheeten börja stängas innan nästa UI öppnas.
    requestAnimationFrame(action);
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
      onDismiss={() => setDontShowAgain(hideBarcodeInfo)}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="barcode" size={72} color={colors.text} />
          <ThemedText type="title2">{t('journal:nutritionLogger.barcodeInfo.title')}</ThemedText>
          <ThemedText type="default" style={[styles.description, { color: colors.textMuted }]}>
            {t('journal:nutritionLogger.barcodeInfo.description')}
          </ThemedText>
        </View>

        <Notice variant="warning" message={t('journal:nutritionLogger.barcodeInfo.warning')} />

        <View style={styles.bullets}>
          {(['bestForPackaged', 'quickSearch', 'usePhotoForDetails'] as const).map(key => (
            <ThemedText key={key} type="default">
              • {t(`journal:nutritionLogger.barcodeInfo.${key}`)}
            </ThemedText>
          ))}
        </View>

        <Checkbox
          checked={dontShowAgain}
          onPress={() => setDontShowAgain(value => !value)}
          label={t('journal:nutritionLogger.barcodeInfo.dontShowAgain')}
          style={styles.checkbox}
        />

        <AppButton title={t('journal:nutritionLogger.barcodeInfo.continue')} onPress={() => handleAction(onContinue)} variant="primary" />

        <View style={styles.discreet}>
          <DiscreetButton title={t('journal:nutritionLogger.barcodeInfo.usePhotoAnalysis')} onPress={() => handleAction(onUsePhotoAnalysis)} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

BarcodeInfoBottomSheet.displayName = 'BarcodeInfoBottomSheet';

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
  },
  bullets: {
    gap: 6,
    marginTop: 16,
    marginBottom: 16,
  },
  checkbox: {
    marginBottom: 16,
  },
  discreet: {
    alignItems: 'center',
    marginTop: 8,
  },
});

export default BarcodeInfoBottomSheet;
