import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import type { MealEntry, NutritionEntry, NutritionTrackingContribution } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { useNutritionAnalysis } from '@/hooks/nutrition/useNutritionAnalysis';
import { useNutritionBarcodeActions } from '@/hooks/nutrition/useNutritionBarcodeActions';
import { useNutritionLoggerData } from '@/hooks/nutrition/useNutritionLoggerData';
import { useNutritionTipCompletion } from '@/hooks/nutrition/useNutritionTipCompletion';
import { tips } from '@/locales/tips';
import { roundToOneDecimal, type WeeklyTrackingSignals } from '@/utils/analyzeNutrition';
import { toDateKey, toRecordedAt } from '@/utils/dateUtils';

import { Collapsible } from '../Collapsible';
import CopyMealBottomSheet from '../CopyMealBottomSheet';
import NutritionBreakdown from '../NutritionBreakdown';
import { ThemedText } from '../ThemedText';
import AppButton from '../ui/AppButton';
import { Card } from '../ui/Card';
import { IconSymbol } from '../ui/IconSymbol';
import AnalysisStatus from './AnalysisStatus';
import BarcodeProductBottomSheet from './BarcodeProductBottomSheet';
import BarcodeScannerBottomSheet from './BarcodeScannerBottomSheet';
import EntryEditModal from './EntryEditModal';
import { LoggedDrinksSection } from './LoggedDrinksSection';
import { LoggedMealsSection } from './LoggedMealsSection';
import MealLoggerBottomSheet from './MealLoggerBottomSheet';
import NutritionAnalysisBottomSheet from './NutritionAnalysisBottomSheet';
import NutritionAnalysisReviewModal from './NutritionAnalysisReviewModal';
import NutritionPlanTargetsSection from './NutritionPlanTargetsSection';
import PackagingAnalysisModal from './PackagingAnalysisModal';

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
  } = useStorage();
  const { weekStartISO: weekStartKey } = getWeekBoundsFromDateKey(selectedDate);
  const { summary, drinks, recentMeals, dailyNutrition } = useNutritionLoggerData(selectedDate);
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
  const mealLoggerBottomSheetRef = useRef<BottomSheetModal>(null);
  const barcodeProductBottomSheetRef = useRef<BottomSheetModal>(null);
  const barcodeScannerBottomSheetRef = useRef<BottomSheetModal>(null);
  const handleSelectNutritionEntry = useCallback((entry: NutritionEntry) => {
    setSelectedNutritionEntryId(entry.id);
    setSelectedNutritionName(entry.name);
    setSelectedNutrition(entry);
  }, []);
  const handleSaveBarcodeProduct = useNutritionBarcodeActions({ selectedDate, onNutritionEntrySelected: handleSelectNutritionEntry });
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

  const activeTrackingTargetsForAI = useMemo(() => {
    const byKey = new Map<
      string,
      {
        key: string;
        unit: 'items' | 'count';
        amount?: number;
        aiInstruction?: string;
      }
    >();
    (plans?.nutrition ?? []).forEach(planTip => {
      const tip = tips.find(candidate => candidate.id === planTip.tipId);
      (tip?.trackingTargets ?? []).forEach((target: { trackingKey: string; unit: 'items' | 'count'; amount?: number; aiInstruction?: string }) => {
        const key = target.trackingKey?.trim();
        if (!key) return;
        if (!byKey.has(key)) {
          byKey.set(key, {
            key,
            unit: target.unit,
            amount: target.amount,
            aiInstruction: target.aiInstruction,
          });
        }
      });
    });
    return Array.from(byKey.values());
  }, [plans]);

  const activeTrackingKeys = useMemo(() => {
    const keys = new Set<string>();
    (plans?.nutrition ?? []).forEach(planTip => {
      const tip = tips.find(candidate => candidate.id === planTip.tipId);
      (tip?.trackingTargets ?? []).forEach((target: { trackingKey: string }) => {
        if (typeof target.trackingKey === 'string' && target.trackingKey.trim().length > 0) {
          keys.add(target.trackingKey.trim());
        }
      });
    });
    return keys;
  }, [plans]);

  const trackingPromptForAI = useMemo(() => {
    if (!activeTrackingTargetsForAI.length) {
      return 'nutrition_analysis';
    }
    const targetsJson = JSON.stringify(activeTrackingTargetsForAI);
    return [
      'nutrition_analysis',
      'tracking_targets_for_this_user:',
      targetsJson,
      'Only return weeklyTrackingSignals keys that exist in tracking_targets_for_this_user.',
      'For unit=items return items[]. For unit=count return countIncrement.',
    ].join('\n');
  }, [activeTrackingTargetsForAI]);

  const {
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

    const newEntry = addNutritionEntry(selectedDate, {
      type: 'meal',
      recordedAt,
      name: name?.trim() || t('journal:nutritionLogger.unnamedMeal'),
      ...nutrition,
    });

    const nutritionEntryId = newEntry.id;

    addWeeklyTrackingContribution(nutritionEntryId, selectedDate, pendingAnalysisReview.weeklyTrackingSignals);

    confirmedDrinks.forEach(drink => {
      addDrinkEntry(selectedDate, {
        nutritionEntryId,
        ...drink,
        recordedAt,
        source: 'meal_analysis',
      });
    });

    setSelectedNutritionEntryId(nutritionEntryId);
    setSelectedNutritionName(newEntry.name);
    setSelectedNutrition(newEntry);

    setAnalysisResult('✅ Måltid loggad och analyserad!');
    triggerLightHaptic();
    closeAnalysisReviewModal();
  };

  const handleCopyMeal = (sourceEntry: MealEntry) => {
    const recordedAt = toRecordedAt(selectedDate, new Date(sourceEntry.recordedAt));

    const copiedEntry = addNutritionEntry(selectedDate, {
      ...sourceEntry,
      recordedAt,
    });

    const sourceContribution = findWeeklyTrackingContribution(sourceEntry.id, toDateKey(new Date(sourceEntry.recordedAt)));

    if (sourceContribution) {
      addWeeklyTrackingContribution(copiedEntry.id, selectedDate, sourceContribution.signals);
    }

    setSelectedNutritionEntryId(copiedEntry.id);
    setSelectedNutritionName(copiedEntry.name);
    setSelectedNutrition(copiedEntry);

    triggerLightHaptic();
    handleCloseCopyMealModal();
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
        {selectedNutritionName && (
          <Card
            style={{
              borderRadius: globalStyles.borders.borderRadius,
            }}
          >
            <ThemedText type="title3">
              {t('journal:nutritionLogger.mealTitleWithName', {
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
        {summary && summary.entries.length > 0 && (
          <LoggedMealsSection meals={summary.entries} onEdit={handleStartEditMeal} onDelete={handleRemoveMeal} onSelect={handleSelectNutritionEntry} />
        )}
        {drinks.length > 0 && (
          <LoggedDrinksSection drinks={drinks} onEdit={handleStartEditDrink} onDelete={handleRemoveDrink} onSelect={handleSelectLoggedDrink} />
        )}
        <NutritionPlanTargetsSection
          fulfilledTipsSectionYRef={fulfilledTipsSectionYRef}
          periodSectionYRef={periodSectionYRef}
          nutritionPlanTipProgressByPeriod={nutritionPlanTipProgressByPeriod}
          getCompletionAnimValue={getCompletionAnimValue}
          tipRowLocalYByKeyRef={tipRowLocalYByKeyRef}
          tipRowPeriodByKeyRef={tipRowPeriodByKeyRef}
        />
        <PackagingAnalysisModal
          visible={isPackagingModalVisible}
          initialMealImage={packagingMealImage}
          onClose={handleClosePackagingModal}
          onAnalyze={handleAnalyzePackaging}
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
        <NutritionAnalysisBottomSheet ref={nutritionAnalysisBottomSheetRef} image={packagingMealImage} />
        <MealLoggerBottomSheet
          ref={mealLoggerBottomSheetRef}
          onAnalyzePhoto={handleAnalyzePhoto}
          onScanBarcode={() => {
            setTimeout(() => {
              barcodeScannerBottomSheetRef.current?.present();
            }, 250);
          }}
          onPreviousMeal={() => {
            requestAnimationFrame(() => {
              copyMealBottomSheetRef.current?.present();
            });
          }}
        />
        <BarcodeProductBottomSheet
          ref={barcodeProductBottomSheetRef}
          onSave={(barcodeProduct, amount, productType) => {
            barcodeProductBottomSheetRef.current?.dismiss();
            handleSaveBarcodeProduct(barcodeProduct, amount, productType);
          }}
        />
        <BarcodeScannerBottomSheet
          ref={barcodeScannerBottomSheetRef}
          onProductFound={product => {
            barcodeScannerBottomSheetRef.current?.dismiss();

            requestAnimationFrame(() => {
              barcodeProductBottomSheetRef.current?.present(product);
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
