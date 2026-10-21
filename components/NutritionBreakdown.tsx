import { useTheme } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import type { NutritionData } from '@/app/context/storage/nutrition/nutritionTypes';
import { ESSENTIAL_AMINO_ACID_KEYS, OTHER_AMINO_ACID_KEYS } from '@/constants/aminoAcids';
import { FIBER_CATEGORY_SUBTYPES, FIBER_TYPE_KEYS, type FiberSubtype } from '@/constants/fiber';
import { MINERAL_TYPE_KEYS } from '@/constants/minerals';
import { POLYPHENOL_TYPE_KEYS } from '@/constants/polyphenols';
import { PREMIUM } from '@/constants/Premium';
import { VITAMIN_TYPE_KEYS } from '@/constants/vitamins';
import { useFreePhotoAnalysesRemaining } from '@/hooks/nutrition/useFreePhotoAnalysesRemaining';

import { Collapsible } from './Collapsible';
import AlcoholInfoBottomSheet from './journal/AlcoholInfoBottomSheet';
import { ThemedModal } from './ThemedModal';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';
import PremiumLink from './ui/PremiumLink';
import PremiumOffer from './ui/PremiumOffer';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

type NutritionContentProps = {
  nutrition: NutritionData;
  keyPrefix: string;
};

type NutritionBreakdownProps = NutritionContentProps & {
  existingDataOnly?: boolean;
};

const hasAnyTypedTotals = (values?: Partial<Record<string, number>>): boolean => Object.values(values ?? {}).some(value => (value ?? 0) > 0);

const getEssentialAminoTotalMg = (values: NonNullable<NutritionData['aminoAcidsByType']>): number =>
  ESSENTIAL_AMINO_ACID_KEYS.reduce((sum, key) => sum + (values[key] ?? 0), 0);

const getMineralsTotal = (mineralsByType: NonNullable<NutritionData['mineralsByType']>): number => {
  const explicit = mineralsByType.minerals_total ?? 0;

  if (explicit > 0) return explicit;

  return MINERAL_TYPE_KEYS.filter(key => key !== 'minerals_total').reduce((sum, key) => sum + (mineralsByType[key] ?? 0), 0);
};

const getVitaminsTotal = (vitaminsByType: NonNullable<NutritionData['vitaminsByType']>): number => {
  const explicit = vitaminsByType.vitamins_total ?? 0;

  if (explicit > 0) return explicit;

  return VITAMIN_TYPE_KEYS.filter(key => key !== 'vitamins_total').reduce((sum, key) => sum + (vitaminsByType[key] ?? 0), 0);
};

const getConfidenceLabelKey = (confidence: ConfidenceLevel): string => {
  if (confidence === 'high') return 'journal:nutritionLogger.confidenceHigh';
  if (confidence === 'medium') return 'journal:nutritionLogger.confidenceMedium';
  if (confidence === 'low') return 'journal:nutritionLogger.confidenceLow';

  return 'journal:nutritionLogger.confidenceUnknown';
};

const formatMilligramValue = (value: number): string => {
  if (value < 0.01) return value.toFixed(4);
  if (value < 1) return value.toFixed(3);
  if (value < 10) return value.toFixed(2);

  return value.toFixed(0);
};

const splitLabelValue = (text: string): { label: string; value?: string } => {
  const index = text.indexOf(': ');

  return index < 0 ? { label: text } : { label: text.slice(0, index), value: text.slice(index + 2) };
};

const NutrientValue = ({ children, aiEstimated = false }: React.PropsWithChildren<{ aiEstimated?: boolean }>) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.nutrientValue}>
      {children}
      {aiEstimated && (
        <View accessible accessibilityLabel={t('journal:nutritionLogger.aiEstimatedValue')}>
          <IconSymbol name="sparkles" size={15} color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const NutrientText: React.FC<{ text: string; aiEstimated?: boolean }> = ({ text, aiEstimated }) => {
  const { label, value } = splitLabelValue(text);

  return (
    <>
      <ThemedText type="default" style={styles.nutrientLabel}>
        {label}
      </ThemedText>
      {value ? (
        <NutrientValue aiEstimated={aiEstimated}>
          <ThemedText type="default">{value}</ThemedText>
        </NutrientValue>
      ) : null}
    </>
  );
};

const collapsibleHeader = (text: string, aiEstimated = false) => {
  const { label, value } = splitLabelValue(text);

  return {
    title: label,
    rightContent: value ? (
      <NutrientValue aiEstimated={aiEstimated}>
        <ThemedText type="default">{value}</ThemedText>
      </NutrientValue>
    ) : undefined,
  };
};

// Swedish standard drink: 12 grams of pure alcohol.
const ALCOHOL_GRAMS_PER_STANDARD_DRINK = 12;

type NutrientDetailsProps = NutritionContentProps & {
  hasAnalysisAccess: boolean;
  showAnalysisInfo: boolean;
};

type PremiumNutrientDetailsProps = NutrientDetailsProps & {
  showPremiumLink: boolean;
  analysisPanelColor: ViewStyle;
  onPremium: () => void;
};

type AlcoholSectionProps = {
  nutrition: NutritionData;
  onAlcoholInfo: () => void;
};

const ProteinSection = ({
  nutrition,
  keyPrefix,
  hasAnalysisAccess,
  showAnalysisInfo,
  showPremiumLink,
  analysisPanelColor,
  onPremium,
}: PremiumNutrientDetailsProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { protein, aminoAcidsByType } = nutrition;
  const hasAminoAcids = hasAnyTypedTotals(aminoAcidsByType);

  return (
    <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
      <Collapsible
        {...collapsibleHeader(t('journal:nutritionLogger.protein', { value: protein }), nutrition.aiEstimatedNutrients?.includes('protein'))}
        titleType="default"
        initialCollapsed
        leftContent={<IconSymbol name="protein" size={14} color={colors.textMuted} />}
      >
        <View style={[styles.biohaxingPanel, analysisPanelColor]} testID="nutrition-amino-acids">
          {showAnalysisInfo && !PREMIUM && (
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t('journal:nutritionLogger.aminoAcidsBiohaxingInfo')}
            </ThemedText>
          )}
          {hasAminoAcids && (
            <>
              <ThemedText type="caption" style={[styles.aminoGroupHeader, { color: colors.textMuted }]}>
                {t('journal:nutritionLogger.essentialAminoAcidsTitle')}
              </ThemedText>

              <ThemedText type="default" style={{ color: colors.textMuted }}>
                • {t('journal:nutritionLogger.essentialAminoAcidsTotal')}: {(getEssentialAminoTotalMg(aminoAcidsByType!) / 1000).toFixed(1)} g
              </ThemedText>

              {ESSENTIAL_AMINO_ACID_KEYS.map(key => {
                const value = aminoAcidsByType?.[key] ?? 0;

                if (value <= 0) return null;

                return (
                  <ThemedText key={`${keyPrefix}_${key}`} type="default">
                    • {t(`journal:nutritionLogger.aminoAcidLabels.${key}`)}: {(value / 1000).toFixed(1)} g
                  </ThemedText>
                );
              })}

              {OTHER_AMINO_ACID_KEYS.some(key => (aminoAcidsByType?.[key] ?? 0) > 0) && (
                <>
                  <ThemedText type="caption" style={[styles.aminoGroupHeader, styles.aminoGroupHeaderSecond, { color: colors.textMuted }]}>
                    {t('journal:nutritionLogger.otherAminoAcidsTitle')}
                  </ThemedText>

                  {OTHER_AMINO_ACID_KEYS.map(key => {
                    const value = aminoAcidsByType?.[key] ?? 0;

                    if (value <= 0) return null;

                    return (
                      <ThemedText key={`${keyPrefix}_${key}`} type="default">
                        • {t(`journal:nutritionLogger.aminoAcidLabels.${key}`)}: {(value / 1000).toFixed(1)} g
                      </ThemedText>
                    );
                  })}
                </>
              )}
            </>
          )}
          {!hasAminoAcids && hasAnalysisAccess && showAnalysisInfo && (
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t('journal:nutritionLogger.extraNutritionMissing')}
            </ThemedText>
          )}
          {showPremiumLink && <PremiumLink onPress={onPremium} />}
        </View>
      </Collapsible>
    </View>
  );
};

const FiberSection = ({
  nutrition,
  keyPrefix,
  hasAnalysisAccess,
  showAnalysisInfo,
  showPremiumLink,
  analysisPanelColor,
  onPremium,
}: PremiumNutrientDetailsProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { fiber, fiberByType, fiberSubtypeTotals } = nutrition;
  const isTrialAnalysis = nutrition.analysisTier === 'trial';
  const hasFiberDetails =
    FIBER_TYPE_KEYS.some(key => key !== 'fiber_total' && fiberByType?.[key] !== undefined) ||
    Object.values(fiberSubtypeTotals ?? {}).some(value => value !== undefined);
  const hasAnalyzedFiberTypes = FIBER_TYPE_KEYS.some(key => key !== 'fiber_total' && (fiberByType?.[key] ?? 0) > 0) || hasAnyTypedTotals(fiberSubtypeTotals);
  const getFiberSubtypeAmountsForCategory = (category: (typeof FIBER_TYPE_KEYS)[number]): Array<{ subtype: FiberSubtype; label: string; amount: number }> => {
    if (category === 'fiber_total') return [];

    const subtypes = FIBER_CATEGORY_SUBTYPES[category] ?? [];

    return subtypes
      .map(subtype => ({
        subtype,
        label: t(`journal:nutritionLogger.fiberSubtypeLabels.${subtype}`),
        amount: fiberSubtypeTotals?.[subtype] ?? 0,
      }))
      .filter(item => item.amount > 0);
  };

  let premiumMessageKey = 'journal:nutritionLogger.fiberTypesPremium';
  if (isTrialAnalysis) {
    premiumMessageKey = 'journal:nutritionLogger.fiberTrialResult';
  } else if (hasAnalyzedFiberTypes) {
    premiumMessageKey = 'journal:nutritionLogger.fiberPremiumExpired';
  }

  return (
    <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
      <Collapsible
        {...collapsibleHeader(t('journal:nutritionLogger.fiber', { value: fiber }), nutrition.aiEstimatedNutrients?.includes('fiber'))}
        titleType="default"
        contentStyle={[styles.premiumDropdown, analysisPanelColor]}
        initialCollapsed
        leftContent={<IconSymbol name="fiber" size={14} color={colors.textMuted} />}
      >
        {!hasAnalysisAccess ? (
          <View style={styles.fiberPremium}>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t(premiumMessageKey)}
            </ThemedText>
          </View>
        ) : null}
        {showAnalysisInfo && hasAnalysisAccess && !hasFiberDetails && (
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.extraNutritionMissing')}
          </ThemedText>
        )}
        {hasAnalyzedFiberTypes &&
          FIBER_TYPE_KEYS.map(key => {
            const value = fiberByType?.[key] ?? 0;

            const subtypeRows = getFiberSubtypeAmountsForCategory(key);
            if (value <= 0 && subtypeRows.length === 0) return null;

            return (
              <View key={`${keyPrefix}_${key}`} style={styles.fiberCategoryRow}>
                <ThemedText type="default">
                  • {t(`journal:nutritionLogger.fiberLabels.${key}`)}
                  {value > 0 ? `: ${value.toFixed(1)} g` : ''}
                </ThemedText>

                {subtypeRows.map(row => (
                  <ThemedText key={`${keyPrefix}_${key}_${row.subtype}`} type="caption" style={styles.fiberSubtypeText}>
                    - {row.label}: {row.amount.toFixed(1)} g
                  </ThemedText>
                ))}
              </View>
            );
          })}
        {showPremiumLink && <PremiumLink onPress={onPremium} />}
      </Collapsible>
    </View>
  );
};

const MineralsSection = ({ nutrition, keyPrefix, hasAnalysisAccess, showAnalysisInfo }: NutrientDetailsProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { mineralsByType, mineralsConfidenceByType } = nutrition;

  return (
    <View style={[styles.nutrientRow, { borderBottomColor: hasAnalysisAccess ? colors.infoDefault : colors.goldSoft }]} testID="nutrition-minerals">
      <Collapsible
        {...collapsibleHeader(
          t('journal:nutritionLogger.minerals', {
            value: hasAnyTypedTotals(mineralsByType) ? getMineralsTotal(mineralsByType!).toFixed(1) : '—',
          })
        )}
        titleType="default"
        initialCollapsed
      >
        {showAnalysisInfo && !PREMIUM && (
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.mineralsBiohaxingInfo')}
          </ThemedText>
        )}
        {showAnalysisInfo && hasAnalysisAccess && !hasAnyTypedTotals(mineralsByType) ? (
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.extraNutritionMissing')}
          </ThemedText>
        ) : null}
        {MINERAL_TYPE_KEYS.filter(key => key !== 'minerals_total').map(key => {
          const value = mineralsByType?.[key] ?? 0;

          if (value <= 0) return null;

          return (
            <ThemedText key={`${keyPrefix}_${key}`} type="default">
              • {t(`journal:nutritionLogger.mineralLabels.${key}`)}: {value.toFixed(1)} mg
              {' • '}
              {t(getConfidenceLabelKey(mineralsConfidenceByType?.[key] ?? 'unknown'))}
            </ThemedText>
          );
        })}
      </Collapsible>
    </View>
  );
};

const VitaminsSection = ({ nutrition, keyPrefix, hasAnalysisAccess, showAnalysisInfo }: NutrientDetailsProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { vitaminsByType } = nutrition;

  return (
    <View style={[styles.nutrientRow, { borderBottomColor: hasAnalysisAccess ? colors.infoDefault : colors.goldSoft }]} testID="nutrition-vitamins">
      <Collapsible
        {...collapsibleHeader(
          t('journal:nutritionLogger.vitamins', {
            value: hasAnyTypedTotals(vitaminsByType) ? getVitaminsTotal(vitaminsByType!).toFixed(1) : '—',
          })
        )}
        titleType="default"
        initialCollapsed
      >
        {showAnalysisInfo && !PREMIUM && (
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.vitaminsBiohaxingInfo')}
          </ThemedText>
        )}
        {showAnalysisInfo && hasAnalysisAccess && !hasAnyTypedTotals(vitaminsByType) ? (
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.extraNutritionMissing')}
          </ThemedText>
        ) : null}
        {VITAMIN_TYPE_KEYS.filter(key => key !== 'vitamins_total').map(key => {
          const value = vitaminsByType?.[key] ?? 0;

          if (value <= 0) return null;

          return (
            <ThemedText key={`${keyPrefix}_${key}`} type="default">
              • {t(`journal:nutritionLogger.vitaminLabels.${key}`)}: {formatMilligramValue(value)} mg
            </ThemedText>
          );
        })}
      </Collapsible>
    </View>
  );
};

const MicrobiomeSection = ({ nutrition, keyPrefix, hasAnalysisAccess, showAnalysisInfo }: NutrientDetailsProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { microbiomeSupport } = nutrition;

  return (
    <View style={[styles.nutrientRow, { borderBottomColor: hasAnalysisAccess ? colors.infoDefault : colors.goldSoft }]} testID="nutrition-microbiome">
      <Collapsible
        title={t('journal:nutritionLogger.microbiomeTitle')}
        rightContent={<ThemedText>{microbiomeSupport?.length ? String(microbiomeSupport.length) : '—'}</ThemedText>}
        titleType="default"
        initialCollapsed
        leftContent={<IconSymbol name="microbiome" size={14} color={colors.textMuted} />}
      >
        {showAnalysisInfo && !PREMIUM && (
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.microbiomeBiohaxingInfo')}
          </ThemedText>
        )}
        {showAnalysisInfo && hasAnalysisAccess && !microbiomeSupport?.length ? (
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.extraNutritionMissing')}
          </ThemedText>
        ) : null}
        {microbiomeSupport?.map(item => (
          <View key={`${keyPrefix}_${item.microbe}`} style={styles.microbeRow}>
            <ThemedText type="default">
              • {item.microbe}: {item.supportLevel}
            </ThemedText>

            {item.linkedNutrients.length > 0 && (
              <ThemedText type="caption" style={styles.fiberSubtypeText}>
                {t('journal:nutritionLogger.linkedNutrients')}: {item.linkedNutrients.join(', ')}
              </ThemedText>
            )}

            {item.likelyFoods.length > 0 && (
              <ThemedText type="caption" style={styles.fiberSubtypeText}>
                {t('journal:nutritionLogger.sources')}: {item.likelyFoods.join(', ')}
              </ThemedText>
            )}
          </View>
        ))}
      </Collapsible>
    </View>
  );
};

const PolyphenolsSection = ({ nutrition, keyPrefix, hasAnalysisAccess, showAnalysisInfo }: NutrientDetailsProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { polyphenolByType } = nutrition;
  const isTrialAnalysis = nutrition.analysisTier === 'trial';
  const hasPolyphenolDetails = POLYPHENOL_TYPE_KEYS.some(key => key !== 'polyphenols_total' && polyphenolByType?.[key] !== undefined);
  const hasAnalyzedPolyphenolTypes = POLYPHENOL_TYPE_KEYS.some(key => key !== 'polyphenols_total' && (polyphenolByType?.[key] ?? 0) > 0);

  let premiumMessageKey = 'journal:nutritionLogger.polyphenolTypesPremium';
  if (isTrialAnalysis) {
    premiumMessageKey = 'journal:nutritionLogger.polyphenolTrialResult';
  } else if (hasAnalyzedPolyphenolTypes) {
    premiumMessageKey = 'journal:nutritionLogger.polyphenolPremiumExpired';
  }

  return (
    <View style={[styles.nutrientRow, { borderBottomColor: hasAnalysisAccess ? colors.infoDefault : colors.goldSoft }]} testID="nutrition-polyphenols">
      <Collapsible
        {...collapsibleHeader(
          t('journal:nutritionLogger.polyphenols', {
            value: polyphenolByType?.polyphenols_total !== undefined ? polyphenolByType.polyphenols_total.toFixed(1) : '—',
          })
        )}
        titleType="default"
        initialCollapsed
        leftContent={<IconSymbol name="polyphenol" size={14} color={colors.textMuted} />}
      >
        {showAnalysisInfo && !hasAnalysisAccess && (
          <View style={styles.fiberPremium}>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t(premiumMessageKey)}
            </ThemedText>
          </View>
        )}
        {showAnalysisInfo && !PREMIUM && hasAnalysisAccess && (
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.polyphenolBiohaxingInfo')}
          </ThemedText>
        )}
        {showAnalysisInfo && hasAnalysisAccess && !hasPolyphenolDetails && (
          <ThemedText type="caption" style={{ color: colors.textMuted }}>
            {t('journal:nutritionLogger.extraNutritionMissing')}
          </ThemedText>
        )}
        {POLYPHENOL_TYPE_KEYS.filter(key => key !== 'polyphenols_total').map(key => {
          const value = polyphenolByType?.[key] ?? 0;

          if (value <= 0) return null;

          return (
            <ThemedText key={`${keyPrefix}_${key}`} type="default">
              • {t(`journal:nutritionLogger.polyphenolLabels.${key}`)}: {value.toFixed(1)} mg
            </ThemedText>
          );
        })}
      </Collapsible>
    </View>
  );
};

const AlcoholSection = ({ nutrition, onAlcoholInfo }: AlcoholSectionProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { alcoholGrams } = nutrition;

  return (
    <View style={[styles.nutrientRow, { borderBottomColor: colors.textMuted }]} testID="nutrition-alcohol">
      <View style={styles.alcoholRow}>
        <IconSymbol name="alcohol" size={16} color={colors.textMuted} />
        <View style={styles.alcoholLabel}>
          <ThemedText>{t('journal:nutritionLogger.alcoholLabel')}</ThemedText>
          <Pressable accessibilityRole="button" accessibilityLabel={t('journal:nutritionLogger.alcoholInfo.title')} hitSlop={10} onPress={onAlcoholInfo}>
            <IconSymbol name="info" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
        <NutrientValue aiEstimated={nutrition.aiEstimatedNutrients?.includes('alcoholGrams')}>
          <ThemedText>{t('journal:nutritionLogger.alcoholGrams', { value: alcoholGrams === undefined ? '—' : Math.round(alcoholGrams * 10) / 10 })}</ThemedText>
        </NutrientValue>
      </View>
      <View style={styles.standardDrinksRow}>
        <ThemedText style={[styles.standardDrinks, { color: colors.textMuted }]}>
          {t('journal:nutritionLogger.alcoholStandardDrinks', {
            value: alcoholGrams === undefined ? '—' : Math.round((alcoholGrams / ALCOHOL_GRAMS_PER_STANDARD_DRINK) * 10) / 10,
          })}
        </ThemedText>
        <IconSymbol name="alcohol" size={12} color={colors.textMuted} />
      </View>
    </View>
  );
};

const NutritionBreakdown: React.FC<NutritionBreakdownProps> = ({ nutrition, keyPrefix, existingDataOnly = false }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const trialsRemaining = useFreePhotoAnalysesRemaining();
  // While the counter loads, avoid briefly showing an expired-Premium message.
  const hasAnalysisAccess = existingDataOnly || PREMIUM || trialsRemaining === null || trialsRemaining > 0;
  const showAnalysisInfo = !existingDataOnly;
  const showPremiumLink = !PREMIUM && !existingDataOnly;
  const analysisPanelColor = hasAnalysisAccess
    ? { borderColor: colors.infoDefault, backgroundColor: colors.infoWeak }
    : { borderColor: colors.goldSoft, backgroundColor: colors.goldTransparent };
  const [premiumVisible, setPremiumVisible] = useState(false);
  const [alcoholInfoVisible, setAlcoholInfoVisible] = useState(false);

  const { calories, carbohydrates, fat, caffeineMg } = nutrition;

  return (
    <>
      <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
        <IconSymbol name="flame" size={16} color={colors.textMuted} />
        <NutrientText aiEstimated={nutrition.aiEstimatedNutrients?.includes('calories')} text={t('journal:nutritionLogger.calories', { value: calories })} />
      </View>

      <ProteinSection
        nutrition={nutrition}
        keyPrefix={keyPrefix}
        hasAnalysisAccess={hasAnalysisAccess}
        showAnalysisInfo={showAnalysisInfo}
        showPremiumLink={showPremiumLink}
        analysisPanelColor={analysisPanelColor}
        onPremium={() => setPremiumVisible(true)}
      />

      <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
        <IconSymbol name="carbs" size={16} color={colors.textMuted} />
        <NutrientText
          aiEstimated={nutrition.aiEstimatedNutrients?.includes('carbohydrates')}
          text={t('journal:nutritionLogger.carbohydrates', { value: carbohydrates })}
        />
      </View>

      <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
        <IconSymbol name="fat" size={16} color={colors.textMuted} />
        <NutrientText aiEstimated={nutrition.aiEstimatedNutrients?.includes('fat')} text={t('journal:nutritionLogger.fat', { value: fat })} />
      </View>

      <FiberSection
        nutrition={nutrition}
        keyPrefix={keyPrefix}
        hasAnalysisAccess={hasAnalysisAccess}
        showAnalysisInfo={showAnalysisInfo}
        showPremiumLink={showPremiumLink}
        analysisPanelColor={analysisPanelColor}
        onPremium={() => setPremiumVisible(true)}
      />

      <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]} testID="nutrition-caffeine">
        <IconSymbol name="caffeine" size={16} color={colors.textMuted} />
        <NutrientText
          aiEstimated={nutrition.aiEstimatedNutrients?.includes('caffeineMg')}
          text={t('journal:nutritionLogger.caffeineAmount', { value: caffeineMg === undefined ? '—' : Math.round(caffeineMg) })}
        />
      </View>
      <AlcoholSection nutrition={nutrition} onAlcoholInfo={() => setAlcoholInfoVisible(true)} />

      <View style={[styles.biohaxingPanel, analysisPanelColor]} testID="nutrition-biohaxing-extras">
        <MineralsSection nutrition={nutrition} keyPrefix={keyPrefix} hasAnalysisAccess={hasAnalysisAccess} showAnalysisInfo={showAnalysisInfo} />

        <VitaminsSection nutrition={nutrition} keyPrefix={keyPrefix} hasAnalysisAccess={hasAnalysisAccess} showAnalysisInfo={showAnalysisInfo} />

        <MicrobiomeSection nutrition={nutrition} keyPrefix={keyPrefix} hasAnalysisAccess={hasAnalysisAccess} showAnalysisInfo={showAnalysisInfo} />

        <PolyphenolsSection nutrition={nutrition} keyPrefix={keyPrefix} hasAnalysisAccess={hasAnalysisAccess} showAnalysisInfo={showAnalysisInfo} />

        {showPremiumLink && (
          <View style={styles.premiumFooter} testID="nutrition-extras-premium-footer">
            {!hasAnalysisAccess && (
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {t('journal:nutritionLogger.biohaxingPremiumRequired')}
              </ThemedText>
            )}
            <View style={styles.premiumFooterRow}>
              {!hasAnalysisAccess && (
                <ThemedText type="caption" style={[styles.premiumFooterText, { color: colors.textMuted }]}>
                  {t('journal:nutritionLogger.premiumTrialsExhausted')}
                </ThemedText>
              )}
              <PremiumLink onPress={() => setPremiumVisible(true)} />
            </View>
          </View>
        )}
      </View>
      {premiumVisible && (
        <ThemedModal visible title={t('common:premium.premium')} onClose={() => setPremiumVisible(false)} showCancelButton={false}>
          <ScrollView style={styles.premiumOfferScroll}>
            <PremiumOffer onDismiss={() => setPremiumVisible(false)} />
          </ScrollView>
        </ThemedModal>
      )}
      {alcoholInfoVisible && <AlcoholInfoBottomSheet onClose={() => setAlcoholInfoVisible(false)} />}
    </>
  );
};

export default NutritionBreakdown;

const styles = StyleSheet.create({
  nutrientValue: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  premiumOfferScroll: { maxHeight: 500, width: '100%' },
  premiumFooter: { marginTop: 6 },
  premiumFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  premiumFooterText: { flex: 1, flexShrink: 1 },
  biohaxingPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, marginVertical: 4 },
  premiumDropdown: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12, overflow: 'hidden' },
  fiberPremium: { gap: 10, paddingVertical: 8 },
  nutrientRow: {
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nutrientRowWithIcon: {
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingLeft: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alcoholLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  alcoholRow: {
    paddingLeft: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  standardDrinksRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  standardDrinks: {
    fontSize: 12,
    lineHeight: 18,
  },
  nutrientLabel: {
    flex: 1,
  },
  fiberCategoryRow: {
    marginBottom: 4,
  },
  fiberSubtypeText: {
    marginLeft: 14,
    opacity: 0.85,
  },
  microbeRow: {
    marginBottom: 6,
  },
  aminoGroupHeader: {
    marginTop: 4,
    marginBottom: 2,
    fontWeight: '600',
  },
  aminoGroupHeaderSecond: {
    marginTop: 10,
  },
});
