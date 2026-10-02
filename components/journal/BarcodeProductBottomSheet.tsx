import { BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Keyboard, StyleSheet, View } from 'react-native';

import type { BarcodeProduct, BarcodeProductType } from '@/services/openFoodFacts';

import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { useBottomSheetDesign } from '../ui/BottomSheetDesign';
import OptionSelector from '../ui/OptionSelector';

export interface BarcodeProductBottomSheetRef {
  present: (product: BarcodeProduct) => void;
  dismiss: () => void;
}

interface BarcodeProductBottomSheetProps {
  onSave: (product: BarcodeProduct, grams: number, productType: BarcodeProductType) => void;
}

const BarcodeProductBottomSheet = forwardRef<BarcodeProductBottomSheetRef, BarcodeProductBottomSheetProps>(({ onSave }, ref) => {
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
        setGramsText('100');
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

  const nutrition = product?.nutrition;
  const calories = nutrition?.caloriesPer100g !== undefined ? nutrition.caloriesPer100g * factor : undefined;
  const protein = nutrition?.proteinPer100g !== undefined ? nutrition.proteinPer100g * factor : undefined;
  const carbohydrates = nutrition?.carbohydratesPer100g !== undefined ? nutrition.carbohydratesPer100g * factor : undefined;
  const fat = nutrition?.fatPer100g !== undefined ? nutrition.fatPer100g * factor : undefined;
  const fiber = nutrition?.fiberPer100g !== undefined ? nutrition.fiberPer100g * factor : undefined;

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
              {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" /> : null}

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

            <View style={styles.typeSection}>
              <ThemedText type="defaultSemiBold">{t('nutritionLogger.barcodeProduct.type')}</ThemedText>

              <View style={styles.typeOptions}>
                <OptionSelector
                  value={productType}
                  onChange={setProductType}
                  options={[
                    { value: 'food', label: t('nutritionLogger.barcodeProduct.meal'), icon: 'meal' },
                    { value: 'drink', label: t('nutritionLogger.barcodeProduct.drink'), icon: 'drink' },
                  ]}
                />
              </View>
            </View>

            <View style={styles.amountSection}>
              <ThemedText type="defaultSemiBold">{t('nutritionLogger.barcodeProduct.amount')}</ThemedText>

              <View
                style={[
                  styles.amountInputContainer,
                  {
                    borderColor: colors.border,
                  },
                ]}
              >
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
              </View>
            </View>

            <View
              style={[
                styles.nutrition,
                {
                  borderColor: colors.border,
                },
              ]}
            >
              <NutritionValue label={t('nutritionLogger.barcodeProduct.calories')} value={calories} unit="kcal" />

              <NutritionValue label={t('nutritionLogger.barcodeProduct.protein')} value={protein} unit="g" />

              <NutritionValue label={t('nutritionLogger.barcodeProduct.carbohydrates')} value={carbohydrates} unit="g" />

              <NutritionValue label={t('nutritionLogger.barcodeProduct.fat')} value={fat} unit="g" />

              <NutritionValue label={t('nutritionLogger.barcodeProduct.fiber')} value={fiber} unit="g" />
            </View>

            <ThemedText
              type="caption"
              style={[
                styles.per100g,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {t('nutritionLogger.barcodeProduct.nutritionForAmount')}
            </ThemedText>

            <AppButton title={t('nutritionLogger.barcodeProduct.add')} onPress={handleSave} disabled={grams <= 0} variant="primary" style={styles.saveButton} />

            <ThemedText
              type="caption"
              style={[
                styles.per100g,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              {t('nutritionLogger.barcodeProduct.nutritionCalculatedPer100g')}
            </ThemedText>

            {/* <AppButton title="Lägg till" onPress={handleSave} disabled={grams <= 0} variant="primary" style={styles.saveButton} /> */}
          </>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

BarcodeProductBottomSheet.displayName = 'BarcodeProductBottomSheet';

interface NutritionValueProps {
  label: string;
  value?: number;
  unit: string;
}

const NutritionValue: React.FC<NutritionValueProps> = ({ label, value, unit }) => (
  <View style={styles.nutritionRow}>
    <ThemedText type="default">{label}</ThemedText>

    <ThemedText type="defaultSemiBold">{value !== undefined ? `${Math.round(value * 10) / 10} ${unit}` : '–'}</ThemedText>
  </View>
);

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
    paddingHorizontal: 16,
  },

  amountInput: {
    flex: 1,
  },

  nutrition: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },

  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },

  per100g: {
    marginTop: 8,
    textAlign: 'center',
  },

  saveButton: {
    marginTop: 20,
  },
});

export default BarcodeProductBottomSheet;
