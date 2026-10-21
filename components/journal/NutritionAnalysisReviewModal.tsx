import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getDrinkImage, getDrinkNutritionData } from '@/locales/drinkCatalog';
import { isAlcohol } from '@/services/gptServices';
import type { PendingAnalysisReview } from '@/types/nutrition/nutritionAnalysis';

import { Collapsible } from '../Collapsible';
import NutritionBreakdown from '../NutritionBreakdown';
import { ThemedModal } from '../ThemedModal';
import { ThemedText } from '../ThemedText';
import AddButton from '../ui/AddButton';
import { Card } from '../ui/Card';
import { DateTimeInput } from '../ui/DateTimeInput';
import { IconSymbol } from '../ui/IconSymbol';
import { IngredientList } from './IngredientList';

interface NutritionAnalysisReviewModalProps {
  visible: boolean;
  pendingReview: PendingAnalysisReview | null;
  analysisResult: string | null;
  mealTime: Date;
  onMealTimeChange: (value: Date) => void;
  isAnalyzing: boolean;
  canReAnalyze: boolean;
  onReAnalyze: () => void;
  onToggleDrink: (index: number) => void;
  onClose: () => void;
  onSave: () => void;
}

const NutritionAnalysisReviewModal: React.FC<NutritionAnalysisReviewModalProps> = ({
  visible,
  pendingReview,
  analysisResult,
  mealTime,
  onMealTimeChange,
  isAnalyzing,
  canReAnalyze,
  onReAnalyze,
  onToggleDrink,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [expandedDrinks, setExpandedDrinks] = useState<Record<number, boolean>>({});

  return (
    <ThemedModal
      visible={visible}
      title={t('journal:nutritionLogger.analysisReviewTitle')}
      onClose={onClose}
      onSave={onSave}
      onSaveDisabled={!pendingReview?.analysis}
      okLabel={t('general.save')}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator>
        <View style={styles.mealTimeRow}>
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.mealTime')}
          </ThemedText>
          <DateTimeInput value={mealTime} showTime showDate={false} onChange={onMealTimeChange} />
        </View>
        {pendingReview?.statusMessage || analysisResult ? (
          <ThemedText type="defaultSemiBold" style={styles.status}>
            {pendingReview?.statusMessage ?? analysisResult}
          </ThemedText>
        ) : null}
        {pendingReview?.barcodeContext ? (
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.barcodeProduct.premiumAnalysisHint')}
          </ThemedText>
        ) : null}
        {pendingReview?.analyzedFoods?.length ? (
          <View style={styles.section}>
            <ThemedText type="title3">{t('journal:nutritionLogger.reviewIngredientsTitle')}</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t('journal:nutritionLogger.reviewIngredientsDescription')}
            </ThemedText>
            <IngredientList ingredients={pendingReview.analyzedFoods} />
          </View>
        ) : null}
        {canReAnalyze ? (
          <Pressable accessibilityRole="button" onPress={onReAnalyze} disabled={isAnalyzing}>
            <ThemedText style={{ color: colors.showAllAccent, opacity: isAnalyzing ? 0.5 : 1 }}>
              {t(pendingReview?.barcodeContext ? 'journal:nutritionLogger.barcodeProduct.reanalyzePremium' : 'journal:nutritionLogger.editIngredients')}
            </ThemedText>
          </Pressable>
        ) : null}
        {pendingReview?.analysis ? (
          <View style={styles.section}>
            <ThemedText type="title3">{t('journal:nutritionLogger.detectedfFoodTitle', { st: '1' })}</ThemedText>
            <Card style={[styles.detectedDrinkCard]}>
              <Collapsible
                title={pendingReview.analysis.name?.trim() || t('journal:nutritionLogger.unnamedMeal')}
                titleType="defaultSemiBold"
                chevronPosition="right"
                initialCollapsed
                leftContent={<IconSymbol name="meal" size={28} color={colors.textMuted} />}
                rightContent={
                  <ThemedText type="caption" style={{ color: colors.textMuted }}>{`${Math.round(pendingReview.analysis.calories)} kcal`}</ThemedText>
                }
              >
                <NutritionBreakdown nutrition={pendingReview.analysis} keyPrefix="review" />
              </Collapsible>
            </Card>
          </View>
        ) : null}
        {pendingReview?.detectedDrinks?.length ? (
          <View style={styles.section}>
            <ThemedText type="title3">{t('journal:nutritionLogger.detectedDrinksTitle', { st: `${pendingReview?.detectedDrinks?.length}` })}</ThemedText>
            {pendingReview.detectedDrinks.map((drink, index) => {
              const drinkImage = getDrinkImage(drink.type);

              console.log('[Drink image]', {
                type: drink.type,
                name: drink.name,
                image: drinkImage,
              });

              return (
                <Card key={`${drink.type}-${drink.name}-${index}`} style={styles.detectedDrinkCard}>
                  <View style={styles.detectedDrinkHeader}>
                    <Image source={drinkImage} style={styles.detectedDrinkImage} resizeMode="contain" />
                    <View style={styles.detectedDrinkInfo}>
                      <ThemedText type="defaultSemiBold">{drink.name}</ThemedText>
                      <ThemedText type="caption" style={{ color: colors.textMuted }}>
                        {[
                          drink.amountMl ? `${Math.round(drink.amountMl)} ml` : null,
                          drink.sugarFree === true ? t('journal:nutritionLogger.sugarFree') : null,
                          drink.caffeinated === true ? t('journal:nutritionLogger.caffeine') : null,
                          isAlcohol(drink.type) ? t('journal:nutritionLogger.alcohol') : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </ThemedText>
                    </View>
                    <AddButton
                      allowToggle
                      added={drink.confirmed}
                      onClick={() => onToggleDrink(index)}
                      accessibilityLabel={drink.confirmed ? 'common.confirmed' : 'common.confirm'}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: !!expandedDrinks[index] }}
                      hitSlop={8}
                      onPress={() => setExpandedDrinks(current => ({ ...current, [index]: !current[index] }))}
                    >
                      <IconSymbol name="chevron.right" size={18} color={colors.icon} style={expandedDrinks[index] ? styles.chevronOpen : undefined} />
                    </Pressable>
                  </View>
                  {expandedDrinks[index] ? (
                    <View style={styles.drinkNutrition}>
                      <NutritionBreakdown nutrition={getDrinkNutritionData(drink.type, drink.name, drink.amountMl)} keyPrefix={`drink-${index}`} />
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </ThemedModal>
  );
};

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 420,
    width: '100%',
  },
  content: {
    gap: 12,
    paddingBottom: 8,
  },
  mealTimeRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 0,
    marginBottom: 4,
  },
  status: {
    marginBottom: 4,
  },
  section: {
    gap: 6,
  },
  detectedDrinkCard: {
    padding: 12,
  },
  detectedDrinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  drinkNutrition: {
    marginTop: 12,
  },
  detectedDrinkImage: {
    width: 64,
    height: 64,
  },
  detectedDrinkInfo: {
    flex: 1,
    gap: 2,
  },
});

export default NutritionAnalysisReviewModal;
