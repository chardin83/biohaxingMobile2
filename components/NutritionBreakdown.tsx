import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { FIBER_CATEGORY_SUBTYPES, type FiberSubtype } from '@/locales/tips';

import { Collapsible } from './Collapsible';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

type MicrobiomeSupportEntry = {
  microbe: string;
  supportLevel: 'high' | 'medium' | 'low' | 'unknown';
  linkedNutrients: string[];
  likelyFoods: string[];
};

type NutritionBreakdownProps = {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  fiberByType: Record<string, number>;
  fiberSubtypeTotals: Record<string, number>;
  polyphenolByType: Record<string, number>;
  mineralsByType: Record<string, number>;
  mineralsConfidenceByType: Record<string, ConfidenceLevel>;
  vitaminsByType: Record<string, number>;
  aminoAcidsByType: Record<string, number>;
  microbiomeSupport: MicrobiomeSupportEntry[];
  keyPrefix: string;
};

const FIBER_TYPE_KEYS = ['fiber_total', 'fiber_gel_forming', 'fiber_non_gel_forming', 'fiber_fermentable'] as const;
const POLYPHENOL_TYPE_KEYS = [
  'polyphenols_total',
  'flavonoids_total',
  'flavonoids',
  'anthocyanins',
  'catechins',
  'flavanols',
  'flavonols',
  'quercetin',
  'ellagitannins',
] as const;
const MINERAL_TYPE_KEYS = [
  'minerals_total',
  'sodium',
  'potassium',
  'magnesium',
  'calcium',
  'iron',
  'zinc',
  'selenium',
  'iodine',
  'phosphorus',
  'copper',
  'manganese',
] as const;
const VITAMIN_TYPE_KEYS = [
  'vitamins_total',
  'vitamin_a',
  'vitamin_c',
  'vitamin_d',
  'vitamin_e',
  'vitamin_k',
  'vitamin_b1',
  'vitamin_b2',
  'vitamin_b3',
  'vitamin_b5',
  'vitamin_b6',
  'vitamin_b7',
  'vitamin_b9',
  'vitamin_b12',
] as const;
const ESSENTIAL_AMINO_ACID_KEYS = [
  'histidine',
  'isoleucine',
  'leucine',
  'lysine',
  'methionine',
  'phenylalanine',
  'threonine',
  'tryptophan',
  'valine',
] as const;
const OTHER_AMINO_ACID_KEYS = [
  'arginine',
  'cysteine',
  'glutamine',
  'glycine',
  'proline',
  'tyrosine',
] as const;

const hasAnyTypedTotals = (values: Record<string, number>) =>
  Object.values(values).some(value => (value ?? 0) > 0);

const getEssentialAminoTotalMg = (values: Record<string, number>): number =>
  ESSENTIAL_AMINO_ACID_KEYS.reduce((sum, key) => sum + (values[key] ?? 0), 0);

const getMineralsTotal = (mineralsByType: Record<string, number>): number => {
  const explicit = mineralsByType.minerals_total ?? 0;
  if (explicit > 0) return explicit;
  return MINERAL_TYPE_KEYS
    .filter(key => key !== 'minerals_total')
    .reduce((sum, key) => sum + (mineralsByType[key] ?? 0), 0);
};

const getVitaminsTotal = (vitaminsByType: Record<string, number>): number => {
  const explicit = vitaminsByType.vitamins_total ?? 0;
  if (explicit > 0) return explicit;
  return VITAMIN_TYPE_KEYS
    .filter(key => key !== 'vitamins_total')
    .reduce((sum, key) => sum + (vitaminsByType[key] ?? 0), 0);
};

const getConfidenceLabelKey = (confidence: ConfidenceLevel): string => {
  if (confidence === 'high') return 'nutritionLogger.confidenceHigh';
  if (confidence === 'medium') return 'nutritionLogger.confidenceMedium';
  if (confidence === 'low') return 'nutritionLogger.confidenceLow';
  return 'nutritionLogger.confidenceUnknown';
};

const formatMilligramValue = (value: number): string => {
  if (value < 0.01) return value.toFixed(4);
  if (value < 1) return value.toFixed(3);
  if (value < 10) return value.toFixed(2);
  return value.toFixed(0);
};

const NutritionBreakdown: React.FC<NutritionBreakdownProps> = ({
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
  keyPrefix,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const getFiberSubtypeAmountsForCategory = (
    category: (typeof FIBER_TYPE_KEYS)[number],
    subtypeTotals: Record<string, number>
  ): Array<{ subtype: FiberSubtype; label: string; amount: number }> => {
    if (category === 'fiber_total') return [];
    const subtypes = FIBER_CATEGORY_SUBTYPES[category] ?? [];
    return subtypes
      .map(subtype => ({
        subtype,
        label: t(`nutritionLogger.fiberSubtypeLabels.${subtype}`),
        amount: subtypeTotals[subtype] ?? 0,
      }))
      .filter(item => item.amount > 0);
  };

  return (
    <>
      <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
        <IconSymbol name="flame" size={16} color={colors.textMuted} />
        <ThemedText type="default">{t('nutritionLogger.calories', { value: calories })}</ThemedText>
      </View>

      {hasAnyTypedTotals(aminoAcidsByType) ? (
        <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
          <Collapsible
            title={t('nutritionLogger.protein', { value: protein })}
            titleType="default"
            initialCollapsed
            leftContent={<IconSymbol name="protein" size={14} color={colors.textMuted} />}
          >
            <ThemedText type="caption" style={[styles.aminoGroupHeader, { color: colors.textMuted }]}> 
              {t('nutritionLogger.essentialAminoAcidsTitle')}
            </ThemedText>
            <ThemedText type="default" style={{ color: colors.textMuted }}>
              • {t('nutritionLogger.essentialAminoAcidsTotal')}: {(getEssentialAminoTotalMg(aminoAcidsByType) / 1000).toFixed(1)} g
            </ThemedText>
            {ESSENTIAL_AMINO_ACID_KEYS.map(key => {
              const value = aminoAcidsByType[key] ?? 0;
              if (value <= 0) return null;
              return (
                <ThemedText key={`${keyPrefix}_${key}`} type="default">
                  • {t(`nutritionLogger.aminoAcidLabels.${key}`)}: {(value / 1000).toFixed(1)} g
                </ThemedText>
              );
            })}
            {OTHER_AMINO_ACID_KEYS.some(k => (aminoAcidsByType[k] ?? 0) > 0) && (
              <>
                <ThemedText type="caption" style={[styles.aminoGroupHeader, styles.aminoGroupHeaderSecond, { color: colors.textMuted }]}> 
                  {t('nutritionLogger.otherAminoAcidsTitle')}
                </ThemedText>
                {OTHER_AMINO_ACID_KEYS.map(key => {
                  const value = aminoAcidsByType[key] ?? 0;
                  if (value <= 0) return null;
                  return (
                    <ThemedText key={`${keyPrefix}_${key}`} type="default">
                      • {t(`nutritionLogger.aminoAcidLabels.${key}`)}: {(value / 1000).toFixed(1)} g
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
          <ThemedText type="default">{t('nutritionLogger.protein', { value: protein })}</ThemedText>
        </View>
      )}

      <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
        <IconSymbol name="carbs" size={16} color={colors.textMuted} />
        <ThemedText type="default">{t('nutritionLogger.carbohydrates', { value: carbohydrates })}</ThemedText>
      </View>

      <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
        <IconSymbol name="fat" size={16} color={colors.textMuted} />
        <ThemedText type="default">{t('nutritionLogger.fat', { value: fat })}</ThemedText>
      </View>

      {hasAnyTypedTotals(fiberByType) ? (
        <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
          <Collapsible
            title={t('nutritionLogger.fiber', { value: fiber })}
            titleType="default"
            initialCollapsed
            leftContent={<IconSymbol name="fiber" size={14} color={colors.textMuted} />}
          >
            {FIBER_TYPE_KEYS.map(key => {
              const value = fiberByType[key] ?? 0;
              if (value <= 0) return null;
              const subtypeRows = getFiberSubtypeAmountsForCategory(key, fiberSubtypeTotals);
              return (
                <View key={`${keyPrefix}_${key}`} style={styles.fiberCategoryRow}>
                  <ThemedText type="default">
                    • {t(`nutritionLogger.fiberLabels.${key}`)}: {value.toFixed(1)} g
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
        <ThemedText type="default">{t('nutritionLogger.fiber', { value: fiber })}</ThemedText>
      )}

      {hasAnyTypedTotals(polyphenolByType) && (
        <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
          <Collapsible
            title={t('nutritionLogger.polyphenols', { value: (polyphenolByType.polyphenols_total ?? 0).toFixed(1) })}
            titleType="default"
            initialCollapsed
            leftContent={<IconSymbol name="polyphenol" size={14} color={colors.textMuted} />}
          >
            {POLYPHENOL_TYPE_KEYS.filter(key => key !== 'polyphenols_total').map(key => {
              const value = polyphenolByType[key] ?? 0;
              if (value <= 0) return null;
              return (
                <ThemedText key={`${keyPrefix}_${key}`} type="default">
                  • {t(`nutritionLogger.polyphenolLabels.${key}`)}: {value.toFixed(1)} mg
                </ThemedText>
              );
            })}
          </Collapsible>
        </View>
      )}

      {hasAnyTypedTotals(mineralsByType) && (
        <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
          <Collapsible
            title={t('nutritionLogger.minerals', { value: getMineralsTotal(mineralsByType).toFixed(1) })}
            titleType="default"
            initialCollapsed
          >
            {MINERAL_TYPE_KEYS.filter(key => key !== 'minerals_total').map(key => {
              const value = mineralsByType[key] ?? 0;
              if (value <= 0) return null;
              return (
                <ThemedText key={`${keyPrefix}_${key}`} type="default">
                  • {t(`nutritionLogger.mineralLabels.${key}`)}: {value.toFixed(1)} mg
                  {' • '}
                  {t(getConfidenceLabelKey(mineralsConfidenceByType[key] ?? 'unknown'))}
                </ThemedText>
              );
            })}
          </Collapsible>
        </View>
      )}

      {hasAnyTypedTotals(vitaminsByType) && (
        <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
          <Collapsible
            title={t('nutritionLogger.vitamins', { value: getVitaminsTotal(vitaminsByType).toFixed(1) })}
            titleType="default"
            initialCollapsed
          >
            {VITAMIN_TYPE_KEYS.filter(key => key !== 'vitamins_total').map(key => {
              const value = vitaminsByType[key] ?? 0;
              if (value <= 0) return null;
              return (
                <ThemedText key={`${keyPrefix}_${key}`} type="default">
                  • {t(`nutritionLogger.vitaminLabels.${key}`)}: {formatMilligramValue(value)} mg
                </ThemedText>
              );
            })}
          </Collapsible>
        </View>
      )}

      {microbiomeSupport.length > 0 && (
        <Collapsible
          title={t('nutritionLogger.microbiomeYes', { count: microbiomeSupport.length })}
          titleType="default"
          initialCollapsed
          leftContent={<IconSymbol name="microbiome" size={14} color={colors.textMuted} />}
        >
          {microbiomeSupport.map(item => (
            <View key={`${keyPrefix}_${item.microbe}`} style={styles.microbeRow}>
              <ThemedText type="default">• {item.microbe}: {item.supportLevel}</ThemedText>
              {item.linkedNutrients.length > 0 && (
                <ThemedText type="caption" style={styles.fiberSubtypeText}>
                  {t('nutritionLogger.linkedNutrients')}: {item.linkedNutrients.join(', ')}
                </ThemedText>
              )}
              {item.likelyFoods.length > 0 && (
                <ThemedText type="caption" style={styles.fiberSubtypeText}>
                  {t('nutritionLogger.sources')}: {item.likelyFoods.join(', ')}
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