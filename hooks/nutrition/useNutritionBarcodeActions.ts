import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

import type { NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import type { BarcodeProduct, BarcodeProductType } from '@/services/openFoodFacts';
import { toRecordedAt } from '@/utils/dateUtils';
import { hasCaffeine } from '@/utils/drinkCaffeine';
import { scaleNutritionComposition } from '@/utils/nutritionComposition';
import { scaleBarcodeMicronutrients } from '@/utils/openFoodFactsMicronutrients';

interface UseNutritionBarcodeActionsParams {
  selectedDate: string;
  onNutritionEntrySelected: (entry: NutritionEntry) => void;
}

export const useNutritionBarcodeActions = ({ selectedDate, onNutritionEntrySelected }: UseNutritionBarcodeActionsParams) => {
  const { addNutritionEntry, addDrinkEntry } = useStorage();

  return useCallback(
    (product: BarcodeProduct, amount: number, productType: BarcodeProductType, time = new Date()) => {
      const recordedAt = toRecordedAt(selectedDate, time);
      const factor = amount / 100;
      const nutrition = {
        ...scaleBarcodeMicronutrients(product.nutrition, factor),
        name: product.name,
        calories: (product.nutrition.caloriesPer100g ?? 0) * factor,
        protein: (product.nutrition.proteinPer100g ?? 0) * factor,
        carbohydrates: (product.nutrition.carbohydratesPer100g ?? 0) * factor,
        fat: (product.nutrition.fatPer100g ?? 0) * factor,
        fiber: (product.nutrition.fiberPer100g ?? 0) * factor,
        alcoholGrams: product.nutrition.alcoholGramsPer100g === undefined ? undefined : product.nutrition.alcoholGramsPer100g * factor,
        caffeineMg: product.nutrition.caffeineMgPer100g === undefined ? undefined : Math.round(product.nutrition.caffeineMgPer100g * factor),
        ...(product.composition && scaleNutritionComposition(product.composition, factor)),
        ...(product.nutrition.polyphenolsMgPer100g && {
          polyphenolByType: Object.fromEntries(
            Object.entries(product.nutrition.polyphenolsMgPer100g).map(([key, value]) => [key, Math.round(value * factor * 10) / 10])
          ),
        }),
      };

      if (productType === 'drink') {
        const nutritionEntry = addNutritionEntry(selectedDate, {
          type: 'drink',
          recordedAt,
          ...nutrition,
        });

        addDrinkEntry(selectedDate, {
          nutritionEntryId: nutritionEntry.id,
          type: product.drinkType ?? 'drink',
          alcoholPercent: product.alcoholPercent,
          caffeinated: hasCaffeine({ type: product.drinkType, caffeinated: product.caffeinated }),
          name: product.name,
          amountMl: amount,
          recordedAt,
          source: 'manual',
        });
      } else {
        const nutritionEntry = addNutritionEntry(selectedDate, {
          type: 'meal',
          recordedAt,
          ...nutrition,
        });
        onNutritionEntrySelected(nutritionEntry);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    },
    [addDrinkEntry, addNutritionEntry, onNutritionEntrySelected, selectedDate]
  );
};
