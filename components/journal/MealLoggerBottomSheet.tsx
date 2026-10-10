import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import CardLinkList from '@/components/ui/CardLinkList';
import PremiumLink from '@/components/ui/PremiumLink';
import { FREE_PHOTO_ANALYSIS_LIMIT, PREMIUM } from '@/constants/Premium';
import { getFreePhotoAnalysesRemaining, subscribePhotoAnalysisQuota } from '@/services/nutrition/photoAnalysisQuota';

import { useBottomSheetDesign } from '../ui/BottomSheetDesign';
import { IconSymbol } from '../ui/IconSymbol';

interface MealLoggerBottomSheetProps {
  onAnalyzePhoto: () => void;
  onDiscoverPremium: () => void;
  onScanBarcode: () => void;
  onPreviousMeal: () => void;
  onAddDrink: () => void;
  onChooseFood: () => void;
  onShowBarcodeInfo: () => void;
}

const MealLoggerBottomSheet = forwardRef<BottomSheetModal, MealLoggerBottomSheetProps>(
  ({ onAnalyzePhoto, onDiscoverPremium, onScanBarcode, onPreviousMeal, onAddDrink, onChooseFood, onShowBarcodeInfo }, ref) => {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const [analysesRemaining, setAnalysesRemaining] = useState<number | null>(null);
    const refreshQuota = useCallback(() => {
      getFreePhotoAnalysesRemaining().then(setAnalysesRemaining).catch(console.error);
    }, []);
    useEffect(() => {
      refreshQuota();
      return subscribePhotoAnalysisQuota(refreshQuota);
    }, [refreshQuota]);
    const sheetDesign = useBottomSheetDesign(colors);

    const snapPoints = useMemo(() => ['78%'], []);

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
        onChange={index => {
          if (index >= 0) refreshQuota();
        }}
        enablePanDownToClose
        enableDynamicSizing={false}
        handleIndicatorStyle={{
          backgroundColor: colors.textMuted,
        }}
        backgroundStyle={sheetDesign.backgroundStyle}
        handleComponent={sheetDesign.handleComponent}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title2">{t('journal:nutritionLogger.mealLogger.addMeal')}</ThemedText>

            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t('journal:nutritionLogger.mealLogger.chooseHowToAddMeal')}
            </ThemedText>
          </View>

          <View style={styles.options}>
            <CardLinkList
              style={[styles.highlighted, { borderColor: colors.primary, backgroundColor: colors.primaryVeryWeak }]}
              footer={!PREMIUM &&
                <View style={[styles.photoFooter, { borderTopColor: colors.borderLight }]}>
                  <ThemedText type="caption">
                    {analysesRemaining === null
                      ? t('common:general.loading')
                      : t('journal:nutritionLogger.mealLogger.analysesRemaining', { remaining: analysesRemaining, total: FREE_PHOTO_ANALYSIS_LIMIT })}
                  </ThemedText>
                  <PremiumLink onPress={() => handleAction(onDiscoverPremium)} />
                </View>
              }
              rows={[
                {
                  key: 'link',
                  title: t('journal:nutritionLogger.mealLogger.analyzePhoto'),
                  subtitle: t('journal:nutritionLogger.mealLogger.takePhotoOfMeal'),
                  iconName: 'camera',
                  onPress: () => handleAction(!PREMIUM && analysesRemaining === 0 ? onDiscoverPremium : onAnalyzePhoto),
                  disabled: analysesRemaining === null,
                  accessory: <IconSymbol name="sparkles" size={18} color={colors.textMuted} />,
                },
              ]}
            />

            <CardLinkList
              rows={[
                {
                  key: 'link',
                  title: t('journal:nutritionLogger.mealLogger.scanBarcode'),
                  subtitle: t('journal:nutritionLogger.mealLogger.lookupPackagedProduct'),
                  iconName: 'barcode',
                  onPress: () => handleAction(onScanBarcode),
                  accessory: (
                    <Pressable accessibilityRole="button" hitSlop={10} onPress={() => handleAction(onShowBarcodeInfo)}>
                      <IconSymbol name="info" size={18} color={colors.textMuted} />
                    </Pressable>
                  ),
                },
              ]}
            />

            <CardLinkList
              rows={[
                {
                  key: 'link',
                  title: t('journal:nutritionLogger.mealLogger.previousMeal'),
                  subtitle: t('journal:nutritionLogger.mealLogger.copyPreviousMeal'),
                  iconName: 'history',
                  onPress: () => handleAction(onPreviousMeal),
                },
              ]}
            />

            <CardLinkList
              rows={[
                {
                  key: 'link',
                  title: t('journal:nutritionLogger.mealLogger.chooseFood'),
                  subtitle: t('journal:nutritionLogger.mealLogger.searchNutritiousFoods'),
                  iconName: 'meal',
                  onPress: () => handleAction(onChooseFood),
                },
              ]}
            />

            <CardLinkList
              rows={[
                {
                  key: 'link',
                  title: t('journal:nutritionLogger.mealLogger.addDrink'),
                  subtitle: t('journal:nutritionLogger.mealLogger.chooseDrink'),
                  iconName: 'caffeine',
                  onPress: () => handleAction(onAddDrink),
                },
              ]}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

MealLoggerBottomSheet.displayName = 'MealLoggerBottomSheet';

const styles = StyleSheet.create({
  photoFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
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
