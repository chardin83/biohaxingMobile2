import { useTheme } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { globalStyles } from '@/app/theme/globalStyles';
import { getDrinkImage } from '@/locales/drinkCatalog';
import { isAlcohol } from '@/services/gptServices';
import type { PendingAnalysisReview } from '@/types/nutrition/nutritionAnalysis';

import NutritionBreakdown from '../NutritionBreakdown';
import { ThemedModal } from '../ThemedModal';
import { ThemedText } from '../ThemedText';
import AddButton from '../ui/AddButton';
import { Card } from '../ui/Card';
import { DateTimeInput } from '../ui/DateTimeInput';

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

const BULLET_REGEX = /^([•*-]\s+|\d+[.)]\s+)/;

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

  const interpretationItems = useMemo(() => {
    if (!pendingReview) return null;
    const aiText = pendingReview.aiDescription?.trim();
    if (aiText) {
      const lines = aiText
        .split(/\r?\n+/g)
        .map(line => line.replace(BULLET_REGEX, '').trim())
        .filter(line => line.length > 0);
      if (lines.length > 0) return lines;
    }
    const inferred = pendingReview.evidence?.inferred ?? [];
    if (inferred.length > 0) {
      const items = inferred
        .flatMap(item => item.split(/\r?\n+/g))
        .map(item => item.replace(BULLET_REGEX, '').trim())
        .filter(item => item.length > 0);
      if (items.length > 0) return Array.from(new Set(items));
    }
    return [t('journal:nutritionLogger.analysisNoStructuredData')];
  }, [pendingReview, t]);

  const reAnalyzeTextStyle = [styles.reAnalyzeText, isAnalyzing && styles.reAnalyzeTextDisabled, { color: colors.text }];
  const reAnalyzePrefixStyle = [styles.reAnalyzePrefix, { color: colors.text }];
  const reAnalyzeHighlightStyle = [styles.reAnalyzeHighlight, { color: colors.showAllAccent }];

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
        {interpretationItems?.length ? (
          <View style={styles.section}>
            <ThemedText type="label">AI Interpretation</ThemedText>
            {interpretationItems.map((item, index) => (
              <ThemedText key={`interp-${item.slice(0, 32)}`} type="default" style={styles.body}>
                {`${index + 1}. ${item}`}
              </ThemedText>
            ))}
            {(() => {
              let confidenceColor = colors.textMuted;
              if (pendingReview?.evidence?.confidence === 'high') {
                confidenceColor = colors.surfaceGreenBorder;
              } else if (pendingReview?.evidence?.confidence === 'medium') {
                confidenceColor = colors.successColor;
              } else if (pendingReview?.evidence?.confidence === 'low') {
                confidenceColor = colors.warmColor;
              }
              const confidenceKey = 'general.confidence.' + (pendingReview?.evidence?.confidence ?? 'unknown');
              const confidenceText = t('general.confidence.label') + ': ' + t(confidenceKey);
              return (
                <ThemedText type="caption" style={[styles.evidence, styles.interpretationMeta, { color: confidenceColor }]}>
                  {confidenceText}
                </ThemedText>
              );
            })()}
          </View>
        ) : null}
        {canReAnalyze ? (
          <Pressable onPress={onReAnalyze} disabled={isAnalyzing}>
            <ThemedText type="default" style={reAnalyzeTextStyle}>
              {`${t('general.reAnalyzePrompt.prefix')} `}
              <ThemedText type="defaultSemiBold" style={reAnalyzeHighlightStyle}>
                {t('general.reAnalyzePrompt.correct')}
              </ThemedText>
              {`${t('general.reAnalyzePrompt.question')} `}
              <ThemedText type="defaultSemiBold" style={reAnalyzePrefixStyle}>
                {t('general.reAnalyzePrompt.rePrefix')}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={reAnalyzeHighlightStyle}>
                {t('general.reAnalyzePrompt.analyze')}
              </ThemedText>
              {t('general.reAnalyzePrompt.suffix') ? ` ${t('general.reAnalyzePrompt.suffix')}` : ''}
            </ThemedText>
          </Pressable>
        ) : null}
        {pendingReview?.detectedDrinks?.length ? (
          <View style={styles.section}>
            <ThemedText type="title3">{t('journal:nutritionLogger.detectedDrinksTitle')}</ThemedText>
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
                  </View>
                </Card>
              );
            })}
          </View>
        ) : null}
        {pendingReview?.analysis ? (
          <View style={styles.section}>
            <ThemedText type="label">{t('journal:nutritionLogger.analysisReviewNutritionPreviewTitle')}</ThemedText>
            <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
              <ThemedText type="title3">
                {t('journal:nutritionLogger.nutritionTitleWithName', {
                  name: pendingReview.analysis.name,
                })}
              </ThemedText>
              <NutritionBreakdown nutrition={pendingReview.analysis} keyPrefix="review" />
            </Card>
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
  body: {
    lineHeight: 20,
  },
  evidence: {
    lineHeight: 18,
  },
  interpretationMeta: {
    marginTop: 2,
    opacity: 0.9,
  },
  reAnalyzeText: {
    marginTop: 8,
  },
  reAnalyzeTextDisabled: {
    opacity: 0.5,
  },
  reAnalyzePrefix: {},
  reAnalyzeHighlight: {},
  detectedDrinkCard: {
    padding: 12,
  },
  detectedDrinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
