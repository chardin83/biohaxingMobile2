import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

export type FoodServing = {
  grams: number;
  label: string;
  nutrientAmount?: number;
  nutrientUnit?: string;
  nutrientLabel?: string;
};

export type FoodPortionBottomSheetProps = {
  foodPortionBottomSheetRef: React.RefObject<BottomSheetModal | null>;
  snapPoints: (string | number)[];
  BottomSheetOverlayContainer?: any;
  colors: any;
  foodName: string;
  foodDetails: string;
  servingSizes: FoodServing[];
  onSelectServing: (serving: FoodServing) => void;
};

const FoodPortionBottomSheet: React.FC<FoodPortionBottomSheetProps> = ({
  foodPortionBottomSheetRef,
  snapPoints,
  BottomSheetOverlayContainer,
  colors,
  foodName,
  foodDetails,
  servingSizes,
  onSelectServing,
}) => {
  const { t } = useTranslation();
  const formatAmount = (value: number): string => {
    if (value === 0) return '0';
    if (value < 1) return value.toFixed(2);
    if (value < 10) return value.toFixed(1);
    return value.toFixed(0);
  };
  const isLabelSameAsGrams = (serving: FoodServing): boolean => {
    const normalizedLabel = Array.from(serving.label)
      .filter(char => !/\s/.test(char))
      .join('')
      .toLowerCase();
    const normalizedGrams = `${serving.grams}g`;
    return normalizedLabel === normalizedGrams;
  };

  return (
  <BottomSheetModal
    ref={foodPortionBottomSheetRef}
    snapPoints={snapPoints}
    enablePanDownToClose
    animateOnMount
    containerComponent={BottomSheetOverlayContainer}
    backgroundStyle={{ backgroundColor: colors.background }}
    handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
  >
    <BottomSheetScrollView
      style={styles.sheetScroll}
      contentContainerStyle={styles.sheetContent}
      showsVerticalScrollIndicator
      keyboardShouldPersistTaps="handled"
    >
      <ThemedText type="title3" style={styles.sheetTitle}>
        {foodName}
      </ThemedText>
      <ThemedText type="caption" style={[styles.foodDetails, { color: colors.textMuted }]}>
        {foodDetails}
      </ThemedText>

      <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
        {t('common:foodPortionBottomSheet.selectPortion')}
      </ThemedText>

      {servingSizes.map(serving => (
        <Pressable
          key={serving.label}
          style={({ pressed }) => [
            styles.option,
            {
              borderLeftWidth: pressed ? 3 : 0,
              borderLeftColor: colors.primary,
              backgroundColor: pressed ? colors.cardActive : colors.cardBackground,
              paddingLeft: pressed ? 9 : 12,
            },
          ]}
          onPress={() => {
            onSelectServing(serving);
            foodPortionBottomSheetRef.current?.dismiss();
          }}
        >
          <View style={styles.optionRow}>
            <View style={styles.optionTextBlock}>
              <View style={styles.inlineLabelRow}>
                <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.inlineLabelMain}>
                  {serving.label}
                </ThemedText>
                {!isLabelSameAsGrams(serving) && (
                  <ThemedText type="explainer" numberOfLines={1} style={styles.inlineLabelMeta}>
                    {` · ${serving.grams}g`}
                  </ThemedText>
                )}
              </View>
              {typeof serving.nutrientAmount === 'number' && serving.nutrientUnit && serving.nutrientLabel && (
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {`${formatAmount(serving.nutrientAmount)}${serving.nutrientUnit} ${serving.nutrientLabel.toLowerCase()}`}
                </ThemedText>
              )}
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.textLight ?? colors.primary} />
          </View>
        </Pressable>
      ))}
    </BottomSheetScrollView>
  </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetScroll: {
    width: '100%',
  },
  sheetContent: {
    width: '100%',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  sheetTitle: {
    paddingTop: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  foodDetails: {
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 4,
  },
  option: {
    width: '100%',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  optionTextBlock: {
    flex: 1,
    gap: 2,
  },
  inlineLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  inlineLabelMain: {
    flexShrink: 1,
  },
  inlineLabelMeta: {
    flexShrink: 0,
  },
});

export default FoodPortionBottomSheet;
