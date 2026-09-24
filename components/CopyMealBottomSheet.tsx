import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React from 'react';
import { Pressable, View } from 'react-native';

import type { MealEntry } from '@/app/context/storage/nutrition/nutritionTypes';

import { ThemedText } from './ThemedText';
import { useBottomSheetDesign } from './ui/BottomSheetDesign';
import { IconSymbol } from './ui/IconSymbol';

// Types for props
export type CopyMealBottomSheetProps = {
  copyMealBottomSheetRef: React.RefObject<BottomSheetModal | null>;
  copyMealSheetSnapPoints: string[];
  bottomSheetOverlayContainer?: any;
  colors: any;
  styles: any;
  t: any;
  recentMeals: MealEntry[];
  handleCopyMeal: (meal: MealEntry) => void;
  roundToOneDecimal: (value: number) => number;
};

const CopyMealBottomSheet: React.FC<CopyMealBottomSheetProps> = ({
  copyMealBottomSheetRef,
  copyMealSheetSnapPoints,
  bottomSheetOverlayContainer,
  colors,
  styles,
  t,
  recentMeals,
  handleCopyMeal,
  roundToOneDecimal,
}) => {
  const sheetDesign = useBottomSheetDesign(colors);

  return (
    <BottomSheetModal
      ref={copyMealBottomSheetRef}
      snapPoints={copyMealSheetSnapPoints}
      enablePanDownToClose
      animateOnMount
      containerComponent={bottomSheetOverlayContainer}
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
    >
      <BottomSheetScrollView
        style={styles.copyMealModalScroll}
        contentContainerStyle={styles.copyMealModalContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText type="title3" style={styles.copyMealSheetTitle}>
          {t('nutritionLogger.copyMealModalTitle')}
        </ThemedText>
        {recentMeals.length > 0 ? (
          recentMeals.map(meal => (
            <Pressable
              key={meal.id}
              style={({ pressed }) => [
                styles.copyMealOption,
                {
                  borderLeftWidth: pressed ? 3 : 0,
                  borderLeftColor: colors.primary,
                  backgroundColor: pressed ? colors.cardActive : colors.cardBackground,
                  paddingLeft: pressed ? 9 : 12,
                },
              ]}
              onPress={() => handleCopyMeal(meal)}
            >
              <View style={styles.copyMealStatsRow}>
                <ThemedText type="defaultSemiBold" style={styles.copyMealOptionName} numberOfLines={1}>
                  {meal.name}
                </ThemedText>
                <View style={styles.copyMealStatsGroup}>
                  <View style={styles.copyMealStatItem}>
                    <IconSymbol name="flame" size={14} color={colors.textLight} />
                    <ThemedText type="caption" style={[styles.copyMealStatText, { color: colors.textLight }]}>
                      {roundToOneDecimal(meal.calories ?? 0)}
                    </ThemedText>
                  </View>
                  <View style={styles.copyMealStatItem}>
                    <IconSymbol name="fiber" size={14} color={colors.textLight} />
                    <ThemedText type="caption" style={[styles.copyMealStatText, { color: colors.textLight }]}>
                      {roundToOneDecimal(meal.fiber ?? 0)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <ThemedText type="caption" style={[styles.copyMealEmptyText, { color: colors.textMuted }]}>
            {t('nutritionLogger.copyMealEmpty')}
          </ThemedText>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

export default CopyMealBottomSheet;
