import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { getTipTargetIconName } from '@/locales/tips';
import {
  type NutritionTargetPeriod,
  type NutritionTargetUnit,
} from '@/types/nutritionTargets';
import { formatWithUnit } from '@/utils/formatters';
import { getNutritionTargetMedalEmoji, getNutritionTargetMedalType } from '@/utils/medals';

import { Collapsible } from './Collapsible';
import { ThemedText } from './ThemedText';
import { IconSymbol } from './ui/IconSymbol';

type TipTargetItem = {
  tag: string;
  unit: NutritionTargetUnit;
  period: NutritionTargetPeriod;
  amount: number;
  actual: number;
  foodActual?: number;
  supplementActual?: number;
  isMet: boolean;
  label: string;
  trackedItems?: string[];
  supplementIds?: string[];
};

type TipTargetProps = {
  tip: { tipId: string; title?: string; dateKey?: string };
  target: TipTargetItem;
  colors: {
    primary: string;
    textMuted: string;
    overlayLight: string;
  };
};

const formatTargetValue = (value: number, unit: NutritionTargetUnit, tag: string): string => {
  if (unit === 'plants' || unit === 'items' || unit === 'count') {
    return `${Math.round(value)} ${unit}`;
  }
  return formatWithUnit(value, unit, tag);
};

const formatTargetProgressValue = (value: number, unit: NutritionTargetUnit, tag: string): string => {
  if (unit === 'items' || unit === 'count') {
    return `${Math.round(value)}`;
  }
  return formatTargetValue(value, unit, tag);
};

const renderTrackedItems = (targetTag: string, trackedItems: string[]) =>
  trackedItems.map(item => (
    <ThemedText key={`${targetTag}-${item}`} type="caption" style={styles.planTipTargetItem}>
      • {item}
    </ThemedText>
  ));

const TipTarget: React.FC<TipTargetProps> = ({ tip, target, colors }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const usesDiscreteUnit = target.unit === 'items' || target.unit === 'count';
  const trackedItems = target.trackedItems ?? [];
  const hasTrackedItems = usesDiscreteUnit && trackedItems.length > 0;
  const targetIconName = getTipTargetIconName(tip.tipId) ?? 'target';
  const valueFormatter = usesDiscreteUnit ? formatTargetProgressValue : formatTargetValue;
  const translatedTipKey = tip.title?.includes('.') ? 'tips:' + tip.title : null;
  const resolvedTipTitle =
    translatedTipKey ? t(translatedTipKey) : (tip.title ?? tip.tipId);
  const medalType = getNutritionTargetMedalType({
    actual: target.actual,
    targetAmount: target.amount,
    foodActual: target.foodActual,
    unit: target.unit,
  });
  const medalEmoji = getNutritionTargetMedalEmoji(medalType);
  const currentValueText = valueFormatter(target.actual, target.unit, target.tag);
  const amountValueText = valueFormatter(target.amount, target.unit, target.tag);
  const targetValueText = `${currentValueText} / ${amountValueText}` + (medalEmoji ? ` ${medalEmoji}` : '');

  const dateKey = tip.dateKey ?? new Date().toISOString().split('T')[0];

  const openTargetDetails = () => {
    router.push({
      pathname: '/(stack)/calendar/tip-target-details',
      params: {
        tipId: tip.tipId,
        tipTitle: resolvedTipTitle,
        targetLabel: target.label,
        targetTag: target.tag,
        hasMedal: target.isMet ? '1' : '0',
        foodActual: String(target.foodActual ?? target.actual),
        supplementActual: String(target.supplementActual ?? 0),
        targetAmount: String(target.amount),
        targetUnit: target.unit,
        dateKey,
        targetSupplementIds: (target.supplementIds ?? []).join(','),
      },
    });
  };

  if (hasTrackedItems) {
    return (
      <View style={[styles.planTipTargetContainer, { backgroundColor: colors.overlayLight }]}>
        <Collapsible
          title={target.label}
          titleType="explainer"
          initialCollapsed
          leftContent={<IconSymbol name={targetIconName} size={14} color={colors.textMuted} />}
          rightContent={
            <TouchableOpacity
              onPress={openTargetDetails}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Open details for ${target.label}`}
            >
              <ThemedText
                type="explainer"
                style={[styles.planTipTargetValue, styles.planTipTargetCollapsibleValue]}
              >
                {targetValueText}
              </ThemedText>
            </TouchableOpacity>
          }
        >
          <View style={styles.planTipTargetItemsList}>
            {renderTrackedItems(target.tag, trackedItems)}
          </View>
        </Collapsible>
      </View>
    );
  }

  return (
    <View style={[styles.planTipTargetContainer, { backgroundColor: colors.overlayLight }]}>
      <TouchableOpacity
        style={styles.planTipTargetRow}
        onPress={openTargetDetails}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Open details for ${target.label}`}
      >
      
        <View style={styles.planTipTargetLabelRow}>
          <IconSymbol name={targetIconName} size={14} color={colors.textMuted} />
          <ThemedText type="explainer" style={styles.planTipTargetLabel}>
            {target.label}
          </ThemedText>
        </View>
        <ThemedText
          type="caption"
          style={[styles.planTipTargetValue, { color: target.isMet ? colors.primary : colors.textMuted }]}
        >
          {targetValueText}
        </ThemedText>
        <ThemedText type="explainer" style={[styles.planTipTargetChevron, { color: colors.textMuted }]}>
          {'›'}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  planTipTargetContainer: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  planTipTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  planTipTargetLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTipTargetChevron: {
    marginRight: 4,
    fontSize: 16,
  },

  planTipTargetLabel: {
    flex: 1,
  },
  planTipTargetValue: {
    textAlign: 'right',
  },
  planTipTargetCollapsibleValue: {
    marginLeft: 'auto',
  },
  planTipTargetItemsList: {
    marginTop: 4,
    marginLeft: 4,
    gap: 2,
  },
  planTipTargetItem: {
    opacity: 0.9,
  },
});

export default TipTarget;
