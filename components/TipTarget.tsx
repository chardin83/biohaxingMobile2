import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { getTipTargetIconName } from '@/locales/tips';
import {
  type NutritionTargetPeriod,
  type NutritionTargetUnit,
} from '@/types/nutritionTargets';

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
  };
};

const formatMilligramValue = (value: number): string => {
  if (value < 0.01) return value.toFixed(4);
  if (value < 1) return value.toFixed(3);
  if (value < 10) return value.toFixed(2);
  return value.toFixed(0);
};

const formatTargetValue = (value: number, unit: NutritionTargetUnit): string => {
  if (unit === 'plants' || unit === 'items' || unit === 'count') {
    return `${Math.round(value)} ${unit}`;
  }
  if (unit === 'mg') {
    return `${formatMilligramValue(value)} ${unit}`;
  }
  return `${value.toFixed(1)} ${unit}`;
};

const formatTargetProgressValue = (value: number, unit: NutritionTargetUnit): string => {
  if (unit === 'items' || unit === 'count') {
    return `${Math.round(value)}`;
  }
  return formatTargetValue(value, unit);
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
  const resolvedTipTitle =
    tip.title?.includes('.') ? t(`tips:${tip.title}`) : (tip.title ?? tip.tipId);
  const targetValueText = `${valueFormatter(target.actual, target.unit)} / ${valueFormatter(
    target.amount,
    target.unit
  )}${target.isMet ? ' 🥇' : ''}`;

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
      <View style={styles.planTipTargetCollapsibleRow}>
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  planTipTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  planTipTargetLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTipTargetCollapsibleRow: {
    marginBottom: 4,
    width: '100%',
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
