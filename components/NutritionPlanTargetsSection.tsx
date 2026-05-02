import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { globalStyles } from '@/app/theme/globalStyles';
import {
  type NutritionTargetPeriod,
  type NutritionTargetUnit,
} from '@/types/nutritionTargets';

import { Collapsible } from './Collapsible';
import { ThemedText } from './ThemedText';
import AppButton from './ui/AppButton';
import { Card } from './ui/Card';
import DiscreetButton from './ui/DiscreetButton';
import { IconSymbol } from './ui/IconSymbol';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TipTargetUnit = NutritionTargetUnit;
export type TipTargetPeriod = NutritionTargetPeriod;
type TipTargetIconName = 'fiber' | 'polyphenol' | 'target';

export type TipProgressItem = {
  tipId: string;
  title: string;
  areaId?: string;
  period: TipTargetPeriod;
  targets: Array<{
    tag: string;
    unit: TipTargetUnit;
    period: TipTargetPeriod;
    amount: number;
    actual: number;
    isMet: boolean;
    label: string;
    trackedItems?: string[];
  }>;
  metCount: number;
  totalCount: number;
  isFulfilled: boolean;
  progress: number;
};

type CurrentRef<T> = { current: T };
type TipTarget = TipProgressItem['targets'][number];
type ThemeColors = ReturnType<typeof useTheme>['colors'];

// ── Module-level helpers ───────────────────────────────────────────────────────

export const getTipProgressKey = (tip: TipProgressItem): string =>
  `${tip.tipId}|${tip.period}`;

const getTipTargetIconName = (unit: TipTargetUnit): TipTargetIconName => {
  if (unit === 'g') return 'fiber';
  if (unit === 'mg') return 'polyphenol';
  return 'target';
};

const formatMilligramValue = (value: number): string => {
  if (value < 0.01) return value.toFixed(4);
  if (value < 1) return value.toFixed(3);
  if (value < 10) return value.toFixed(2);
  return value.toFixed(0);
};

const formatTargetValue = (value: number, unit: TipTargetUnit): string => {
  if (unit === 'plants' || unit === 'items' || unit === 'count') {
    return `${Math.round(value)} ${unit}`;
  }
  if (unit === 'mg') {
    return `${formatMilligramValue(value)} ${unit}`;
  }
  return `${value.toFixed(1)} ${unit}`;
};

const formatTargetProgressValue = (value: number, unit: TipTargetUnit): string => {
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

const renderTipTarget = (tip: TipProgressItem, target: TipTarget, colors: ThemeColors) => {
  const hasTrackedItems = Array.isArray(target.trackedItems) && target.trackedItems.length > 0;
  const trackedItems = target.trackedItems ?? [];
  const targetIconName = getTipTargetIconName(target.unit);
  const valueFormatter = hasTrackedItems ? formatTargetProgressValue : formatTargetValue;
  const targetValueText = `${valueFormatter(target.actual, target.unit)} / ${valueFormatter(
    target.amount,
    target.unit
  )}`;

  if (hasTrackedItems) {
    return (
      <View
        key={`${tip.tipId}-${target.tag}-${target.unit}-${target.period}`}
        style={styles.planTipTargetCollapsibleRow}
      >
        <Collapsible
          title={target.label}
          titleType="explainer"
          initialCollapsed
          leftContent={<IconSymbol name={targetIconName} size={14} color={colors.textMuted} />}
          rightContent={
            <ThemedText
              type="explainer"
              style={[styles.planTipTargetValue, styles.planTipTargetCollapsibleValue]}
            >
              {targetValueText}
            </ThemedText>
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
    <View
      key={`${tip.tipId}-${target.tag}-${target.unit}-${target.period}`}
      style={styles.planTipTargetRow}
    >
      <View style={styles.planTipTargetLabelRow}>
        <IconSymbol name={targetIconName} size={14} color={colors.textMuted} />
        <ThemedText type="explainer" style={styles.planTipTargetLabel}>
          {target.label}
        </ThemedText>
      </View>
      <ThemedText
        type="caption"
        style={[
          styles.planTipTargetValue,
          { color: target.isMet ? colors.primary : colors.textMuted },
        ]}
      >
        {targetValueText}
      </ThemedText>
    </View>
  );
};

// ── Props ──────────────────────────────────────────────────────────────────────

export type NutritionPlanTargetsSectionProps = {
  fulfilledTipsSectionYRef: CurrentRef<number>;
  periodSectionYRef: CurrentRef<Record<TipTargetPeriod, number>>;
  nutritionPlanTipProgressByPeriod: {
    daily: TipProgressItem[];
    weekly: TipProgressItem[];
  };
  getCompletionAnimValue: (tipKey: string) => Animated.Value;
  tipRowLocalYByKeyRef: CurrentRef<Record<string, number>>;
  tipRowPeriodByKeyRef: CurrentRef<Record<string, TipTargetPeriod>>;
};

type TipProgressRowProps = {
  tip: TipProgressItem;
  getCompletionAnimValue: (tipKey: string) => Animated.Value;
  tipRowLocalYByKeyRef: CurrentRef<Record<string, number>>;
  tipRowPeriodByKeyRef: CurrentRef<Record<string, TipTargetPeriod>>;
  colors: ThemeColors;
  t: ReturnType<typeof useTranslation>['t'];
  router: ReturnType<typeof useRouter>;
};

const TipProgressRow: React.FC<TipProgressRowProps> = ({
  tip,
  getCompletionAnimValue,
  tipRowLocalYByKeyRef,
  tipRowPeriodByKeyRef,
  colors,
  t,
  router,
}) => {
  const tipKey = getTipProgressKey(tip);
  const completionAnim = getCompletionAnimValue(tipKey);

  return (
    <View
      onLayout={event => {
        tipRowLocalYByKeyRef.current[tipKey] = event.nativeEvent.layout.y;
        tipRowPeriodByKeyRef.current[tipKey] = tip.period;
      }}
    >
      <Animated.View
        style={[
          {
            transform: [
              {
                scale: completionAnim.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [1, 1.03, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.planTipProgressRow,
            tip.isFulfilled && styles.planTipProgressRowFulfilled,
            tip.isFulfilled
              ? {
                  backgroundColor: colors.accentVeryWeak,
                  borderColor: colors.accentMedium,
                }
              : {
                  borderBottomColor: colors.textMuted,
                },
          ]}
          activeOpacity={0.8}
          disabled={!tip.areaId}
          onPress={() => {
            if (!tip.areaId) return;
            router.push({
              pathname: `/dashboard/area/${tip.areaId}/details` as any,
              params: {
                tipId: tip.tipId,
              },
            });
          }}
        >
          <View style={styles.planTipProgressHeader}>
            <ThemedText type="defaultSemiBold" style={styles.fulfilledTipTextBlock}>
              {t(`tips:${tip.title}`)}
            </ThemedText>
            {tip.isFulfilled && <Icon source="check-circle" size={34} color={colors.xp} />}
          </View>

          <ThemedText type="caption" style={styles.planTipStatusText}>
            {t('nutritionLogger.fulfilledTargetsCount', {
              met: tip.metCount,
              total: tip.totalCount,
            })}
          </ThemedText>

          <View
            style={[
              styles.progressTrack,
              tip.isFulfilled && styles.progressTrackFulfilled,
              {
                backgroundColor: tip.isFulfilled ? colors.accentWeak : colors.secondaryBackground,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                tip.isFulfilled && styles.progressFillFulfilled,
                {
                  width: `${Math.round(tip.progress * 100)}%`,
                  backgroundColor: tip.isFulfilled ? colors.accentMedium : colors.icon,
                },
              ]}
            />
          </View>

          {tip.targets.map(target => renderTipTarget(tip, target, colors))}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ── Component ──────────────────────────────────────────────────────────────────

const NutritionPlanTargetsSection: React.FC<NutritionPlanTargetsSectionProps> = ({
  fulfilledTipsSectionYRef,
  periodSectionYRef,
  nutritionPlanTipProgressByPeriod,
  getCompletionAnimValue,
  tipRowLocalYByKeyRef,
  tipRowPeriodByKeyRef,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const renderTipProgressItems = (tipsForPeriod: TipProgressItem[]) =>
    tipsForPeriod.map(tip => {
      return (
        <TipProgressRow
          key={getTipProgressKey(tip)}
          tip={tip}
          getCompletionAnimValue={getCompletionAnimValue}
          tipRowLocalYByKeyRef={tipRowLocalYByKeyRef}
          tipRowPeriodByKeyRef={tipRowPeriodByKeyRef}
          colors={colors}
          t={t}
          router={router}
        />
      );
    });

  const renderTipProgressList = (tipsForPeriod: TipProgressItem[]) => {
    const fulfilledTips = tipsForPeriod.filter(tip => tip.isFulfilled);
    const inProgressTips = tipsForPeriod.filter(tip => !tip.isFulfilled);
    return (
      <>
        {renderTipProgressItems(fulfilledTips)}
        {renderTipProgressItems(inProgressTips)}
      </>
    );
  };

  return (
    <View
      onLayout={event => {
        fulfilledTipsSectionYRef.current = event.nativeEvent.layout.y;
      }}
    >
      <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
        {nutritionPlanTipProgressByPeriod.daily.length === 0 && nutritionPlanTipProgressByPeriod.weekly.length === 0 ? (
          <View style={styles.emptyTargetsContainer}>
            <ThemedText type="title3" style={styles.emptyTargetsHeading}>
              {t('nutritionLogger.targetsTitle')}
            </ThemedText>
            <ThemedText type="caption" style={[styles.emptyTargetsText, { color: colors.textLight }]}>
              {t('nutritionLogger.targetsEmptyDescription')}
            </ThemedText>
            <AppButton
              title={t('nutritionLogger.addFirstTarget')}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/search',
                  params: {
                    targetPeriods: 'daily,weekly',
                  },
                });
              }}
              glow
              style={styles.addFirstTargetButton}
            />
          </View>
        ) : (
          <>
            <View
              style={styles.periodSection}
              onLayout={event => {
                periodSectionYRef.current.daily = event.nativeEvent.layout.y;
              }}
            >
              <ThemedText type="title3" style={styles.periodSectionHeading}>
                {t('nutritionLogger.periodDaily')}
              </ThemedText>
              {nutritionPlanTipProgressByPeriod.daily.length > 0 ? (
                renderTipProgressList(nutritionPlanTipProgressByPeriod.daily)
              ) : (
                <ThemedText type="explainer" style={styles.noFulfilledTipsText}>
                  {t('nutritionLogger.noPlanTipsWithTargets')}
                </ThemedText>
              )}
              <View style={styles.addTargetButton}>
                <DiscreetButton
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/search',
                      params: {
                        targetPeriods: 'daily',
                      },
                    });
                  }}
                  title={t('nutritionLogger.addDailyTarget')}
                />
              </View>
            </View>
            <View
              style={styles.periodSection}
              onLayout={event => {
                periodSectionYRef.current.weekly = event.nativeEvent.layout.y;
              }}
            >
              <ThemedText type="title3" style={styles.periodSectionHeading}>
                {t('nutritionLogger.periodWeekly')}
              </ThemedText>
              {nutritionPlanTipProgressByPeriod.weekly.length > 0 ? (
                renderTipProgressList(nutritionPlanTipProgressByPeriod.weekly)
              ) : (
                <ThemedText type="explainer" style={styles.noFulfilledTipsText}>
                  {t('nutritionLogger.noPlanTipsWithTargets')}
                </ThemedText>
              )}
              <View style={styles.addTargetButton}>
                <DiscreetButton
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/search',
                      params: {
                        targetPeriods: 'weekly',
                      },
                    });
                  }}
                  title={t('nutritionLogger.addWeeklyTarget')}
                />
                <DiscreetButton
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/search',
                      params: {
                        targetPeriods: 'weekly',
                      },
                    });
                  }}
                  title={t('nutritionLogger.seeProgress') + ' →'}
                />
              </View>
            </View>
          </>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  fulfilledTipTextBlock: {
    flex: 1,
  },
  planTipProgressRow: {
    width: '100%',
    alignSelf: 'stretch',
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  planTipProgressRowFulfilled: {
    borderWidth: 1,
    borderRadius: 12,
  },
  planTipProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodSection: {
    marginTop: 6,
  },
  periodSectionHeading: {
    marginBottom: 4,
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  tipGroupHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  tipGroupHeadingText: {
    opacity: 0.9,
  },
  planTipStatusText: {
    marginTop: 4,
    marginBottom: 6,
  },
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
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 10,
  },
  progressTrackFulfilled: {
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFillFulfilled: {
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  noFulfilledTipsText: {
    marginTop: 8,
  },
  emptyTargetsContainer: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyTargetsHeading: {
    marginBottom: 8,
  },
  emptyTargetsText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  addFirstTargetButton: {
    marginTop: 12,
  },
  addTargetButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NutritionPlanTargetsSection;
