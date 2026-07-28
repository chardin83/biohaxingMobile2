import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React from 'react';
import { Pressable,View } from 'react-native';

import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import { useBottomSheetDesign } from './ui/BottomSheetDesign';

// Types for props
export type CopyMealBottomSheetProps = {
  copyMealBottomSheetRef: React.RefObject<BottomSheetModal | null>;
  copyMealSheetSnapPoints: string[];
  BottomSheetOverlayContainer: any;
  colors: any;
  styles: any;
  t: any;
  recentMeals: any[];
  handleCopyMeal: (meal: any) => void;
  roundToOneDecimal: (value: number) => number;
};

const CopyMealBottomSheet: React.FC<CopyMealBottomSheetProps> = ({
  copyMealBottomSheetRef,
  copyMealSheetSnapPoints,
  BottomSheetOverlayContainer,
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
      containerComponent={BottomSheetOverlayContainer}
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
          recentMeals.map(option => (
            <Pressable
              key={option.id}
              style={({ pressed }) => [
                styles.copyMealOption,
                {
                  borderLeftWidth: pressed ? 3 : 0,
                  borderLeftColor: colors.primary,
                  backgroundColor: pressed ? colors.cardActive : colors.cardBackground,
                  paddingLeft: pressed ? 9 : 12,
                },
              ]}
              onPress={() => handleCopyMeal(option.meal)}
            >
              <View style={styles.copyMealStatsRow}>
                <ThemedText type="defaultSemiBold" style={styles.copyMealOptionName} numberOfLines={1}>
                  {option.mealName}
                </ThemedText>
                <View style={styles.copyMealStatsGroup}>
                  <View style={styles.copyMealStatItem}>
                    <IconSymbol name="flame" size={14} color={colors.textLight} />
                    <ThemedText type="caption" style={[styles.copyMealStatText, { color: colors.textLight }]}> 
                      {roundToOneDecimal(typeof option.meal?.calories === 'number' ? option.meal.calories : 0)}
                    </ThemedText>
                  </View>
                  <View style={styles.copyMealStatItem}>
                    <IconSymbol name="fiber" size={14} color={colors.textLight} />
                    <ThemedText type="caption" style={[styles.copyMealStatText, { color: colors.textLight }]}> 
                      {roundToOneDecimal(typeof option.meal?.fiber === 'number' ? option.meal.fiber : 0)}
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
