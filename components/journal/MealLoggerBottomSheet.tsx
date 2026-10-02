import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import SettingsCardLink from '@/components/ui/SettingsCardLink';

import { useBottomSheetDesign } from '../ui/BottomSheetDesign';
import { IconSymbol } from '../ui/IconSymbol';

interface MealLoggerBottomSheetProps {
  onAnalyzePhoto: () => void;
  onScanBarcode: () => void;
  onPreviousMeal: () => void;
  onAddDrink: () => void;
  onChooseFood: () => void;
  onShowBarcodeInfo: () => void;
}

const MealLoggerBottomSheet = forwardRef<BottomSheetModal, MealLoggerBottomSheetProps>(
  ({ onAnalyzePhoto, onScanBarcode, onPreviousMeal, onAddDrink, onChooseFood, onShowBarcodeInfo }, ref) => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const sheetDesign = useBottomSheetDesign(colors);

    const snapPoints = useMemo(() => ['68%'], []);

    const handleAction = useCallback(
      (action: () => void) => {
        if (ref && typeof ref !== 'function' && ref.current) {
          ref.current.dismiss();
        }

        // Låt sheeten börja stängas innan nästa UI öppnas.
        requestAnimationFrame(action);
      },
      [ref]
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        handleIndicatorStyle={{
          backgroundColor: colors.textMuted,
        }}
        backgroundStyle={sheetDesign.backgroundStyle}
        handleComponent={sheetDesign.handleComponent}
      >
        <BottomSheetView style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title2">{t('journal:nutritionLogger.mealLogger.addMeal')}</ThemedText>

            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t('journal:nutritionLogger.mealLogger.chooseHowToAddMeal')}
            </ThemedText>
          </View>

          <View style={styles.options}>
            <SettingsCardLink
              title={t('journal:nutritionLogger.mealLogger.analyzePhoto')}
              subtitle={t('journal:nutritionLogger.mealLogger.takePhotoOfMeal')}
              iconName="camera"
              style={[styles.highlighted, { borderColor: colors.primary, backgroundColor: colors.primaryVeryWeak }]}
              onPress={() => handleAction(onAnalyzePhoto)}
              accessory={<IconSymbol name="sparkles" size={18} color={colors.textMuted} />}
            />

            <SettingsCardLink
              title={t('journal:nutritionLogger.mealLogger.scanBarcode')}
              subtitle={t('journal:nutritionLogger.mealLogger.lookupPackagedProduct')}
              iconName="barcode"
              onPress={() => handleAction(onScanBarcode)}
              accessory={
                <Pressable accessibilityRole="button" hitSlop={10} onPress={() => handleAction(onShowBarcodeInfo)}>
                  <IconSymbol name="info" size={18} color={colors.textMuted} />
                </Pressable>
              }
            />

            <SettingsCardLink
              title={t('journal:nutritionLogger.mealLogger.previousMeal')}
              subtitle={t('journal:nutritionLogger.mealLogger.copyPreviousMeal')}
              iconName="history"
              onPress={() => handleAction(onPreviousMeal)}
            />

            <SettingsCardLink
              title={t('journal:nutritionLogger.mealLogger.chooseFood')}
              subtitle={t('journal:nutritionLogger.mealLogger.searchNutritiousFoods')}
              iconName="meal"
              onPress={() => handleAction(onChooseFood)}
            />

            <SettingsCardLink
              title={t('journal:nutritionLogger.mealLogger.addDrink')}
              subtitle={t('journal:nutritionLogger.mealLogger.chooseDrink')}
              iconName="caffeine"
              onPress={() => handleAction(onAddDrink)}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

MealLoggerBottomSheet.displayName = 'MealLoggerBottomSheet';

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },

  options: {
    gap: 12,
  },

  highlighted: {
    borderWidth: 1,
  },
});

export default MealLoggerBottomSheet;
