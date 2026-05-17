import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { formatWithUnit } from '@/utils/formatters';

import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

export type FoodServing = {
  grams: number;
  label: string;
  nutrientAmount?: number;
  nutrientUnit?: string;
  nutrientLabel?: string;
  nutrientTag?: string;
};

export type FoodPortionBottomSheetProps = {
  foodPortionBottomSheetRef: React.RefObject<BottomSheetModal | null>;
  snapPoints: (string | number)[];
  BottomSheetOverlayContainer?: any;
  colors: any;
  foodName: string;
  foodDetails: string;
  foodImage?: ImageSourcePropType | null;
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
  foodImage,
  servingSizes,
  onSelectServing,
}) => {
  const { t } = useTranslation();
  
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
      <View style={styles.headerRow}>
        {!!foodImage && <Image source={foodImage} style={styles.foodImage} resizeMode="cover" />}
        <View style={styles.headerTextBlock}>
          <ThemedText type="title3" style={styles.sheetTitle}>
            {foodName}
          </ThemedText>
          <ThemedText type="caption" style={[styles.foodDetails, { color: colors.textMuted }]}> 
            {foodDetails}
          </ThemedText>
        </View>
      </View>

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
                  {`${formatWithUnit(serving.nutrientAmount, serving.nutrientUnit, serving.nutrientTag)}${serving.nutrientLabel ? ' ' + serving.nutrientLabel.toLowerCase() : ''}`}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
    paddingTop: 2,
  },
  foodImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  sheetTitle: {
    marginBottom: 2,
    textAlign: 'left',
  },
  foodDetails: {
    marginBottom: 8,
    textAlign: 'left',
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
