import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import type { SelectedImageFile } from '@/types/nutrition/nutritionAnalysis';

import { useBottomSheetDesign } from '../ui/BottomSheetDesign';
import Notice from '../ui/Notice';
import { ImageAnalysisScanner } from './ImageAnalysisScanner';

interface NutritionAnalysisBottomSheetProps {
  image: SelectedImageFile | null;
}

const NutritionAnalysisBottomSheet = forwardRef<BottomSheetModal, NutritionAnalysisBottomSheetProps>(({ image }, ref) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const sheetDesign = useBottomSheetDesign(colors);

  const snapPoints = useMemo(() => ['65%'], []);

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
        {image && <ImageAnalysisScanner source={{ uri: image.uri }} height={260} />}

        <Notice variant="info" title={t('nutritionLogger.analysisInProgress')} message={t('nutritionLogger.analysisDoNotCloseApp')} />
      </BottomSheetView>
    </BottomSheetModal>
  );
});

NutritionAnalysisBottomSheet.displayName = 'NutritionAnalysisBottomSheet';

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 20,
  },
  title: {
    textAlign: 'center',
  },
});

export default NutritionAnalysisBottomSheet;
