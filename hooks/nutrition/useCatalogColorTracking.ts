import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useStorage } from '@/app/context/StorageContext';
import type { BarcodeProduct } from '@/services/openFoodFacts';
import { getTargetDates } from '@/services/targetProgress/dateRange';
import { getNutritionTrackingAnalysis } from '@/utils/nutritionTrackingPrompt';

export const useCatalogColorTracking = (selectedDate: string) => {
  const { plans, setWeeklyNutritionTracking } = useStorage();
  const { t } = useTranslation();
  const tracksColors = getNutritionTrackingAnalysis(plans?.nutrition ?? [], true).keys.has('vegetable_colors');

  return useCallback((nutritionEntryId: string, product: BarcodeProduct, amount: number) => {
    if (!tracksColors || !product.fromCatalog || !product.vegetableColor || amount <= 0) return;

    const color = product.vegetableColor;
    const weekKey = getTargetDates(selectedDate, 'weekly')[0];
    const contribution = {
      nutritionEntryId,
      date: selectedDate,
      signals: { vegetable_colors: [{ en: color, local: t(`journal:nutritionLogger.plantColorLabels.${color}`) }] },
    };
    setWeeklyNutritionTracking(previous => ({
      ...previous,
      [weekKey]: [...(previous[weekKey] ?? []), contribution],
    }));
  }, [selectedDate, setWeeklyNutritionTracking, t, tracksColors]);
};
