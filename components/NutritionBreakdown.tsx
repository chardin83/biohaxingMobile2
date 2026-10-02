import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { NutritionData } from '@/app/context/storage/nutrition/nutritionTypes';
import { ESSENTIAL_AMINO_ACID_KEYS, OTHER_AMINO_ACID_KEYS } from '@/constants/aminoAcids';
import { FIBER_CATEGORY_SUBTYPES, FIBER_TYPE_KEYS, type FiberSubtype } from '@/constants/fiber';
import { MINERAL_TYPE_KEYS } from '@/constants/minerals';
import { POLYPHENOL_TYPE_KEYS } from '@/constants/polyphenols';
import { VITAMIN_TYPE_KEYS } from '@/constants/vitamins';

import { Collapsible } from './Collapsible';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

type NutritionBreakdownProps = {
  nutrition: NutritionData;
  keyPrefix: string;
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

const NutritionBreakdown: React.FC<NutritionBreakdownProps> = ({ nutrition, keyPrefix }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const {
    calories,
    protein,
    carbohydrates,
    fat,
    fiber,
    fiberByType,
    fiberSubtypeTotals,
    polyphenolByType,
    mineralsByType,
    mineralsConfidenceByType,
    vitaminsByType,
    aminoAcidsByType,
    microbiomeSupport,
  } = nutrition;

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

  return (
    <>
      <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
        <IconSymbol name="flame" size={16} color={colors.textMuted} />
        <ThemedText type="default">{t('journal:nutritionLogger.calories', { value: calories })}</ThemedText>
      </View>

      {hasAnyTypedTotals(aminoAcidsByType) ? (
        <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
          <Collapsible
            title={t('journal:nutritionLogger.protein', { value: protein })}
            titleType="default"
            initialCollapsed
            leftContent={<IconSymbol name="protein" size={14} color={colors.textMuted} />}
          >
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
          </Collapsible>
        </View>
      ) : (
        <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
          <IconSymbol name="protein" size={16} color={colors.textMuted} />
          <ThemedText type="default">{t('journal:nutritionLogger.protein', { value: protein })}</ThemedText>
        </View>
      )}

      <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
        <IconSymbol name="carbs" size={16} color={colors.textMuted} />
        <ThemedText type="default">{t('journal:nutritionLogger.carbohydrates', { value: carbohydrates })}</ThemedText>
      </View>

      <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
        <IconSymbol name="fat" size={16} color={colors.textMuted} />
        <ThemedText type="default">{t('journal:nutritionLogger.fat', { value: fat })}</ThemedText>
      </View>

      {hasAnyTypedTotals(fiberByType) ? (
        <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
          <Collapsible
            title={t('journal:nutritionLogger.fiber', { value: fiber })}
            titleType="default"
            initialCollapsed
            leftContent={<IconSymbol name="fiber" size={14} color={colors.textMuted} />}
          >
            {FIBER_TYPE_KEYS.map(key => {
              const value = fiberByType?.[key] ?? 0;

              if (value <= 0) return null;

              const subtypeRows = getFiberSubtypeAmountsForCategory(key);

              return (
                <View key={`${keyPrefix}_${key}`} style={styles.fiberCategoryRow}>
                  <ThemedText type="default">
                    • {t(`journal:nutritionLogger.fiberLabels.${key}`)}: {value.toFixed(1)} g
                  </ThemedText>

                  {subtypeRows.map(row => (
                    <ThemedText key={`${keyPrefix}_${key}_${row.subtype}`} type="caption" style={styles.fiberSubtypeText}>
                      - {row.label}: {row.amount.toFixed(1)} g
                    </ThemedText>
                  ))}
                </View>
              );
            })}
          </Collapsible>
        </View>
      ) : (
        <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
          <IconSymbol name="fiber" size={16} color={colors.textMuted} />
          <ThemedText type="default">{t('journal:nutritionLogger.fiber', { value: fiber })}</ThemedText>
        </View>
      )}

      {hasAnyTypedTotals(polyphenolByType) && (
        <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
          <Collapsible
            title={t('journal:nutritionLogger.polyphenols', {
              value: (polyphenolByType?.polyphenols_total ?? 0).toFixed(1),
            })}
            titleType="default"
            initialCollapsed
            leftContent={<IconSymbol name="polyphenol" size={14} color={colors.textMuted} />}
          >
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
      )}

      {hasAnyTypedTotals(mineralsByType) && (
        <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
          <Collapsible
            title={t('journal:nutritionLogger.minerals', {
              value: getMineralsTotal(mineralsByType!).toFixed(1),
            })}
            titleType="default"
            initialCollapsed
          >
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
      )}

      {hasAnyTypedTotals(vitaminsByType) && (
        <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
          <Collapsible
            title={t('journal:nutritionLogger.vitamins', {
              value: getVitaminsTotal(vitaminsByType!).toFixed(1),
            })}
            titleType="default"
            initialCollapsed
          >
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
      )}

      {(microbiomeSupport?.length ?? 0) > 0 && (
        <Collapsible
          title={t('journal:nutritionLogger.microbiomeYes', {
            count: microbiomeSupport?.length ?? 0,
          })}
          titleType="default"
          initialCollapsed
          leftContent={<IconSymbol name="microbiome" size={14} color={colors.textMuted} />}
        >
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
      )}
    </>
  );
};

export default NutritionBreakdown;

const styles = StyleSheet.create({
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
