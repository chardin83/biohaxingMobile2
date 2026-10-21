import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import type { MealEntry, NutritionEntry, NutritionTrackingContribution } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { PREMIUM } from '@/constants/Premium';
import { useNutritionAnalysis } from '@/hooks/nutrition/useNutritionAnalysis';
import { useNutritionBarcodeActions } from '@/hooks/nutrition/useNutritionBarcodeActions';
import { useNutritionLoggerData } from '@/hooks/nutrition/useNutritionLoggerData';
import { useNutritionTipCompletion } from '@/hooks/nutrition/useNutritionTipCompletion';
import { getDrinkProduct } from '@/locales/drinkCatalog';
import { tips } from '@/locales/tips';
import type { DrinkType } from '@/services/gptServices';
import { roundToOneDecimal, type WeeklyTrackingSignals } from '@/utils/analyzeNutrition';
import { toDateKey, toRecordedAt } from '@/utils/dateUtils';
import { hasAlcohol } from '@/utils/drinkAlcohol';
import { hasCaffeine } from '@/utils/drinkCaffeine';
import { type FoodKey, getFoodProduct, getMealProduct } from '@/utils/foodProduct';
import { getNutritionTrackingAnalysis } from '@/utils/nutritionTrackingPrompt';
import { isNutritionTipUntracked } from '@/utils/untrackedNutritionTips';

import { Collapsible } from '../Collapsible';
import CopyMealBottomSheet from '../CopyMealBottomSheet';
import NutritionBreakdown from '../NutritionBreakdown';
import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { Card } from '../ui/Card';
import { IconSymbol } from '../ui/IconSymbol';
import PremiumBottomSheet, { type PremiumBottomSheetRef } from '../ui/PremiumBottomSheet';
import AnalysisStatus from './AnalysisStatus';
import BarcodeInfoBottomSheet from './BarcodeInfoBottomSheet';
import BarcodeScannerBottomSheet from './BarcodeScannerBottomSheet';
import CaffeineLoggingInfoModal from './CaffeineLoggingInfoModal';
import DrinkLoggingInfoModal from './DrinkLoggingInfoModal';
import DrinkPickerBottomSheet from './DrinkPickerBottomSheet';
import EntryEditModal from './EntryEditModal';
import FoodPickerBottomSheet from './FoodPickerBottomSheet';
import { LoggedDrinksSection } from './LoggedDrinksSection';
import { LoggedMealsSection } from './LoggedMealsSection';
import MacroGoalsCard from './MacroGoalsCard';
import MealLoggerBottomSheet from './MealLoggerBottomSheet';
import FoodIdentificationModal from './FoodIdentificationModal';
import NutritionAnalysisBottomSheet from './NutritionAnalysisBottomSheet';
import NutritionAnalysisReviewModal from './NutritionAnalysisReviewModal';
import NutritionPlanTargetsSection from './NutritionPlanTargetsSection';
import PackagingAnalysisModal from './PackagingAnalysisModal';
import ProductAmountBottomSheet from './ProductAmountBottomSheet';

interface NutritionLoggerTabProps {
  selectedDate: string;
  onTipCompleted?: (targetY?: number) => void;
}

const parseDateKeyLocal = (dateKey: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  return new Date(year, month - 1, day);
};

const getStartOfWeekMonday = (date: Date): Date => {
  const result = new Date(date);
  const dayOfWeek = result.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  result.setDate(result.getDate() - diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getWeekBoundsFromDateKey = (
  dateKey: string
): {
  weekStartISO: string;
  weekEndISO: string;
} => {
  const date = parseDateKeyLocal(dateKey);
  const weekStartDate = getStartOfWeekMonday(date);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  return {
    weekStartISO: toDateKey(weekStartDate),
    weekEndISO: toDateKey(weekEndDate),
  };
};

const NutritionLoggerTab: React.FC<NutritionLoggerTabProps> = ({ selectedDate, onTipCompleted }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    plans,
    dailyNutritionTracking,
    addNutritionEntry,
    updateNutritionEntry,
    removeNutritionEntry,
    weeklyNutritionTracking,
    setWeeklyNutritionTracking,
    dailyDrinkTracking,
    addDrinkEntry,
    updateDrinkEntry,
    removeDrinkEntry,
    hideBarcodeInfo,
    setHideBarcodeInfo,
    userProfile,
  } = useStorage();
  const { weekStartISO: weekStartKey } = getWeekBoundsFromDateKey(selectedDate);
  const { summary, drinks, recentMeals, dailyNutrition } = useNutritionLoggerData(selectedDate);
  const [alcoholInfoRequest, setAlcoholInfoRequest] = useState(0);
  const [caffeineInfoRequest, setCaffeineInfoRequest] = useState(0);
  const loggedMeals = summary?.entries.filter(entry => entry.type !== 'drink') ?? [];
  const { fulfilledTipsSectionYRef, periodSectionYRef, nutritionPlanTipProgressByPeriod, getCompletionAnimValue, tipRowLocalYByKeyRef, tipRowPeriodByKeyRef } =
    useNutritionTipCompletion({ selectedDate, weekStartKey, onTipCompleted });

  const [selectedNutrition, setSelectedNutrition] = useState<NutritionEntry | null>(null);
  const [selectedNutritionName, setSelectedNutritionName] = useState<string | null>(null);
  const [selectedNutritionEntryId, setSelectedNutritionEntryId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<{
    kind: 'meal' | 'drink';
    id: string;
    name: string;
    recordedAt: Date;
  } | null>(null);
  const copyMealBottomSheetRef = useRef<BottomSheetModal>(null);
  const nutritionAnalysisBottomSheetRef = useRef<BottomSheetModal>(null);
  const premiumBottomSheetRef = useRef<PremiumBottomSheetRef>(null);
  const mealLoggerBottomSheetRef = useRef<BottomSheetModal>(null);
  const drinkPickerBottomSheetRef = useRef<BottomSheetModal>(null);
  const foodPickerBottomSheetRef = useRef<BottomSheetModal>(null);
  const productAmountBottomSheetRef = useRef<BottomSheetModal>(null);
  const barcodeScannerBottomSheetRef = useRef<BottomSheetModal>(null);
  const barcodeInfoBottomSheetRef = useRef<BottomSheetModal>(null);
  const handleSelectNutritionEntry = useCallback((entry: NutritionEntry) => {
    setSelectedNutritionEntryId(entry.id);
    setSelectedNutritionName(entry.name);
    setSelectedNutrition(entry);
  }, []);
  const copySourceMealIdRef = useRef<string | null>(null);
  const handleNutritionEntrySaved = (entry: NutritionEntry) => {
    handleSelectNutritionEntry(entry);

    const sourceId = copySourceMealIdRef.current;
    copySourceMealIdRef.current = null;
    if (!sourceId) return;

    const sourceMeal = recentMeals.find(meal => meal.id === sourceId);
    if (!sourceMeal) return;

    const sourceContribution = findWeeklyTrackingContribution(sourceId, toDateKey(new Date(sourceMeal.recordedAt)));
    if (sourceContribution) {
      addWeeklyTrackingContribution(entry.id, selectedDate, sourceContribution.signals);
    }
  };
  const handleSaveBarcodeProduct = useNutritionBarcodeActions({ selectedDate, onNutritionEntrySelected: handleNutritionEntrySaved });
  const clearSelectedNutrition = useCallback(() => {
    setSelectedNutrition(null);
    setSelectedNutritionEntryId(null);
    setSelectedNutritionName(null);
  }, []);
  const presentNutritionAnalysisSheet = useCallback(() => {
    nutritionAnalysisBottomSheetRef.current?.present();
  }, []);
  const dismissNutritionAnalysisSheet = useCallback(() => {
    nutritionAnalysisBottomSheetRef.current?.dismiss();
  }, []);
  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, []);

  const untrackedNutritionTips = useMemo(() => {
    const planTipIds = new Set((plans?.nutrition ?? []).map(planTip => planTip.tipId));
    return tips.filter(tip => planTipIds.has(tip.id) && isNutritionTipUntracked(tip, userProfile?.weightKg, userProfile?.nutritionGoals?.protein, PREMIUM));
  }, [plans, userProfile?.weightKg, userProfile?.nutritionGoals?.protein]);

  const {
    targets: activeTrackingTargetsForAI,
    keys: activeTrackingKeys,
    prompt: trackingPromptForAI,
  } = useMemo(() => getNutritionTrackingAnalysis(plans?.nutrition ?? [], true), [plans?.nutrition]);

  const {
    foodReviewMealName,
    setFoodReviewMealName,
    analyzingFoods,
    foodReviewFoods,
    setFoodReviewFoods,
    confirmFoods,
    isAnalyzing,
    analysisResult,
    setAnalysisResult,
    isAnalysisReviewModalVisible,
    pendingAnalysisReview,
    mealTime,
    setMealTime,
    isPackagingModalVisible,
    packagingMealImage,
    canReAnalyze,
    closeAnalysisReviewModal,
    handleToggleDrinkConfirmation,
    handleReAnalyze,
    handleAnalyzePackaging,
    handleClosePackagingModal,
    handleAnalyzePhoto,
    handleAnalyzeBarcodeProduct,
  } = useNutritionAnalysis({
    selectedDate,
    trackingPrompt: trackingPromptForAI,
    trackingTargets: activeTrackingTargetsForAI,
    activeTrackingKeys,
    clearSelectedNutrition,
    presentAnalysisSheet: presentNutritionAnalysisSheet,
    dismissAnalysisSheet: dismissNutritionAnalysisSheet,
  });

  useEffect(() => {
    if (!isAnalysisReviewModalVisible) return;
    Haptics.selectionAsync().catch(() => undefined);
  }, [isAnalysisReviewModalVisible]);

  useEffect(() => {
    setSelectedNutrition(null);
    setSelectedNutritionEntryId(null);
    setSelectedNutritionName(null);
    setEditingEntry(null);
  }, [selectedDate]);

  const findWeeklyTrackingContribution = (nutritionEntryId: string, dateKey: string): NutritionTrackingContribution | undefined => {
    const { weekStartISO } = getWeekBoundsFromDateKey(dateKey);

    return weeklyNutritionTracking[weekStartISO]?.find(contribution => contribution.nutritionEntryId === nutritionEntryId);
  };

  const addWeeklyTrackingContribution = (nutritionEntryId: string, dateKey: string, signals: WeeklyTrackingSignals) => {
    const filteredSignals = Object.fromEntries(Object.entries(signals).filter(([key]) => activeTrackingKeys.has(key)));

    if (Object.keys(filteredSignals).length === 0) {
      return;
    }

    const { weekStartISO } = getWeekBoundsFromDateKey(dateKey);

    const contribution: NutritionTrackingContribution = {
      nutritionEntryId,
      date: dateKey,
      signals: filteredSignals,
    };

    setWeeklyNutritionTracking(previous => ({
      ...previous,
      [weekStartISO]: [...(previous[weekStartISO] ?? []), contribution],
    }));
  };

  const removeWeeklyTrackingContribution = (nutritionEntryId: string, dateKey: string) => {
    const { weekStartISO } = getWeekBoundsFromDateKey(dateKey);

    setWeeklyNutritionTracking(previous => {
      const contributions = previous[weekStartISO] ?? [];

      const updatedContributions = contributions.filter(contribution => contribution.nutritionEntryId !== nutritionEntryId);

      if (updatedContributions.length === contributions.length) {
        return previous;
      }

      const next = { ...previous };

      if (updatedContributions.length === 0) {
        delete next[weekStartISO];
      } else {
        next[weekStartISO] = updatedContributions;
      }

      return next;
    });
  };

  const handleRemoveMeal = (mealId: string) => {
    if (mealId === selectedNutritionEntryId) {
      setSelectedNutritionEntryId(null);
      setSelectedNutrition(null);
      setSelectedNutritionName(null);
    }

    removeNutritionEntry(selectedDate, mealId);
    removeWeeklyTrackingContribution(mealId, selectedDate);
  };

  const handleRemoveDrink = (drinkId: string) => {
    const drink = dailyDrinkTracking[selectedDate]?.find(entry => entry.id === drinkId);
    const nutritionEntry = dailyNutritionTracking[selectedDate]?.entries.find(entry => entry.id === drink?.nutritionEntryId);
    if (nutritionEntry?.type === 'drink') {
      handleRemoveMeal(nutritionEntry.id);
      return;
    }
    removeDrinkEntry(selectedDate, drinkId);
  };

  const handleStartEditMeal = (entryId: string, entryName: string) => {
    const entry = dailyNutritionTracking[selectedDate]?.entries.find(item => item.id === entryId);
    if (!entry) return;
    setEditingEntry({ kind: 'meal', id: entryId, name: entryName, recordedAt: new Date(entry.recordedAt) });
  };

  const handleSaveEntryEdit = () => {
    if (!editingEntry) {
      setEditingEntry(null);
      return;
    }

    const name = editingEntry.name.trim();
    if (editingEntry.kind === 'meal') {
      const mealName = name || t('journal:nutritionLogger.unnamedMeal');
      updateNutritionEntry(selectedDate, editingEntry.id, {
        name: mealName,
        recordedAt: toRecordedAt(selectedDate, editingEntry.recordedAt),
      });
      if (editingEntry.id === selectedNutritionEntryId) {
        setSelectedNutrition(prev => (prev ? { ...prev, mealName } : prev));
      }
    } else {
      if (!name) return;
      updateDrinkEntry(selectedDate, editingEntry.id, {
        name,
        recordedAt: toRecordedAt(selectedDate, editingEntry.recordedAt),
      });
      const drink = dailyDrinkTracking[selectedDate]?.find(entry => entry.id === editingEntry.id);
      const nutritionEntry = dailyNutritionTracking[selectedDate]?.entries.find(entry => entry.id === drink?.nutritionEntryId);
      if (nutritionEntry?.type === 'drink') {
        const recordedAt = toRecordedAt(selectedDate, editingEntry.recordedAt);
        updateNutritionEntry(selectedDate, nutritionEntry.id, { name, recordedAt });
        if (nutritionEntry.id === selectedNutritionEntryId) {
          setSelectedNutrition(prev => (prev ? { ...prev, name, recordedAt } : prev));
          setSelectedNutritionName(name);
        }
      }
    }

    setEditingEntry(null);
  };

  const handleStartEditDrink = (drinkId: string) => {
    const drink = dailyDrinkTracking[selectedDate]?.find(item => item.id === drinkId);
    if (!drink) return;
    setEditingEntry({ kind: 'drink', id: drinkId, name: drink.name, recordedAt: new Date(drink.recordedAt) });
  };

  const handleCloseCopyMealModal = () => {
    copyMealBottomSheetRef.current?.dismiss();
  };

  const handleSaveAnalyzedMeal = () => {
    if (!pendingAnalysisReview?.analysis) {
      closeAnalysisReviewModal();
      return;
    }

    const analysis = pendingAnalysisReview.analysis;
    const { name, ...nutrition } = analysis;
    const recordedAt = toRecordedAt(selectedDate, mealTime);

    const confirmedDrinks = (pendingAnalysisReview.detectedDrinks ?? []).filter(drink => drink.confirmed).map(({ confirmed: _confirmed, ...drink }) => drink);

    const barcodeContext = pendingAnalysisReview.barcodeContext;
    const newEntry = addNutritionEntry(selectedDate, {
      recordedAt,
      name: name?.trim() || t('journal:nutritionLogger.unnamedMeal'),
      ...nutrition,
      type: barcodeContext?.productType === 'drink' ? 'drink' : 'meal',
    });

    const nutritionEntryId = newEntry.id;
    if (barcodeContext?.productType === 'drink') {
      const product = barcodeContext.product;
      addDrinkEntry(selectedDate, {
        nutritionEntryId,
        recordedAt,
        type: product.drinkType ?? 'drink',
        name: product.name,
        amountMl: barcodeContext.amount,
        alcoholPercent: product.alcoholPercent,
        caffeinated: hasCaffeine({ type: product.drinkType, caffeinated: product.caffeinated }),
        source: 'manual',
      });
      if (hasAlcohol({ type: product.drinkType, alcoholPercent: product.alcoholPercent })) setAlcoholInfoRequest(current => current + 1);
      if (hasCaffeine({ type: product.drinkType, caffeinated: product.caffeinated })) setCaffeineInfoRequest(current => current + 1);
    }

    addWeeklyTrackingContribution(nutritionEntryId, selectedDate, pendingAnalysisReview.weeklyTrackingSignals);

    confirmedDrinks.forEach(drink => {
      addDrinkEntry(selectedDate, {
        nutritionEntryId,
        ...drink,
        recordedAt,
        source: 'meal_analysis',
      });
    });
    if (confirmedDrinks.some(hasAlcohol)) setAlcoholInfoRequest(current => current + 1);
    if (confirmedDrinks.some(hasCaffeine)) {
      setCaffeineInfoRequest(current => current + 1);
    }

    setSelectedNutritionEntryId(nutritionEntryId);
    setSelectedNutritionName(newEntry.name);
    setSelectedNutrition(newEntry);

    setAnalysisResult(t(barcodeContext?.productType === 'drink' ? 'journal:nutritionLogger.drinkAnalysisSaved' : 'journal:nutritionLogger.mealAnalysisSaved'));
    triggerLightHaptic();
    closeAnalysisReviewModal();
  };

  const handleCopyMeal = (sourceEntry: MealEntry) => {
    handleCloseCopyMealModal();
    const product = getMealProduct(sourceEntry);
    requestAnimationFrame(() => productAmountBottomSheetRef.current?.present(product));
  };

  const handleAddManualDrink = (type: DrinkType) => {
    drinkPickerBottomSheetRef.current?.dismiss();
    const product = getDrinkProduct(type, t(`journal:nutritionLogger.drinkTypes.${type}`));
    requestAnimationFrame(() => productAmountBottomSheetRef.current?.present(product));
  };

  const handleChooseFood = (key: FoodKey) => {
    foodPickerBottomSheetRef.current?.dismiss();
    const product = getFoodProduct(key, t(`food:foods.${key}.name`, { defaultValue: key }));
    requestAnimationFrame(() => productAmountBottomSheetRef.current?.present(product));
  };

  const handleSelectLoggedDrink = (drinkId: string) => {
    const drink = dailyDrinkTracking[selectedDate]?.find(item => item.id === drinkId);

    if (!drink) return;

    const nutritionEntry = drink.nutritionEntryId
      ? dailyNutritionTracking[selectedDate]?.entries.find(entry => entry.id === drink.nutritionEntryId && entry.type === 'drink')
      : undefined;

    setSelectedNutritionName(drink.name);

    if (!nutritionEntry) {
      setSelectedNutritionEntryId(null);
      setSelectedNutrition(null);
      return;
    }

    setSelectedNutritionEntryId(nutritionEntry.id);
    setSelectedNutrition(nutritionEntry);
  };

  const todayKey = toDateKey(new Date());
  const isFutureSelectedDate = selectedDate > todayKey;

  const copyMealSheetSnapPoints = useMemo(() => ['45%', '75%'], []);

  return (
    <KeyboardAvoidingView style={globalStyles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <AppButton
          title={isAnalyzing ? t('journal:nutritionLogger.analyzing') : t('journal:nutritionLogger.addNutrition')}
          onPress={() => mealLoggerBottomSheetRef.current?.present()}
          disabled={isAnalyzing}
          variant="primary"
          glow={true}
          icon="camera"
          rightIcon="sparkles"
          content={isAnalyzing ? <AnalysisStatus /> : null}
          style={styles.imagePickerButton}
        />
        {userProfile.trackMacros !== false && <MacroGoalsCard totals={summary?.totals} />}
        {isFutureSelectedDate && (
          <ThemedText
            type="caption"
            style={[
              styles.futureDateHint,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {t('journal:nutritionLogger.futureDateLocked')}
          </ThemedText>
        )}
        {!!selectedNutritionName && (
          <Card
            style={{
              borderRadius: globalStyles.borders.borderRadius,
            }}
          >
            <ThemedText type="title3">
              {t('journal:nutritionLogger.nutritionTitleWithName', {
                name: selectedNutritionName,
              })}
            </ThemedText>

            {selectedNutrition ? (
              <NutritionBreakdown nutrition={selectedNutrition} keyPrefix="meal" />
            ) : (
              <ThemedText type="default" style={{ color: colors.textMuted }}>
                {t('journal:nutritionLogger.nutritionUnavailable')}
              </ThemedText>
            )}
          </Card>
        )}
        {summary && (
          <Card
            style={{
              borderRadius: globalStyles.borders.borderRadius,
            }}
          >
            <Collapsible
              title={t('journal:nutritionLogger.summaryTitle')}
              titleType="title3"
              initialCollapsed
              rightContent={
                <View style={styles.summaryQuickRow}>
                  <View style={styles.summaryQuickItem}>
                    <IconSymbol name="flame" size={14} color={colors.textMuted} />
                    <ThemedText type="caption">{Math.round(summary.totals.calories)}</ThemedText>
                  </View>
                  <View style={styles.summaryQuickItem}>
                    <IconSymbol name="fiber" size={14} color={colors.textMuted} />
                    <ThemedText type="caption">{summary.totals.fiber.toFixed(1)} g</ThemedText>
                  </View>
                </View>
              }
            >
              <NutritionBreakdown nutrition={dailyNutrition} keyPrefix="daily" />
            </Collapsible>
          </Card>
        )}
        {loggedMeals.length > 0 && (
          <LoggedMealsSection meals={loggedMeals} onEdit={handleStartEditMeal} onDelete={handleRemoveMeal} onSelect={handleSelectNutritionEntry} />
        )}
        {drinks.length > 0 && (
          <LoggedDrinksSection drinks={drinks} onEdit={handleStartEditDrink} onDelete={handleRemoveDrink} onSelect={handleSelectLoggedDrink} />
        )}
        <NutritionPlanTargetsSection
          untrackedTips={untrackedNutritionTips}
          userProfile={userProfile}
          onDiscoverPremium={() => premiumBottomSheetRef.current?.present()}
          fulfilledTipsSectionYRef={fulfilledTipsSectionYRef}
          periodSectionYRef={periodSectionYRef}
          nutritionPlanTipProgressByPeriod={nutritionPlanTipProgressByPeriod}
          getCompletionAnimValue={getCompletionAnimValue}
          tipRowLocalYByKeyRef={tipRowLocalYByKeyRef}
          tipRowPeriodByKeyRef={tipRowPeriodByKeyRef}
        />
        {userProfile.trackMacros === false && <MacroGoalsCard totals={summary?.totals} />}
        <PackagingAnalysisModal
          visible={isPackagingModalVisible}
          initialMealImage={packagingMealImage}
          onClose={handleClosePackagingModal}
          onAnalyze={handleAnalyzePackaging}
        />
        <FoodIdentificationModal
          mealName={foodReviewMealName}
          onMealNameChange={setFoodReviewMealName}
          value={foodReviewFoods}
          onChange={setFoodReviewFoods}
          onClose={() => setFoodReviewFoods(null)}
          onConfirm={confirmFoods}
        />
        <NutritionAnalysisReviewModal
          visible={isAnalysisReviewModalVisible}
          pendingReview={pendingAnalysisReview}
          analysisResult={analysisResult}
          mealTime={mealTime}
          onMealTimeChange={setMealTime}
          isAnalyzing={isAnalyzing}
          canReAnalyze={canReAnalyze}
          onReAnalyze={handleReAnalyze}
          onToggleDrink={handleToggleDrinkConfirmation}
          onClose={closeAnalysisReviewModal}
          onSave={handleSaveAnalyzedMeal}
        />
        <EntryEditModal
          visible={editingEntry !== null}
          title={t(editingEntry?.kind === 'drink' ? 'journal:nutritionLogger.editDrinkTitle' : 'journal:nutritionLogger.editMealTitle')}
          nameLabel={t(editingEntry?.kind === 'drink' ? 'journal:nutritionLogger.drinkNameLabel' : 'journal:nutritionLogger.mealNameLabel')}
          timeLabel={t(editingEntry?.kind === 'drink' ? 'journal:nutritionLogger.drinkTime' : 'journal:nutritionLogger.mealTime')}
          name={editingEntry?.name ?? ''}
          recordedAt={editingEntry?.recordedAt ?? new Date()}
          onNameChange={name => setEditingEntry(current => (current ? { ...current, name } : current))}
          onRecordedAtChange={recordedAt => setEditingEntry(current => (current ? { ...current, recordedAt } : current))}
          onClose={() => setEditingEntry(null)}
          onSave={handleSaveEntryEdit}
        />
        <CopyMealBottomSheet
          copyMealBottomSheetRef={copyMealBottomSheetRef}
          copyMealSheetSnapPoints={copyMealSheetSnapPoints}
          colors={colors}
          styles={styles}
          t={t}
          recentMeals={recentMeals}
          handleCopyMeal={handleCopyMeal}
          roundToOneDecimal={roundToOneDecimal}
        />
        <NutritionAnalysisBottomSheet ref={nutritionAnalysisBottomSheetRef} image={packagingMealImage} ingredients={analyzingFoods} isAnalyzing={isAnalyzing} />
        <PremiumBottomSheet ref={premiumBottomSheetRef} />
        <MealLoggerBottomSheet
          ref={mealLoggerBottomSheetRef}
          onDiscoverPremium={() => premiumBottomSheetRef.current?.present()}
          onAnalyzePhoto={handleAnalyzePhoto}
          onScanBarcode={() => {
            requestAnimationFrame(() => {
              if (hideBarcodeInfo) {
                barcodeScannerBottomSheetRef.current?.present();
              } else {
                barcodeInfoBottomSheetRef.current?.present();
              }
            });
          }}
          onPreviousMeal={() => {
            requestAnimationFrame(() => {
              copyMealBottomSheetRef.current?.present();
            });
          }}
          onShowBarcodeInfo={() => {
            barcodeInfoBottomSheetRef.current?.present();
          }}
          onChooseFood={() => {
            requestAnimationFrame(() => {
              foodPickerBottomSheetRef.current?.present();
            });
          }}
          onAddDrink={() => {
            requestAnimationFrame(() => {
              drinkPickerBottomSheetRef.current?.present();
            });
          }}
        />
        <FoodPickerBottomSheet ref={foodPickerBottomSheetRef} onSelect={handleChooseFood} />
        <DrinkPickerBottomSheet ref={drinkPickerBottomSheetRef} onSelect={handleAddManualDrink} />
        <ProductAmountBottomSheet
          onAnalyzePremium={handleAnalyzeBarcodeProduct}
          onDiscoverPremium={() => premiumBottomSheetRef.current?.present()}
          ref={productAmountBottomSheetRef}
          onSave={(barcodeProduct, amount, productType, time) => {
            productAmountBottomSheetRef.current?.dismiss();
            copySourceMealIdRef.current = barcodeProduct.sourceMealId ?? null;
            handleSaveBarcodeProduct(barcodeProduct, amount, productType, time);
            if (productType === 'drink' && hasAlcohol({ type: barcodeProduct.drinkType, alcoholPercent: barcodeProduct.alcoholPercent }))
              setAlcoholInfoRequest(current => current + 1);
            if (productType === 'drink' && hasCaffeine({ type: barcodeProduct.drinkType, caffeinated: barcodeProduct.caffeinated })) {
              setCaffeineInfoRequest(current => current + 1);
            }
          }}
        />
        <CaffeineLoggingInfoModal requestKey={caffeineInfoRequest} />
        <DrinkLoggingInfoModal requestKey={alcoholInfoRequest} kind="alcohol" />
        <BarcodeInfoBottomSheet
          ref={barcodeInfoBottomSheetRef}
          onContinue={() => {
            setTimeout(() => {
              barcodeScannerBottomSheetRef.current?.present();
            }, 250);
          }}
          onUsePhotoAnalysis={handleAnalyzePhoto}
          onDontShowAgainChange={setHideBarcodeInfo}
        />
        <BarcodeScannerBottomSheet
          ref={barcodeScannerBottomSheetRef}
          onProductFound={product => {
            barcodeScannerBottomSheetRef.current?.dismiss();

            requestAnimationFrame(() => {
              productAmountBottomSheetRef.current?.present(product);
            });
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imagePickerButton: {
    alignSelf: 'center',
    width: '87%',
    marginBottom: 16,
  },
  futureDateHint: {
    textAlign: 'center',
    marginTop: -6,
    marginBottom: 12,
  },
  copyMealModalContent: {
    width: '100%',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  copyMealSheetTitle: {
    paddingTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  copyMealModalScroll: {
    width: '100%',
  },
  copyMealOption: {
    width: '100%',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 1,
  },
  copyMealStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  copyMealOptionName: {
    flex: 1,
    marginRight: 8,
  },
  copyMealStatsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  copyMealStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyMealStatText: {
    fontSize: 13,
  },
  copyMealEmptyText: {
    textAlign: 'center',
  },
  editMealModalContent: {
    width: '100%',
  },
  summaryQuickRow: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryQuickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

export default NutritionLoggerTab;
