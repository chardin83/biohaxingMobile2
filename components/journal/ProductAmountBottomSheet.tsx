import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Keyboard, Pressable, StyleSheet, View } from 'react-native';

import type { NutritionData } from '@/app/context/storage/nutrition/nutritionTypes';
import { PREMIUM } from '@/constants/Premium';
import { getDrinkImage } from '@/locales/drinkCatalog';
import { getFreePhotoAnalysesRemaining } from '@/services/nutrition/photoAnalysisQuota';
import type { BarcodeProduct, BarcodeProductType } from '@/services/openFoodFacts';
import { getAlcoholPercent, withAlcoholPercent } from '@/utils/drinkAlcohol';
import { scaleNutritionComposition } from '@/utils/nutritionComposition';
import { hasEnergyConflict } from '@/utils/openFoodFactsEnergy';
import { scaleBarcodeMicronutrients } from '@/utils/openFoodFactsMicronutrients';

import NumberStepper from '../NumberStepper';
import NutritionBreakdown from '../NutritionBreakdown';
import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { useBottomSheetDesign } from '../ui/BottomSheetDesign';
import { DateTimeInput } from '../ui/DateTimeInput';
import Notice from '../ui/Notice';
import OptionSelector from '../ui/OptionSelector';

export interface ProductAmountBottomSheetRef {
  present: (product: BarcodeProduct) => void;
  dismiss: () => void;
}

interface ProductAmountBottomSheetProps {
  onDiscoverPremium?: () => void;
  onAnalyzePremium?: (product: BarcodeProduct, amount: number, productType: BarcodeProductType, time: Date) => void;
  onSave: (product: BarcodeProduct, grams: number, productType: BarcodeProductType, time?: Date) => void;
}

const getProductImage = (product: BarcodeProduct | null, productType?: BarcodeProductType) => {
  if (productType === 'drink' && product?.drinkType) return getDrinkImage(product.drinkType);
  if (product?.image) return product.image;
  if (product?.imageUrl) return { uri: product.imageUrl };
  return undefined;
};

const getCalculationNoteKey = (product: BarcodeProduct | null, productType?: BarcodeProductType): string => {
  if (product?.sourceMealId) return 'nutritionCalculatedPerMeal';
  if (productType === 'drink') return 'nutritionCalculatedPer100ml';
  return 'nutritionCalculatedPer100g';
};

type ProductEnergyWarningProps = {
  product: BarcodeProduct;
  productType?: BarcodeProductType;
  calorieOverride?: number;
  onChange: (value: number) => void;
};

const ProductEnergyWarning = ({ product, productType, calorieOverride, onChange }: ProductEnergyWarningProps) => {
  const { t } = useTranslation();
  const { caloriesPer100g, energyKjPer100g } = product.nutrition;
  if (!hasEnergyConflict(caloriesPer100g, energyKjPer100g)) return null;
  const unit = productType === 'drink' ? 'ml' : 'g';
  const label = t('journal:nutritionLogger.barcodeProduct.editCalories', { unit });
  return (
    <View style={styles.energyWarning}>
      <Notice variant="warning" message={t('journal:nutritionLogger.barcodeProduct.energyConflict', { kcal: caloriesPer100g, kj: energyKjPer100g, unit })} />
      <ThemedText type="caption">{label}</ThemedText>
      <NumberStepper value={calorieOverride ?? caloriesPer100g} onChange={onChange} min={0} inBottomSheet accessibilityLabel={label} />
    </View>
  );
};

const ProductAmountBottomSheet = forwardRef<ProductAmountBottomSheetRef, ProductAmountBottomSheetProps>(
  ({ onSave, onAnalyzePremium, onDiscoverPremium }, ref) => {
    const { colors } = useTheme();
    const { t, i18n } = useTranslation();
    const sheetDesign = useBottomSheetDesign(colors);

    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const [product, setProduct] = useState<BarcodeProduct | null>(null);
    const [gramsText, setGramsText] = useState('100');
    const [calorieOverride, setCalorieOverride] = useState<number>();
    const [productType, setProductType] = useState<'food' | 'drink'>();
    const [alcoholPercent, setAlcoholPercent] = useState<number>();
    const [time, setTime] = useState(() => new Date());

    const snapPoints = useMemo(() => ['75%'], []);

    useImperativeHandle(
      ref,
      () => ({
        present: nextProduct => {
          setProduct(nextProduct);
          setCalorieOverride(undefined);
          setAlcoholPercent(getAlcoholPercent(nextProduct));
          setGramsText(String(nextProduct.fromCatalog ? (nextProduct.quantityValue ?? 100) : 100));
          setProductType(nextProduct.productType);
          setTime(new Date());

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

    const amountUnit = productType === 'drink' ? 'ml' : (product?.quantityUnit ?? 'g');
    const productImage = getProductImage(product, productType);

    const grams = useMemo(() => {
      const normalized = gramsText.replace(',', '.').trim();

      const value = Number(normalized);

      if (!Number.isFinite(value) || value <= 0) {
        return 0;
      }

      return value;
    }, [gramsText]);

    const factor = grams / 100;
    const alcoholAdjustedProduct = useMemo(
      () => (product && alcoholPercent !== undefined && productType === 'drink' ? withAlcoholPercent(product, alcoholPercent) : product),
      [product, alcoholPercent, productType]
    );
    const adjustedProduct = useMemo(() => {
      if (!alcoholAdjustedProduct || calorieOverride === undefined) return alcoholAdjustedProduct;
      return {
        ...alcoholAdjustedProduct,
        nutrition: { ...alcoholAdjustedProduct.nutrition, caloriesPer100g: calorieOverride, energyKjPer100g: calorieOverride * 4.184 },
        ...(alcoholAdjustedProduct.composition && { composition: { ...alcoholAdjustedProduct.composition, calories: calorieOverride } }),
      };
    }, [alcoholAdjustedProduct, calorieOverride]);

    const scaledNutrition = useMemo<NutritionData | null>(() => {
      const nutritionProduct = adjustedProduct;
      if (!nutritionProduct) return null;

      if (nutritionProduct.composition) {
        return { name: nutritionProduct.name, ...scaleNutritionComposition(nutritionProduct.composition, factor) };
      }

      const per100 = nutritionProduct.nutrition;
      const round1 = (value: number) => Math.round(value * 10) / 10;

      return {
        ...scaleBarcodeMicronutrients(per100, factor),
        name: nutritionProduct.name,
        calories: Math.round((per100.caloriesPer100g ?? 0) * factor),
        protein: round1((per100.proteinPer100g ?? 0) * factor),
        carbohydrates: round1((per100.carbohydratesPer100g ?? 0) * factor),
        fat: round1((per100.fatPer100g ?? 0) * factor),
        fiber: round1((per100.fiberPer100g ?? 0) * factor),
        alcoholGrams: per100.alcoholGramsPer100g === undefined ? undefined : per100.alcoholGramsPer100g * factor,
        caffeineMg: per100.caffeineMgPer100g === undefined ? undefined : Math.round(per100.caffeineMgPer100g * factor),
        ...(per100.polyphenolsMgPer100g && {
          polyphenolByType: Object.fromEntries(Object.entries(per100.polyphenolsMgPer100g).map(([key, value]) => [key, value * factor])),
        }),
      };
    }, [adjustedProduct, factor]);

    const alcoholFormatter = new Intl.NumberFormat(i18n.resolvedLanguage ?? i18n.language, { maximumFractionDigits: 1 });

    const calculationNoteKey = getCalculationNoteKey(product, productType);

    const handleSave = () => {
      if (!product || grams <= 0 || !productType) return;

      Keyboard.dismiss();
      onSave(adjustedProduct ?? product, grams, productType, productType === 'drink' ? time : undefined);
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
                {productImage ? <Image source={productImage} style={styles.productImage} resizeMode="contain" /> : null}

                <View style={styles.productInfo}>
                  <ThemedText type="title2">{product.name}</ThemedText>
                  {productType === 'drink' && (
                    <View style={styles.timeSection}>
                      <DateTimeInput value={time} onChange={setTime} showTime showDate={false} />
                    </View>
                  )}

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
                <View style={styles.quantityFields}>
                  {productType === 'drink' && alcoholPercent !== undefined && (
                    <View style={[styles.quantityField, { borderColor: colors.border }]}>
                      <ThemedText type="caption">{t('journal:nutritionLogger.alcoholStrength')} (%)</ThemedText>
                      <NumberStepper
                        value={alcoholPercent}
                        onChange={setAlcoholPercent}
                        min={0}
                        max={100}
                        step={0.5}
                        compact
                        inBottomSheet
                        accessibilityLabel={t('journal:nutritionLogger.alcoholStrength')}
                      />
                    </View>
                  )}
                  <View style={[styles.quantityField, { borderColor: colors.border }]}>
                    <ThemedText type="caption">
                      {t('journal:nutritionLogger.barcodeProduct.amount')} ({amountUnit})
                    </ThemedText>
                    <NumberStepper
                      value={grams}
                      onChange={value => setGramsText(String(value))}
                      min={0}
                      step={10}
                      compact
                      inBottomSheet
                      accessibilityLabel={t('journal:nutritionLogger.barcodeProduct.amount')}
                    />
                  </View>
                </View>

                {productType === 'drink' && alcoholPercent !== undefined && scaledNutrition && (
                  <Notice
                    variant="info"
                    iconName="alcohol"
                    message={t('journal:nutritionLogger.alcoholPortionInfo', {
                      grams: alcoholFormatter.format(scaledNutrition.alcoholGrams ?? 0),
                      glasses: alcoholFormatter.format((scaledNutrition.alcoholGrams ?? 0) / 12),
                    })}
                  />
                )}

                {product.servings && product.servings.length > 0 && (
                  <View style={styles.servings}>
                    {product.servings.map(serving => {
                      const selected = serving.grams === grams;
                      const gramsLabel = `${serving.grams} g`;
                      const servingName = serving.labelKey ? t(`food:servingSizes.${serving.labelKey}`, { defaultValue: gramsLabel }) : null;
                      const servingLabel = servingName === null ? gramsLabel : `${servingName} · ${gramsLabel}`;

                      return (
                        <Pressable
                          key={`${serving.labelKey ?? 'grams'}-${serving.grams}`}
                          onPress={() => setGramsText(String(serving.grams))}
                          style={[styles.servingChip, { borderColor: selected ? colors.primary : colors.border }]}
                        >
                          <ThemedText type="caption" style={selected ? { color: colors.primary } : undefined}>
                            {servingLabel}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <ProductEnergyWarning product={product} productType={productType} calorieOverride={calorieOverride} onChange={setCalorieOverride} />

              {scaledNutrition && (
                <View style={[styles.nutrition, { borderColor: colors.border }]}>
                  <NutritionBreakdown nutrition={scaledNutrition} keyPrefix="product" existingDataOnly={product.fromCatalog === true} />
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

              {!product.fromCatalog && product.barcode && onAnalyzePremium ? (
                <View style={styles.premiumAnalysis}>
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>
                    {t('journal:nutritionLogger.barcodeProduct.premiumAnalysisHint')}
                  </ThemedText>
                  <AppButton
                    title={t('journal:nutritionLogger.barcodeProduct.analyzePremium')}
                    variant="premium"
                    icon="crown"
                    rightIcon="chevron.right"
                    disabled={grams <= 0 || !productType}
                    onPress={async () => {
                      if (!productType || grams <= 0) return;
                      Keyboard.dismiss();
                      if (!PREMIUM && (await getFreePhotoAnalysesRemaining()) === 0) {
                        onDiscoverPremium?.();
                        return;
                      }
                      onAnalyzePremium(adjustedProduct ?? product, grams, productType, time);
                      bottomSheetRef.current?.dismiss();
                    }}
                  />
                </View>
              ) : null}

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
  }
);

ProductAmountBottomSheet.displayName = 'ProductAmountBottomSheet';

const styles = StyleSheet.create({
  energyWarning: { gap: 8, marginBottom: 16 },
  premiumAnalysis: { marginTop: 16, gap: 10 },
  timeSection: { marginTop: 6, alignItems: 'flex-start' },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  productHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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

  quantityFields: { flexDirection: 'row', gap: 10 },
  quantityField: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

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
