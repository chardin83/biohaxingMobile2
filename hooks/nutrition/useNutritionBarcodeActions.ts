import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

import type { NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import type { BarcodeProduct, BarcodeProductType } from '@/services/openFoodFacts';
import { toRecordedAt } from '@/utils/dateUtils';

interface UseNutritionBarcodeActionsParams {
  selectedDate: string;
  onNutritionEntrySelected: (entry: NutritionEntry) => void;
}

export const useNutritionBarcodeActions = ({ selectedDate, onNutritionEntrySelected }: UseNutritionBarcodeActionsParams) => {
  const { addNutritionEntry, addDrinkEntry } = useStorage();

  return useCallback(
    (product: BarcodeProduct, amount: number, productType: BarcodeProductType) => {
      const recordedAt = toRecordedAt(selectedDate, new Date());
      const factor = amount / 100;
      const nutrition = {
        name: product.name,
        calories: (product.nutrition.caloriesPer100g ?? 0) * factor,
        protein: (product.nutrition.proteinPer100g ?? 0) * factor,
        carbohydrates: (product.nutrition.carbohydratesPer100g ?? 0) * factor,
        fat: (product.nutrition.fatPer100g ?? 0) * factor,
        fiber: (product.nutrition.fiberPer100g ?? 0) * factor,
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
