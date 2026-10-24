import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { WeeklyNutritionValue } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import type { BarcodeProduct } from '@/services/openFoodFacts';
import { getTargetDates } from '@/services/targetProgress/dateRange';
import { getNutritionTrackingAnalysis } from '@/utils/nutritionTrackingPrompt';

export const useCatalogTracking = (selectedDate: string) => {
  const { plans, setWeeklyNutritionTracking } = useStorage();
  const { t } = useTranslation();
  const { keys } = useMemo(() => getNutritionTrackingAnalysis(plans?.nutrition ?? [], true), [plans?.nutrition]);
  const tracksColors = keys.has('vegetable_colors');
  const tracksPlants = keys.has('unique_plants');

  return useCallback((nutritionEntryId: string, product: BarcodeProduct, amount: number) => {
    if (!product.fromCatalog || amount <= 0) return;

    const signals: Record<string, WeeklyNutritionValue> = {};
    if (tracksColors && product.vegetableColor) {
      const color = product.vegetableColor;
      signals.vegetable_colors = [{ en: color, local: t(`journal:nutritionLogger.plantColorLabels.${color}`) }];
    }
    if (tracksPlants && product.plantName) {
      signals.unique_plants = [{ en: product.plantName, local: product.name }];
    }
    for (const [key, count] of Object.entries(product.catalogTrackingCounts ?? {})) {
      if (keys.has(key) && Number.isFinite(count) && count > 0) signals[key] = count;
    }
    if (!Object.keys(signals).length) return;
    const weekKey = getTargetDates(selectedDate, 'weekly')[0];
    const contribution = {
      nutritionEntryId,
      date: selectedDate,
      signals,
    };
    setWeeklyNutritionTracking(previous => ({
      ...previous,
      [weekKey]: [...(previous[weekKey] ?? []), contribution],
    }));
  }, [selectedDate, setWeeklyNutritionTracking, t, tracksColors, tracksPlants, keys]);
};
