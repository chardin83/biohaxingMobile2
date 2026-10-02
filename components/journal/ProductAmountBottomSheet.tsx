import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Keyboard, Pressable, StyleSheet, View } from 'react-native';

import type { NutritionData } from '@/app/context/storage/nutrition/nutritionTypes';
import type { BarcodeProduct, BarcodeProductType } from '@/services/openFoodFacts';
import { scaleNutritionComposition } from '@/utils/nutritionComposition';

import NutritionBreakdown from '../NutritionBreakdown';
import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { useBottomSheetDesign } from '../ui/BottomSheetDesign';
import OptionSelector from '../ui/OptionSelector';

export interface ProductAmountBottomSheetRef {
  present: (product: BarcodeProduct) => void;
  dismiss: () => void;
}

interface ProductAmountBottomSheetProps {
  onSave: (product: BarcodeProduct, grams: number, productType: BarcodeProductType) => void;
}

const AMOUNT_STEP = 10;

const ProductAmountBottomSheet = forwardRef<ProductAmountBottomSheetRef, ProductAmountBottomSheetProps>(({ onSave }, ref) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const sheetDesign = useBottomSheetDesign(colors);

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [gramsText, setGramsText] = useState('100');
  const [productType, setProductType] = useState<'food' | 'drink'>();

  const snapPoints = useMemo(() => ['75%'], []);

  useImperativeHandle(
    ref,
    () => ({
      present: nextProduct => {
        setProduct(nextProduct);
        setGramsText(String(nextProduct.fromCatalog ? (nextProduct.quantityValue ?? 100) : 100));
        setProductType(nextProduct.productType);

        requestAnimationFrame(() => {
          bottomSheetRef.current?.present();
        });
      },

      dismiss: () => {
        Keyboard.dismiss();
        bottomSheetRef.current?.dismiss();
      },
    }),
    []
  );

  useEffect(() => {
    if (!product) {
      setGramsText('100');
    }
  }, [product]);

  const amountUnit = product?.quantityUnit ?? 'g';

  const grams = useMemo(() => {
    const normalized = gramsText.replace(',', '.').trim();

    const value = Number(normalized);

    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }

    return value;
  }, [gramsText]);

  const factor = grams / 100;

  const adjustAmount = (delta: number) => {
    setGramsText(String(Math.max(0, Math.round((grams + delta) * 10) / 10)));
  };

  const scaledNutrition = useMemo<NutritionData | null>(() => {
    if (!product) return null;

    if (product.composition) {
      return { name: product.name, ...scaleNutritionComposition(product.composition, factor) };
    }

    const per100 = product.nutrition;
    const round1 = (value: number) => Math.round(value * 10) / 10;

    return {
      name: product.name,
      calories: Math.round((per100.caloriesPer100g ?? 0) * factor),
      protein: round1((per100.proteinPer100g ?? 0) * factor),
      carbohydrates: round1((per100.carbohydratesPer100g ?? 0) * factor),
      fat: round1((per100.fatPer100g ?? 0) * factor),
      fiber: round1((per100.fiberPer100g ?? 0) * factor),
      ...(per100.polyphenolsMgPer100g && {
        polyphenolByType: Object.fromEntries(Object.entries(per100.polyphenolsMgPer100g).map(([key, value]) => [key, value * factor])),
      }),
    };
  }, [product, factor]);

  let calculationNoteKey = 'nutritionCalculatedPer100g';
  if (product?.sourceMealId) {
    calculationNoteKey = 'nutritionCalculatedPerMeal';
  } else if (productType === 'drink') {
    calculationNoteKey = 'nutritionCalculatedPer100ml';
  }

  const handleSave = () => {
    if (!product || grams <= 0 || !productType) return;

    Keyboard.dismiss();
    onSave(product, grams, productType);
    bottomSheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={sheetDesign.backgroundStyle}
      handleComponent={sheetDesign.handleComponent}
      onDismiss={() => {
        setProduct(null);
        setProductType(undefined);
      }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {product ? (
          <>
            <View style={styles.productHeader}>
              {product.image || product.imageUrl ? (
                <Image source={product.image ?? { uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" />
              ) : null}

              <View style={styles.productInfo}>
                <ThemedText type="title2">{product.name}</ThemedText>

                {product.brand ? (
                  <ThemedText
                    type="caption"
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    {product.brand}
                  </ThemedText>
                ) : null}

                {product.quantity ? (
                  <ThemedText
                    type="caption"
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    {product.quantity}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            {!product.fromCatalog && (
              <View style={styles.typeSection}>
                <ThemedText type="defaultSemiBold">{t('journal:nutritionLogger.barcodeProduct.type')}</ThemedText>

                <View style={styles.typeOptions}>
                  <OptionSelector
                    value={productType}
                    onChange={setProductType}
                    options={[
                      { value: 'food', label: t('journal:nutritionLogger.barcodeProduct.meal'), icon: 'meal' },
                      { value: 'drink', label: t('journal:nutritionLogger.barcodeProduct.drink'), icon: 'drink' },
                    ]}
                  />
                </View>
              </View>
            )}

            <View style={styles.amountSection}>
              <ThemedText type="defaultSemiBold">{t('journal:nutritionLogger.barcodeProduct.amount')}</ThemedText>

              <View
                style={[
                  styles.amountInputContainer,
                  {
                    borderColor: colors.border,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="-10"
                  onPress={() => adjustAmount(-AMOUNT_STEP)}
                  style={[styles.stepButton, { borderColor: colors.border }]}
                >
                  <ThemedText type="title3">−</ThemedText>
                </Pressable>

                <BottomSheetTextInput
                  style={[
                    styles.amountInput,
                    {
                      color: colors.text,
                    },
                  ]}
                  value={gramsText}
                  onChangeText={setGramsText}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />

                <ThemedText type="default" style={{ color: colors.textMuted }}>
                  {amountUnit}
                </ThemedText>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="+10"
                  onPress={() => adjustAmount(AMOUNT_STEP)}
                  style={[styles.stepButton, { borderColor: colors.border }]}
                >
                  <ThemedText type="title3">+</ThemedText>
                </Pressable>
              </View>

              {product.servings && product.servings.length > 0 && (
                <View style={styles.servings}>
                  {product.servings.map(serving => {
                    const selected = serving.grams === grams;
                    const gramsLabel = `${serving.grams} g`;

                    return (
                      <Pressable
                        key={`${serving.labelKey ?? 'grams'}-${serving.grams}`}
                        onPress={() => setGramsText(String(serving.grams))}
                        style={[styles.servingChip, { borderColor: selected ? colors.primary : colors.border }]}
                      >
                        <ThemedText type="caption" style={selected ? { color: colors.primary } : undefined}>
                          {serving.labelKey ? `${t(`food:servingSizes.${serving.labelKey}`, { defaultValue: gramsLabel })} · ${gramsLabel}` : gramsLabel}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {scaledNutrition && (
              <View style={[styles.nutrition, { borderColor: colors.border }]}>
                <NutritionBreakdown nutrition={scaledNutrition} keyPrefix="product" />
              </View>
            )}

            <ThemedText
              type="caption"
              style={[
                styles.per100g,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {t('journal:nutritionLogger.barcodeProduct.nutritionForAmount')}
            </ThemedText>

            <AppButton
              title={t('journal:nutritionLogger.barcodeProduct.add')}
              onPress={handleSave}
              disabled={grams <= 0}
              variant="primary"
              style={styles.saveButton}
            />

            <ThemedText
              type="caption"
              style={[
                styles.per100g,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {t(`journal:nutritionLogger.barcodeProduct.${calculationNoteKey}`)}
            </ThemedText>

            {/* <AppButton title="Lägg till" onPress={handleSave} disabled={grams <= 0} variant="primary" style={styles.saveButton} /> */}
          </>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

ProductAmountBottomSheet.displayName = 'ProductAmountBottomSheet';

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },

  productImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },

  productInfo: {
    flex: 1,
    gap: 3,
  },
  typeSection: {
    gap: 8,
    marginBottom: 20,
  },

  typeOptions: {
    flexDirection: 'row',
    gap: 12,
  },

  typeButton: {
    flex: 1,
  },

  amountSection: {
    gap: 8,
    marginBottom: 20,
  },

  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  amountInput: {
    flex: 1,
    textAlign: 'center',
  },

  stepButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  servings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  servingChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  nutrition: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },

  per100g: {
    marginTop: 8,
    textAlign: 'center',
  },

  saveButton: {
    marginTop: 20,
  },
});

export default ProductAmountBottomSheet;
