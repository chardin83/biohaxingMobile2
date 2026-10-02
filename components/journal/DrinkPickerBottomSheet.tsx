import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import SettingsCardLink from '@/components/ui/SettingsCardLink';
import { DRINK_TYPES, getDrinkImage } from '@/locales/drinkCatalog';
import type { DrinkType } from '@/services/gptServices';

import { useBottomSheetDesign } from '../ui/BottomSheetDesign';

interface DrinkPickerBottomSheetProps {
  onSelect: (type: DrinkType) => void;
}

const DrinkPickerBottomSheet = forwardRef<BottomSheetModal, DrinkPickerBottomSheetProps>(({ onSelect }, ref) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sheetDesign = useBottomSheetDesign(colors);

  const snapPoints = useMemo(() => ['70%'], []);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title2">{t('journal:nutritionLogger.drinkPicker.title')}</ThemedText>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.drinkPicker.subtitle')}
          </ThemedText>
        </View>

        <View style={styles.options}>
          {DRINK_TYPES.map(type => (
            <SettingsCardLink key={type} title={t(`journal:nutritionLogger.drinkTypes.${type}`)} image={getDrinkImage(type)} onPress={() => onSelect(type)} />
          ))}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

DrinkPickerBottomSheet.displayName = 'DrinkPickerBottomSheet';

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  options: {
    gap: 10,
  },
});

export default DrinkPickerBottomSheet;
